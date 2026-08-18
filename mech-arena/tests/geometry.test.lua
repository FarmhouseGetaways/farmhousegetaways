--[[
  Ground-contact test.

  The one bug this project kept hitting was mechs hovering above the ground,
  because the hip height was a number somebody typed in rather than a number
  measured off the geometry. This runs the real blueprint and bounds code out
  of MechArena.server.lua and checks that the feet land where they should.

  Run it with tests/run.sh — it needs no Roblox and no Studio.
]]

local ROOT_HALF = ROOT_SIZE.Y / 2
local failed = 0

local function check(name, got, want, tol)
	local ok = math.abs(got - want) <= (tol or 0.0001)
	print(string.format("%-44s %8.3f  %s", name, got, ok and "ok" or ("FAILED, expected " .. want)))
	if not ok then failed = failed + 1 end
end

for _, typeName in ipairs({ "SCOUT", "LASER", "HEAVY" }) do
	local b = boundsOf(typeName)
	print(("\n%s   min=%s   max=%s"):format(typeName, tostring(b.min), tostring(b.max)))

	-- The blueprint puts the soles of the feet at y = -7. If someone moves the
	-- legs and forgets, this is the line that says so.
	check(typeName .. ": feet at local y = -7", b.min.Y, -7)

	-- HipHeight must be whatever the measured geometry says, never a constant.
	check(typeName .. ": HipHeight follows bounds", hipHeightFor(typeName), -b.min.Y - ROOT_HALF)
	check(typeName .. ": HipHeight = 6", hipHeightFor(typeName), 6)

	print(("%-44s %8.3f"):format(typeName .. ": total height (studs)", b.max.Y - b.min.Y))
	print(("%-44s %8d"):format(typeName .. ": part count", #blueprint(typeName)))
end

-- Rotated parts are where hand-calculated offsets go wrong, so prove the
-- rotation is genuinely folded into the bounds rather than quietly dropped.
for _, spec in ipairs(blueprint("HEAVY")) do
	if spec.name == "RocketTube" then
		local cf     = localCFrame(spec)
		local origin = cf * Vector3.new(0, 0, 0)
		local axis   = cf * Vector3.new(1, 0, 0) - origin
		print(("\nRocketTube barrel axis %s"):format(tostring(axis)))
		check("rocket tube tilts up 20 degrees", axis.Y, math.sin(math.rad(20)), 0.002)
		check("rocket tube points forward",      axis.Z, -math.cos(math.rad(20)), 0.002)
		break
	end
end

if failed == 0 then
	print("\nAll geometry checks passed.")
else
	print(("\n%d check(s) failed."):format(failed))
	error("geometry checks failed", 0)
end
