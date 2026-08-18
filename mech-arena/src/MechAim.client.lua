--[[
===============================================================================
  MECH ARENA — AIM (client)
  Designer: Legend

  Paste this whole file into a LocalScript under
  StarterPlayer > StarterPlayerScripts.

  All this does is tell the server where your cursor is pointing, about twenty
  times a second. The server does the shooting, so nothing here can be used to
  cheat: send a silly number and it is ignored.

  Optional. Without it the game still runs — mechs just fire straight ahead
  instead of where you point.
===============================================================================
]]

local Players           = game:GetService("Players")
local RunService        = game:GetService("RunService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local player = Players.LocalPlayer
local mouse  = player:GetMouse()

local aimRemote = ReplicatedStorage:WaitForChild("MechAim")

local SEND_INTERVAL = 0.05
local lastSend = 0

RunService.RenderStepped:Connect(function()
	local now = os.clock()
	if now - lastSend < SEND_INTERVAL then return end
	lastSend = now

	local hit = mouse.Hit
	if hit then
		aimRemote:FireServer(hit.Position)
	end
end)
