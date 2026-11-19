--!strict
local Lobby = {}
Lobby.Spawn = CFrame.new(150, 5, 22)

function Lobby.build()
	local existing = workspace:FindFirstChild("MythicsLobby")
	if existing then existing:Destroy() end
	local model = Instance.new("Model")
	model.Name, model.ModelStreamingMode = "MythicsLobby", Enum.ModelStreamingMode.Persistent
	local origin = Vector3.new(150, 0, 0)
	local dark, white = Color3.fromRGB(17, 23, 42), Color3.fromRGB(222, 240, 255)
	local function part(name: string, size: Vector3, at: Vector3, color: Color3, neon: boolean?): Part
		local p = Instance.new("Part")
		p.Name, p.Size, p.Position, p.Color = name, size, origin + at, color
		p.Anchored, p.Material = true, if neon then Enum.Material.Neon else Enum.Material.SmoothPlastic
		p.TopSurface, p.BottomSurface, p.Parent = Enum.SurfaceType.Smooth, Enum.SurfaceType.Smooth, model
		return p
	end
	local function disk(radius: number, height: number, at: Vector3, color: Color3)
		local p = part("Platform", Vector3.new(height, radius*2, radius*2), at, color)
		p.Shape, p.CFrame = Enum.PartType.Cylinder, CFrame.new(origin + at)*CFrame.Angles(0, 0, math.pi/2)
		return p
	end
	local function ring(radius: number, at: Vector3, color: Color3)
		for index = 1, 48 do
			local angle = index*math.pi/24
			local p = part("LightRing", Vector3.new(0.2, 0.12, radius*math.pi/23), at + Vector3.new(math.cos(angle)*radius, 0, math.sin(angle)*radius), color, true)
			p.CFrame = CFrame.new(p.Position)*CFrame.Angles(0, -angle, 0)
			p.CanCollide = false
		end
	end
	local function title(value: string, at: Vector3, color: Color3, width: number)
		local p = part("Title", Vector3.one, at, dark)
		p.Transparency, p.CanCollide = 1, false
		local gui = Instance.new("BillboardGui")
		gui.Size, gui.MaxDistance, gui.Parent = UDim2.fromOffset(width, 50), 150, p
		local label = Instance.new("TextLabel")
		label.Size, label.BackgroundTransparency = UDim2.fromScale(1, 1), 1
		label.Text, label.TextColor3, label.TextSize, label.Font = value, color, 26, Enum.Font.GothamBlack
		label.TextStrokeTransparency, label.Parent = 0.5, gui
		return p
	end
	disk(72, 2, Vector3.new(0, -1.2, 0), dark)
	disk(67, 0.3, Vector3.new(0, -0.05, 0), Color3.fromRGB(30, 47, 153))
	ring(65, Vector3.new(0, 0.15, 0), Color3.fromRGB(46, 156, 255))
	ring(20, Vector3.new(0, 0.18, 8), Color3.fromRGB(58, 117, 230))
	for _, x in {-13, 13} do part("CourtLine", Vector3.new(0.12, 0.04, 40), Vector3.new(x, 0.18, 9), Color3.fromRGB(69, 103, 213)) end
	for _, z in {-11, 4, 29} do part("AttackLine", Vector3.new(26, 0.04, 0.12), Vector3.new(0, 0.18, z), Color3.fromRGB(69, 103, 213)) end
	for index = 0, 28 do
		local angle = math.rad(180 + index*180/14)
		local wall = part("ArenaWall", Vector3.new(14, 22, 2), Vector3.new(math.cos(angle)*66, 10, math.sin(angle)*66), Color3.fromRGB(47, 55, 85))
		wall.CFrame = CFrame.lookAt(wall.Position, origin + Vector3.new(0, 10, 0))
		for row = -2, 2 do
			local inset = part("WallInset", Vector3.new(1, 1, 0.3), Vector3.zero, dark)
			inset.CFrame = wall.CFrame*CFrame.new(0, row*3.5, -1.2)
		end
		local light = part("LightPillar", Vector3.new(0.3, 20, 0.4), Vector3.zero, Color3.fromRGB(72, 153, 255), true)
		light.CFrame = wall.CFrame*CFrame.new(6, 0, -1.3)
	end
	local function station(name: string, at: Vector3, color: Color3, action: string)
		disk(9, 0.8, at + Vector3.new(0, 0.4, 0), dark)
		ring(8, at + Vector3.new(0, 0.85, 0), color)
		local anchor = title(name, at + Vector3.new(0, 12, 0), color, 270)
		local light = Instance.new("PointLight")
		light.Color, light.Brightness, light.Range, light.Parent = color, 1.5, 22, anchor
		local interaction = part("Interaction", Vector3.new(3, 4, 3), at + Vector3.new(0, 3, 4), dark)
		interaction.Transparency, interaction.CanCollide = 1, false
		interaction:SetAttribute("LobbyPanel", action)
		local prompt = Instance.new("ProximityPrompt")
		prompt.ActionText, prompt.ObjectText = "Abrir", name
		prompt.MaxActivationDistance, prompt.RequiresLineOfSight, prompt.Parent = 10, false, interaction
	end
	local portal = Vector3.new(0, 0, -28)
	station("JOGAR", portal, white, "Play")
	for _, x in {-7.5, 7.5} do part("PortalPillar", Vector3.new(1, 15, 1), portal + Vector3.new(x, 8, 0), white, true) end
	part("PortalTop", Vector3.new(16, 1, 1), portal + Vector3.new(0, 15, 0), white, true)
	local gate = part("Portal", Vector3.new(14, 14, 0.2), portal + Vector3.new(0, 8, 0), Color3.fromRGB(163, 210, 255), true)
	gate.Transparency, gate.CanCollide = 0.45, false
	local signatures = Vector3.new(-28, 0, -16)
	station("ASSINATURAS", signatures, Color3.fromRGB(206, 77, 255), "Signatures")
	local ball = part("SignatureVolleyball", Vector3.one*7, signatures + Vector3.new(0, 6, 0), Color3.fromRGB(240, 228, 255))
	ball.Shape, ball.CanCollide = Enum.PartType.Ball, false
	for axis = 1, 3 do
		for segment = 1, 32 do
			local angle = segment*math.pi/16
			local cf = CFrame.new(origin + signatures + Vector3.new(0, 6, 0))*CFrame.Angles(if axis == 1 then math.pi/2 else 0, if axis == 2 then math.pi/2 else 0, 0)
			local seam = part("VolleyballSeam", Vector3.new(0.12, 0.72, 0.12), Vector3.zero, Color3.fromRGB(108, 42, 183))
			seam.CFrame = cf*CFrame.new(math.cos(angle)*3.52, math.sin(angle)*3.52, 0)*CFrame.Angles(0, 0, angle)
			seam.CanCollide = false
		end
	end
	local shop = Vector3.new(28, 0, -16)
	station("LOJA", shop, Color3.fromRGB(255, 207, 51), "Shop")
	part("CardFrame", Vector3.new(5, 6.5, 0.5), shop + Vector3.new(0, 6, 0), Color3.fromRGB(255, 207, 51), true)
	part("CardInset", Vector3.new(4.4, 5.9, 0.6), shop + Vector3.new(0, 6, 0), dark)
	local portrait = part("CardPortrait", Vector3.one*1.5, shop + Vector3.new(0, 7, 0.4), white)
	portrait.Shape = Enum.PartType.Ball
	part("CardName", Vector3.new(3, 0.2, 0.2), shop + Vector3.new(0, 4.2, 0.4), white, true)
	title("VOLLEYBALL MYTHICS", Vector3.new(0, 23, -52), white, 440)
	for _, x in {-39, -25} do part("NetPost", Vector3.new(0.5, 9, 0.5), Vector3.new(x, 4.5, 10), white) end
	for index = 0, 8 do part("NetMesh", Vector3.new(14, 0.04, 0.1), Vector3.new(-32, 5 + index*0.4, 10), white) end
	for index = 0, 14 do part("NetMesh", Vector3.new(0.04, 3.5, 0.1), Vector3.new(-39 + index, 6.75, 10), white) end
	part("NetTape", Vector3.new(14, 0.2, 0.2), Vector3.new(-32, 8.5, 10), white)
	for index = 1, 5 do
		local p = part("BallRackBall", Vector3.one*1.8, Vector3.new(30 + index*2, 2.5, 12), Color3.fromRGB(255, 211, 75))
		p.Shape = Enum.PartType.Ball
	end
	part("BallRack", Vector3.new(13, 0.3, 3), Vector3.new(36, 1.5, 12), dark)
	model.Parent = workspace
	return model
end
return Lobby
