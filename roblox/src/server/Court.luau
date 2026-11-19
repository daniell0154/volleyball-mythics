--!strict
local Court = {}
Court.StudsPerMeter = 3.5
Court.Origin = Vector3.new(0, 2, 0)

function Court.build(parent: Instance): Model
	local existing = parent:FindFirstChild("MythicsCourt")
	if existing then
		assert(existing:IsA("Model"), "MythicsCourt must be a Model")
		return existing
	end
	local model = Instance.new("Model")
	model.Name = "MythicsCourt"
	local scale = Court.StudsPerMeter
	local function part(name: string, size: Vector3, position: Vector3, color: Color3, collidable: boolean): Part
		local item = Instance.new("Part")
		item.Name = name
		item.Anchored = true
		item.Size = size * scale
		item.Position = Court.Origin + position * scale
		item.Color = color
		item.Material = Enum.Material.SmoothPlastic
		item.CanCollide = collidable
		item.Parent = model
		return item
	end
	local white = Color3.fromRGB(240, 243, 248)
	part("Surround", Vector3.new(17, 0.15, 28), Vector3.new(0, -0.23, 0), Color3.fromRGB(30, 72, 77), true)
	part("Floor", Vector3.new(9, 0.3, 18), Vector3.new(0, -0.15, 0), Color3.fromRGB(39, 112, 149), true)
	for _, x in { -4.5, 4.5 } do
		part("Sideline", Vector3.new(0.05, 0.01, 18), Vector3.new(x, 0.005, 0), white, false)
	end
	for _, z in { -9, -3, 0, 3, 9 } do
		part("CrossLine", Vector3.new(9, 0.01, 0.05), Vector3.new(0, 0.005, z), white, false)
	end
	for _, x in { -4.8, 4.8 } do
		part("Post", Vector3.new(0.12, 2.6, 0.12), Vector3.new(x, 1.3, 0), white, false)
	end
	local net = part("Net", Vector3.new(9, 0.9, 0.025), Vector3.new(0, 1.98, 0), Color3.fromRGB(20, 28, 40), false)
	net.Transparency = 0.65
	part("NetTape", Vector3.new(9, 0.05, 0.04), Vector3.new(0, 2.405, 0), white, false)
	local ball = part("Ball", Vector3.new(0.22, 0.22, 0.22), Vector3.new(0, 1.6, -6.8), Color3.fromRGB(255, 209, 66), false)
	ball.Shape = Enum.PartType.Ball
	model:SetAttribute("StudsPerMeter", scale)
	model:SetAttribute("RulesVersion", 4)
	model.Parent = parent
	return model
end

return Court
