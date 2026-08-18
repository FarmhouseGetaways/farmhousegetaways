--[[
===============================================================================
  MECH ARENA — SERVER SCRIPT
  Designer: Legend

  Paste this whole file into a Script in ServerScriptService.
  In the Studio editor: click in the code, Ctrl+A, then Ctrl+V over it.

  Companion file: MechAim.client.lua goes in a LocalScript under
  StarterPlayer > StarterPlayerScripts. It is optional. Without it the mechs
  fire straight ahead instead of where you are pointing; everything else
  works the same.

  Two manual Studio settings this script cannot set for you:
    - Lighting > Technology = Future   (real shadows, working neon glow)
    - Game Settings > Avatar > R15     (the rig this script expects)
===============================================================================
]]

local Players           = game:GetService("Players")
local RunService        = game:GetService("RunService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Lighting          = game:GetService("Lighting")
local Debris            = game:GetService("Debris")

local RNG = Random.new()

--=============================================================================
-- 1. MECH TYPES
--=============================================================================

--@geometry-begin  (tests/geometry.test.lua reads between these markers)
local MECHS = {
	SCOUT = {
		body       = Color3.fromRGB(46, 92, 52),
		trim       = Color3.fromRGB(126, 255, 102),
		health     = 320,
		walkSpeed  = 30,
		jumpPower  = 80,
		weapon     = "hitscan",
		cooldown   = 0.09,
		damage     = 8,
		spread     = 2.5,
		range      = 500,
		tracer     = 0.18,
		tracerLife = 0.05,
	},
	LASER = {
		body       = Color3.fromRGB(28, 42, 82),
		trim       = Color3.fromRGB(255, 140, 40),
		health     = 500,
		walkSpeed  = 22,
		jumpPower  = 65,
		weapon     = "hitscan",
		cooldown   = 0.95,
		damage     = 60,
		spread     = 0,
		range      = 700,
		tracer     = 0.9,
		tracerLife = 0.14,
	},
	HEAVY = {
		body            = Color3.fromRGB(94, 30, 30),
		trim            = Color3.fromRGB(200, 200, 205),
		health          = 850,
		walkSpeed       = 15,
		jumpPower       = 45,
		weapon          = "rocket",
		cooldown        = 1.6,
		damage          = 85,
		splashRadius    = 16,
		projectileSpeed = 190,
		spread          = 1.2,
		range           = 600,
	},
}

local TYPE_ORDER = { "SCOUT", "LASER", "HEAVY" }

-- Where each type's shots come out of, in mech-local space.
local MUZZLES = {
	SCOUT = { Vector3.new(-4.6, -1.4, -6.0), Vector3.new(4.6, -1.4, -6.0) },
	LASER = { Vector3.new( 4.6,  7.2, -6.2) },
	HEAVY = { Vector3.new(-1.3,  7.6, -1.0), Vector3.new(1.3, 7.6, -1.0) },
}

-- The mech's collision proxy. The avatar underneath is hidden entirely and
-- this box is what the world actually bumps into.
local ROOT_SIZE = Vector3.new(6, 2, 3)

local MECH_RESPAWN   = 20    -- seconds before a claimed mech returns
local BREAK_FRACTION = 0.25  -- suit falls apart below this share of its health
local KO_CREDIT_TIME = 10    -- how long an attacker stays on the hook for a KO

--=============================================================================
-- 2. BLUEPRINT
--
-- One list of part specifications per type, in mech-local space, with the
-- origin at the HumanoidRootPart — roughly the waist. Everything else in this
-- script is measured from these numbers, including how high the humanoid has
-- to stand for the feet to touch the ground. Move the geometry and ground
-- contact follows it. There is no hand-tuned height constant to keep in sync.
--=============================================================================

local function blueprint(typeName)
	local cfg  = MECHS[typeName]
	local body, trim = cfg.body, cfg.trim
	local specs = {}

	local function add(name, size, offset, color, material, shape, rot)
		table.insert(specs, {
			name     = name,
			size     = size,
			offset   = offset,
			color    = color or body,
			material = material or Enum.Material.Metal,
			shape    = shape or Enum.PartType.Block,
			rot      = rot or Vector3.new(0, 0, 0),
		})
	end

	-- Legs. Feet bottom out at y = -7.
	for _, side in ipairs({ -1, 1 }) do
		add("Foot",  Vector3.new(2.6, 1.0, 4.4), Vector3.new(side * 2.2, -6.5, -0.4))
		add("Shin",  Vector3.new(2.0, 3.6, 2.0), Vector3.new(side * 2.2, -4.3,  0.0))
		add("Knee",  Vector3.new(2.3, 1.3, 2.3), Vector3.new(side * 2.2, -2.4,  0.0), trim, Enum.Material.Neon)
		add("Thigh", Vector3.new(2.5, 3.2, 2.5), Vector3.new(side * 2.2, -0.7,  0.0))
	end

	-- Body
	add("Hips",     Vector3.new(5.8, 2.2, 3.2), Vector3.new(0, 1.2,  0.0))
	add("Chest",    Vector3.new(7.0, 4.6, 4.2), Vector3.new(0, 4.2,  0.0))
	add("Core",     Vector3.new(1.6, 1.6, 1.6), Vector3.new(0, 4.4, -2.3), trim, Enum.Material.Neon, Enum.PartType.Ball)
	add("Backpack", Vector3.new(4.4, 3.2, 1.8), Vector3.new(0, 4.6,  2.9))

	-- Arms
	for _, side in ipairs({ -1, 1 }) do
		add("Shoulder", Vector3.new(2.6, 2.6, 3.6), Vector3.new(side * 4.6,  5.4, 0))
		add("UpperArm", Vector3.new(2.1, 3.4, 2.1), Vector3.new(side * 4.6,  2.6, 0))
		add("Elbow",    Vector3.new(2.2, 1.2, 2.2), Vector3.new(side * 4.6,  0.7, 0), trim, Enum.Material.Neon)
		add("Forearm",  Vector3.new(2.4, 3.2, 2.4), Vector3.new(side * 4.6, -1.2, 0))
	end

	-- Head
	add("Neck",  Vector3.new(1.6, 1.0, 1.6), Vector3.new(0, 6.9,  0.00))
	add("Head",  Vector3.new(3.0, 2.4, 3.2), Vector3.new(0, 8.2,  0.00))
	add("Visor", Vector3.new(2.2, 0.8, 0.4), Vector3.new(0, 8.3, -1.75), trim, Enum.Material.Neon)

	-- Weapons. Cylinders run along their own X axis, so a barrel pointing
	-- forward is a cylinder yawed 90 degrees.
	if typeName == "SCOUT" then
		for _, side in ipairs({ -1, 1 }) do
			add("Minigun", Vector3.new(5.2, 1.4, 1.4), Vector3.new(side * 4.6, -1.4, -3.2),
				nil, Enum.Material.DiamondPlate, Enum.PartType.Cylinder, Vector3.new(0, 90, 0))
			add("MuzzleRing", Vector3.new(0.4, 1.5, 1.5), Vector3.new(side * 4.6, -1.4, -5.7),
				trim, Enum.Material.Neon, Enum.PartType.Cylinder, Vector3.new(0, 90, 0))
		end
	elseif typeName == "LASER" then
		add("CannonMount", Vector3.new(2.0, 1.6, 2.0), Vector3.new(4.6, 7.2, 0.0))
		add("Cannon", Vector3.new(6.6, 1.9, 1.9), Vector3.new(4.6, 7.2, -2.4),
			nil, Enum.Material.DiamondPlate, Enum.PartType.Cylinder, Vector3.new(0, 90, 0))
		add("CannonTip", Vector3.new(0.5, 1.7, 1.7), Vector3.new(4.6, 7.2, -5.9),
			trim, Enum.Material.Neon, Enum.PartType.Cylinder, Vector3.new(0, 90, 0))
	elseif typeName == "HEAVY" then
		for _, x in ipairs({ -1.3, 1.3 }) do
			for _, y in ipairs({ 5.9, 7.5 }) do
				-- Tilted up 20 degrees so the pods fire over the shoulder.
				add("RocketTube", Vector3.new(4.2, 1.5, 1.5), Vector3.new(x, y, 3.4),
					nil, Enum.Material.DiamondPlate, Enum.PartType.Cylinder, Vector3.new(20, 90, 0))
				add("TubeMouth", Vector3.new(0.4, 1.6, 1.6), Vector3.new(x, y + 0.72, 1.43),
					trim, Enum.Material.Neon, Enum.PartType.Cylinder, Vector3.new(20, 90, 0))
			end
		end
	end

	return specs
end

--=============================================================================
-- 3. MEASURING THE MECH
--
-- This is the fix for the floating bug. Rather than trusting a hand-written
-- hip height, walk every corner of every part through its own rotation and
-- find where the geometry actually ends. The humanoid is then told to stand
-- exactly that far off the ground.
--=============================================================================

local CORNERS = {}
for _, x in ipairs({ -1, 1 }) do
	for _, y in ipairs({ -1, 1 }) do
		for _, z in ipairs({ -1, 1 }) do
			table.insert(CORNERS, Vector3.new(x, y, z))
		end
	end
end

local function localCFrame(spec)
	return CFrame.new(spec.offset)
		* CFrame.Angles(math.rad(spec.rot.X), math.rad(spec.rot.Y), math.rad(spec.rot.Z))
end

local boundsCache = {}

local function boundsOf(typeName)
	local cached = boundsCache[typeName]
	if cached then return cached end

	local minV = Vector3.new( math.huge,  math.huge,  math.huge)
	local maxV = Vector3.new(-math.huge, -math.huge, -math.huge)

	for _, spec in ipairs(blueprint(typeName)) do
		local cf = localCFrame(spec)
		local h  = spec.size / 2
		for _, c in ipairs(CORNERS) do
			local p = cf * Vector3.new(c.X * h.X, c.Y * h.Y, c.Z * h.Z)
			minV = Vector3.new(math.min(minV.X, p.X), math.min(minV.Y, p.Y), math.min(minV.Z, p.Z))
			maxV = Vector3.new(math.max(maxV.X, p.X), math.max(maxV.Y, p.Y), math.max(maxV.Z, p.Z))
		end
	end

	cached = { min = minV, max = maxV }
	boundsCache[typeName] = cached
	return cached
end

-- Humanoid.HipHeight on an R15 rig is the gap between the ground and the
-- underside of the HumanoidRootPart. The feet sit at bounds.min.Y in local
-- space, so that gap is everything between the feet and the bottom of the box.
local function hipHeightFor(typeName)
	return -boundsOf(typeName).min.Y - (ROOT_SIZE.Y / 2)
end
--@geometry-end

--=============================================================================
-- 4. BUILDING PARTS
--=============================================================================

local function buildPart(spec)
	local p = Instance.new("Part")
	p.Name         = spec.name
	p.Size         = spec.size
	p.Color        = spec.color
	p.Material     = spec.material
	p.Shape        = spec.shape
	p.CanCollide   = false
	p.CanTouch     = false
	p.TopSurface   = Enum.SurfaceType.Smooth
	p.BottomSurface= Enum.SurfaceType.Smooth
	p.Massless     = true

	if spec.material == Enum.Material.Neon then
		local light = Instance.new("PointLight")
		light.Color     = spec.color
		light.Range     = 12
		light.Brightness = 1.4
		light.Parent    = p
	end

	return p
end

--=============================================================================
-- 5. STATUES — the unmanned mechs standing in the field
--=============================================================================

local statues = {}  -- [Model] = { typeName, baseCFrame, claimed }

local function buildStatue(typeName, baseCFrame)
	local bounds   = boundsOf(typeName)
	-- baseCFrame sits on the ground; lift the mech's origin so its feet meet it.
	local originCF = baseCFrame * CFrame.new(0, -bounds.min.Y, 0)

	local model = Instance.new("Model")
	model.Name = typeName .. "Mech"

	for _, spec in ipairs(blueprint(typeName)) do
		local p = buildPart(spec)
		p.Anchored = true
		p.CFrame   = originCF * localCFrame(spec)
		p.Parent   = model
	end

	-- A single invisible box does the touch detection, so a player only has to
	-- reach the mech rather than find one particular plate of it.
	local size   = bounds.max - bounds.min + Vector3.new(2, 0, 2)
	local centre = (bounds.max + bounds.min) / 2

	local hitbox = Instance.new("Part")
	hitbox.Name         = "Hitbox"
	hitbox.Size         = size
	hitbox.CFrame       = originCF * CFrame.new(centre)
	hitbox.Anchored     = true
	hitbox.CanCollide   = false
	hitbox.CanQuery     = false   -- shots pass through, they hit the real plates
	hitbox.Transparency = 1
	hitbox.Parent       = model

	local label = Instance.new("BillboardGui")
	label.Name          = "Label"
	label.Size          = UDim2.fromScale(10, 2)
	label.StudsOffset   = Vector3.new(0, bounds.max.Y - centre.Y + 3, 0)
	label.AlwaysOnTop   = true
	label.MaxDistance   = 300
	label.Adornee       = hitbox
	label.Parent        = hitbox

	local text = Instance.new("TextLabel")
	text.Size                   = UDim2.fromScale(1, 1)
	text.BackgroundTransparency = 1
	text.Font                   = Enum.Font.GothamBold
	text.Text                   = typeName
	text.TextColor3             = MECHS[typeName].trim
	text.TextStrokeTransparency = 0.4
	text.TextScaled             = true
	text.Parent                 = label

	model.PrimaryPart = hitbox
	model.Parent      = workspace

	statues[model] = { typeName = typeName, baseCFrame = baseCFrame, claimed = false }
	return model, hitbox
end

--=============================================================================
-- 6. PILOTING
--=============================================================================

local state = {}   -- [Player] = { mechType, folder, tool, firing, aimPoint, ... }

local function stateFor(player)
	local s = state[player]
	if not s then
		s = { firing = false, shotIndex = 0, lastFire = 0 }
		state[player] = s
	end
	return s
end

local function showAvatar(char, visible)
	local hrp = char:FindFirstChild("HumanoidRootPart")
	for _, d in ipairs(char:GetDescendants()) do
		if d:IsA("BasePart") and d ~= hrp then
			d.Transparency = visible and 0 or 1
			d.CanCollide   = visible
		elseif d:IsA("Decal") or d:IsA("Texture") then
			d.Transparency = visible and 0 or 1
		end
	end
	if hrp then
		hrp.Transparency = 1
		hrp.CanCollide   = not visible   -- the root box collides only as a mech
	end
end

local function unequipMech(player)
	local s = stateFor(player)
	if not s.mechType then return end

	if s.folder then s.folder:Destroy() end
	if s.tool   then s.tool:Destroy()   end
	s.folder, s.tool = nil, nil
	s.mechType = nil
	s.firing   = false

	local char = player.Character
	if char then
		local hum = char:FindFirstChildOfClass("Humanoid")
		local hrp = char:FindFirstChild("HumanoidRootPart")
		showAvatar(char, true)
		if hrp and s.originalRootSize then hrp.Size = s.originalRootSize end
		if hum then
			hum.HipHeight = s.originalHipHeight or 2
			hum.WalkSpeed = 16
			hum.UseJumpPower = true
			hum.JumpPower = 50
			hum.MaxHealth = 100
			hum.Health    = 100
		end
	end
end

local function equipMech(player, typeName)
	local char = player.Character
	if not char then return end
	local hum = char:FindFirstChildOfClass("Humanoid")
	local hrp = char:FindFirstChild("HumanoidRootPart")
	if not hum or not hrp or hum.Health <= 0 then return end

	local s = stateFor(player)
	if not s.originalRootSize then
		s.originalRootSize  = hrp.Size
		s.originalHipHeight = hum.HipHeight
	end

	unequipMech(player)

	local cfg = MECHS[typeName]

	showAvatar(char, false)
	hrp.Size       = ROOT_SIZE
	hrp.CanCollide = true

	local folder = Instance.new("Folder")   -- a Folder, not a Model, so a shot
	folder.Name  = "Mech"                   -- traces back to the character
	folder.Parent = char

	for _, spec in ipairs(blueprint(typeName)) do
		local p = buildPart(spec)
		p.CFrame  = hrp.CFrame * localCFrame(spec)
		p.Parent  = folder

		local weld = Instance.new("WeldConstraint")
		weld.Part0  = hrp
		weld.Part1  = p
		weld.Parent = p
	end

	hum.AutomaticScalingEnabled = false
	hum.HipHeight   = hipHeightFor(typeName)
	hum.WalkSpeed   = cfg.walkSpeed
	hum.UseJumpPower = true
	hum.JumpPower   = cfg.jumpPower
	hum.MaxHealth   = cfg.health
	hum.Health      = cfg.health

	-- A handle-less Tool is how a click reaches the server without needing a
	-- LocalScript. Activated fires server-side the moment the player clicks.
	local tool = Instance.new("Tool")
	tool.Name             = typeName
	tool.RequiresHandle   = false
	tool.CanBeDropped     = false
	tool.ManualActivationOnly = false
	tool.Parent           = player.Backpack

	tool.Activated:Connect(function()   s.firing = true  end)
	tool.Deactivated:Connect(function() s.firing = false end)
	tool.Unequipped:Connect(function()  s.firing = false end)

	hum:EquipTool(tool)

	s.mechType  = typeName
	s.folder    = folder
	s.tool      = tool
	s.shotIndex = 0
end

--=============================================================================
-- 7. WEAPONS
--=============================================================================

local aimRemote = ReplicatedStorage:FindFirstChild("MechAim")
if not aimRemote then
	aimRemote = Instance.new("RemoteEvent")
	aimRemote.Name   = "MechAim"
	aimRemote.Parent = ReplicatedStorage
end

aimRemote.OnServerEvent:Connect(function(player, point)
	if typeof(point) ~= "Vector3" then return end
	if point.Magnitude > 100000 then return end
	stateFor(player).aimPoint = point
end)

local damageLog = {}   -- [Player] = { attacker = Player, time = clock }

local function creditKO(victim)
	local log = damageLog[victim]
	if not log then return end
	if os.clock() - log.time > KO_CREDIT_TIME then return end

	local attacker = log.attacker
	if not attacker or attacker == victim or not attacker.Parent then return end

	local stats = attacker:FindFirstChild("leaderstats")
	local kos   = stats and stats:FindFirstChild("KOs")
	if kos then kos.Value += 1 end
end

local function tracer(a, b, colour, thickness, life)
	local delta = b - a
	if delta.Magnitude < 0.1 then return end

	local p = Instance.new("Part")
	p.Anchored   = true
	p.CanCollide = false
	p.CanQuery   = false
	p.CanTouch   = false
	p.Material   = Enum.Material.Neon
	p.Color      = colour
	p.Size       = Vector3.new(thickness, thickness, delta.Magnitude)
	p.CFrame     = CFrame.lookAt(a + delta / 2, b)
	p.Parent     = workspace

	Debris:AddItem(p, life)
end

local function applyDamage(attacker, targetChar, amount)
	local hum = targetChar:FindFirstChildOfClass("Humanoid")
	if not hum or hum.Health <= 0 then return end

	local victim = Players:GetPlayerFromCharacter(targetChar)
	if victim == attacker then return end
	if victim then
		damageLog[victim] = { attacker = attacker, time = os.clock() }
	end

	hum:TakeDamage(amount)
end

local function explosionEffect(position)
	local blast = Instance.new("Part")
	blast.Shape        = Enum.PartType.Ball
	blast.Size         = Vector3.new(4, 4, 4)
	blast.Position     = position
	blast.Anchored     = true
	blast.CanCollide   = false
	blast.CanQuery     = false
	blast.CanTouch     = false
	blast.Material     = Enum.Material.Neon
	blast.Color        = Color3.fromRGB(255, 170, 60)
	blast.Parent       = workspace
	Debris:AddItem(blast, 0.35)

	task.spawn(function()
		for i = 1, 8 do
			blast.Size         = Vector3.new(4, 4, 4) * (1 + i * 0.55)
			blast.Transparency = i / 9
			task.wait(0.03)
		end
	end)
end

local function detonate(attacker, position, cfg)
	explosionEffect(position)

	local hit = {}
	for _, part in ipairs(workspace:GetPartBoundsInRadius(position, cfg.splashRadius)) do
		local char = part:FindFirstAncestorOfClass("Model")
		if char and char:FindFirstChildOfClass("Humanoid") and not hit[char] then
			hit[char] = true
			local root = char:FindFirstChild("HumanoidRootPart")
			local dist = root and (root.Position - position).Magnitude or cfg.splashRadius
			local falloff = math.clamp(1 - (dist / cfg.splashRadius), 0.3, 1)
			applyDamage(attacker, char, cfg.damage * falloff)
		end
	end
end

local function launchRocket(attacker, char, origin, direction, cfg)
	local rocket = Instance.new("Part")
	rocket.Size       = Vector3.new(0.9, 0.9, 3)
	rocket.CFrame     = CFrame.lookAt(origin, origin + direction)
	rocket.Anchored   = true
	rocket.CanCollide = false
	rocket.CanQuery   = false
	rocket.CanTouch   = false
	rocket.Material   = Enum.Material.Neon
	rocket.Color      = Color3.fromRGB(255, 190, 90)
	rocket.Parent     = workspace

	local params = RaycastParams.new()
	params.FilterType = Enum.RaycastFilterType.Exclude
	params.FilterDescendantsInstances = { char, rocket }

	local position  = origin
	local travelled = 0
	local connection

	connection = RunService.Heartbeat:Connect(function(dt)
		local step   = cfg.projectileSpeed * math.min(dt, 0.1)
		local result = workspace:Raycast(position, direction * step, params)

		if result then
			connection:Disconnect()
			rocket:Destroy()
			detonate(attacker, result.Position, cfg)
			return
		end

		position  = position + direction * step
		travelled = travelled + step
		rocket.CFrame = CFrame.lookAt(position, position + direction)

		if travelled >= cfg.range then
			connection:Disconnect()
			rocket:Destroy()
			detonate(attacker, position, cfg)
		end
	end)
end

local function spread(direction, degrees)
	if degrees <= 0 then return direction end
	local base = CFrame.lookAt(Vector3.zero, direction)
	local a = math.rad(RNG:NextNumber(-degrees, degrees))
	local b = math.rad(RNG:NextNumber(-degrees, degrees))
	return (base * CFrame.Angles(a, b, 0)).LookVector
end

local function fireWeapon(player)
	local s = stateFor(player)
	local cfg = MECHS[s.mechType]
	local char = player.Character
	if not char then return end
	local hrp = char:FindFirstChild("HumanoidRootPart")
	if not hrp then return end

	local muzzles = MUZZLES[s.mechType]
	s.shotIndex = s.shotIndex + 1
	local muzzle = muzzles[((s.shotIndex - 1) % #muzzles) + 1]
	local origin = (hrp.CFrame * CFrame.new(muzzle)).Position

	-- Aim at the client's cursor when the companion LocalScript is present,
	-- otherwise straight out of the mech's chest.
	local target = s.aimPoint or (hrp.CFrame * CFrame.new(0, 0, -200)).Position
	local delta  = target - origin
	if delta.Magnitude < 1 then return end

	local direction = spread(delta.Unit, cfg.spread)

	if cfg.weapon == "rocket" then
		launchRocket(player, char, origin, direction, cfg)
		return
	end

	local params = RaycastParams.new()
	params.FilterType = Enum.RaycastFilterType.Exclude
	params.FilterDescendantsInstances = { char }

	local result = workspace:Raycast(origin, direction * cfg.range, params)
	local endPoint = result and result.Position or (origin + direction * cfg.range)

	if result then
		local hitModel = result.Instance:FindFirstAncestorOfClass("Model")
		if hitModel and hitModel ~= char and hitModel:FindFirstChildOfClass("Humanoid") then
			applyDamage(player, hitModel, cfg.damage)
		end
	end

	tracer(origin, endPoint, cfg.trim, cfg.tracer, cfg.tracerLife)
end

RunService.Heartbeat:Connect(function()
	local now = os.clock()
	for player, s in pairs(state) do
		if s.firing and s.mechType and player.Parent then
			local cfg = MECHS[s.mechType]
			if now - s.lastFire >= cfg.cooldown then
				s.lastFire = now
				fireWeapon(player)
			end
		end
	end
end)

--=============================================================================
-- 8. SUIT DESTRUCTION
--=============================================================================

local function breakSuit(player)
	local s = stateFor(player)
	local typeName = s.mechType
	if not typeName then return end

	local char = player.Character
	if char then
		local hrp = char:FindFirstChild("HumanoidRootPart")
		if hrp then
			explosionEffect(hrp.Position)
		end
	end

	creditKO(player)
	unequipMech(player)
end

--=============================================================================
-- 9. CLAIMING A MECH
--=============================================================================

local SPAWN_POINTS = {}
for i = 0, 5 do
	local a = math.rad(i * 60)
	table.insert(SPAWN_POINTS, Vector3.new(math.cos(a) * 160, 0, math.sin(a) * 160))
end
table.insert(SPAWN_POINTS, Vector3.new( 80, 0,   0))
table.insert(SPAWN_POINTS, Vector3.new(-80, 0,   0))
table.insert(SPAWN_POINTS, Vector3.new(  0, 0,  80))
table.insert(SPAWN_POINTS, Vector3.new(  0, 0, -80))
-- Deliberately no point at the world origin: that is the player spawn pad, and
-- a mech sitting inside it used to hand everybody a suit the moment they joined.

local spawnStatue   -- forward declaration, it reschedules itself

local function claimStatue(model, player)
	local info = statues[model]
	if not info or info.claimed then return end

	local char = player.Character
	local hum  = char and char:FindFirstChildOfClass("Humanoid")
	if not hum or hum.Health <= 0 then return end

	local s = stateFor(player)

	if s.mechType == info.typeName then
		-- Same type: top the suit back up rather than rebuilding it.
		if hum.Health >= hum.MaxHealth then return end
		hum.Health = hum.MaxHealth
	else
		equipMech(player, info.typeName)
	end

	info.claimed = true
	statues[model] = nil
	model:Destroy()

	task.delay(MECH_RESPAWN, function()
		spawnStatue(info.index, info.typeName)
	end)
end

function spawnStatue(index, typeName)
	local position = SPAWN_POINTS[index]
	local facing   = CFrame.lookAt(position, Vector3.new(0, position.Y, 0))

	local model, hitbox = buildStatue(typeName, facing)
	statues[model].index = index

	local debounce = {}
	hitbox.Touched:Connect(function(hit)
		local char   = hit:FindFirstAncestorOfClass("Model")
		local player = char and Players:GetPlayerFromCharacter(char)
		if not player then return end

		local now = os.clock()
		if debounce[player] and now - debounce[player] < 0.5 then return end
		debounce[player] = now

		claimStatue(model, player)
	end)
end

--=============================================================================
-- 10. THE MAP
--=============================================================================

local function buildMap()
	for _, obj in ipairs(workspace:GetChildren()) do
		if obj.Name == "Baseplate" or obj:IsA("SpawnLocation") or obj.Name == "Arena" then
			obj:Destroy()
		end
	end

	local arena = Instance.new("Folder")
	arena.Name   = "Arena"
	arena.Parent = workspace

	local field = Instance.new("Part")
	field.Name       = "Field"
	field.Size       = Vector3.new(450, 4, 450)
	field.Position   = Vector3.new(0, -2, 0)   -- top face at y = 0
	field.Anchored   = true
	field.Material   = Enum.Material.Grass
	field.Color      = Color3.fromRGB(86, 122, 62)
	field.TopSurface = Enum.SurfaceType.Smooth
	field.Parent     = arena

	local pad = Instance.new("SpawnLocation")
	pad.Name        = "CentrePad"
	pad.Size        = Vector3.new(24, 2, 24)
	pad.Position    = Vector3.new(0, 1, 0)
	pad.Anchored    = true
	pad.Material    = Enum.Material.Concrete
	pad.Color       = Color3.fromRGB(150, 150, 155)
	pad.TopSurface  = Enum.SurfaceType.Smooth
	pad.Neutral     = true
	pad.Duration    = 0
	pad.Parent      = arena

	for index = 1, #SPAWN_POINTS do
		local typeName = TYPE_ORDER[((index - 1) % #TYPE_ORDER) + 1]
		spawnStatue(index, typeName)
	end

	Lighting.ClockTime  = 14
	Lighting.Brightness = 2
	Lighting.FogStart   = 250
	Lighting.FogEnd     = 900
	Lighting.FogColor   = Color3.fromRGB(178, 198, 214)
	Lighting.GlobalShadows = true
	Lighting.OutdoorAmbient = Color3.fromRGB(120, 125, 135)
end

--=============================================================================
-- 11. PLAYERS
--=============================================================================

local function onCharacter(player, char)
	local s = stateFor(player)
	s.mechType = nil
	s.folder   = nil
	s.tool     = nil
	s.firing   = false
	s.originalRootSize  = nil
	s.originalHipHeight = nil

	local hum = char:WaitForChild("Humanoid")

	hum.HealthChanged:Connect(function(health)
		local st = stateFor(player)
		if not st.mechType then return end
		if health > 0 and health < hum.MaxHealth * BREAK_FRACTION then
			breakSuit(player)
		end
	end)

	hum.Died:Connect(function()
		creditKO(player)
		local st = stateFor(player)
		if st.folder then st.folder:Destroy() end
		if st.tool   then st.tool:Destroy()   end
		st.mechType, st.folder, st.tool = nil, nil, nil
		st.firing = false
	end)
end

Players.PlayerAdded:Connect(function(player)
	local stats = Instance.new("Folder")
	stats.Name = "leaderstats"

	local kos = Instance.new("IntValue")
	kos.Name   = "KOs"
	kos.Value  = 0
	kos.Parent = stats

	stats.Parent = player

	player.CharacterAdded:Connect(function(char) onCharacter(player, char) end)
	if player.Character then onCharacter(player, player.Character) end
end)

Players.PlayerRemoving:Connect(function(player)
	state[player]     = nil
	damageLog[player] = nil
end)

buildMap()

print("[Mech Arena] Ready. Hip heights: "
	.. ("SCOUT %.2f  LASER %.2f  HEAVY %.2f"):format(
		hipHeightFor("SCOUT"), hipHeightFor("LASER"), hipHeightFor("HEAVY")))
