--!strict
local Court = require(script.Parent.Court)
Court.build(workspace)
local spawn = workspace:FindFirstChild("SpawnLocation")
if spawn and spawn:IsA("SpawnLocation") then
	spawn.Position = Vector3.new(0, 3, -40)
end
