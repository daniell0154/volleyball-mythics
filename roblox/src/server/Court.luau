--!strict
local Court = {}
Court.StudsPerMeter = 3.5
Court.Origin = Vector3.new(0, 2, 0)

function Court.build(parent: Instance): Model
	local existing = parent:FindFirstChild("MythicsCourt")
	if existing then
		assert(existing:IsA("Model"), "MythicsCourt must be a Model")
		if existing:GetAttribute("VisualRevision") == 2 then return existing end
		existing:Destroy()
	end
	local model = Instance.new("Model")
	model.Name = "MythicsCourt"
	model.ModelStreamingMode = Enum.ModelStreamingMode.Persistent
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
	part("Grass", Vector3.new(55, 0.2, 60), Vector3.new(0, -0.25, 0), Color3.fromRGB(99, 128, 90), true)
	part("Surround", Vector3.new(13, 0.1, 22), Vector3.new(0, -0.1, 0), Color3.fromRGB(219, 140, 88), true)
	part("Floor", Vector3.new(9, 0.04, 18), Vector3.new(0, -0.03, 0), Color3.fromRGB(75, 145, 149), true)
	for _, x in { -4.5, 4.5 } do
		part("Sideline", Vector3.new(0.05, 0.01, 18), Vector3.new(x, 0.005, 0), white, false)
	end
	for _, z in { -9, -3, 0, 3, 9 } do
		part("CrossLine", Vector3.new(9, 0.01, 0.05), Vector3.new(0, 0.005, z), white, false)
	end
	for _, x in { -5, 5 } do
		part("Post", Vector3.new(0.12, 2.6, 0.12), Vector3.new(x, 1.3, 0), white, false)
	end
	local meshColor = Color3.fromRGB(248, 245, 228)
	for row = 0, 8 do
		part("NetRow", Vector3.new(10, 0.015, 0.015), Vector3.new(0, 1.43 + row * 0.125, 0), meshColor, false)
	end
	for column = 0, 40 do
		part("NetColumn", Vector3.new(0.015, 1, 0.015), Vector3.new(-5 + column * 0.25, 1.93, 0), meshColor, false)
	end
	part("NetTape", Vector3.new(10.2, 0.06, 0.05), Vector3.new(0, 2.43, 0), white, false)
	part("School", Vector3.new(26, 8, 5), Vector3.new(0, 4, -19), Color3.fromRGB(230, 207, 172), true)
	part("Roof", Vector3.new(27, 0.4, 6), Vector3.new(0, 8.2, -19), Color3.fromRGB(106, 102, 115), true)
	for _, y in { 2, 5.5 } do
		for x = -10, 10, 4 do
			part("Window", Vector3.new(2, 1.8, 0.05), Vector3.new(x, y, -16.45), Color3.fromRGB(77, 113, 136), false)
		end
	end
	part("Door", Vector3.new(2, 3, 0.1), Vector3.new(0, 1.5, -16.4), Color3.fromRGB(88, 75, 68), false)
	local ball = part("Ball", Vector3.new(0.22, 0.22, 0.22), Vector3.new(0, 1.6, -6.8), Color3.fromRGB(255, 209, 66), false)
	ball.Shape = Enum.PartType.Ball
	model:SetAttribute("StudsPerMeter", scale)
	model:SetAttribute("RulesVersion", 4)
	model:SetAttribute("VisualRevision", 2)
	model.Parent = parent
	return model
end

return Court
