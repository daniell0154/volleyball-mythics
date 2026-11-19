--!strict
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local HttpService = game:GetService("HttpService")
local Lighting = game:GetService("Lighting")
local Runtime = require(script.Parent.Runtime)
local Court = require(script.Parent.Court)
local Lobby = require(script.Parent.Lobby)
local LobbyServices = require(script.Parent.LobbyServices)
local Config = require(ReplicatedStorage.MythicsShared.Config)
local Server = {}

function Server.start()
	Players.CharacterAutoLoads = false
	Court.build(workspace)
	Lobby.build()
	Lighting.ClockTime, Lighting.Brightness = 16.5, 2
	Lighting.Ambient = Color3.fromRGB(150, 163, 146)
	Lighting.OutdoorAmbient = Lighting.Ambient
	local sky = Instance.new("Atmosphere")
	sky.Color, sky.Density, sky.Parent = Color3.fromRGB(144, 201, 237), 0.15, Lighting
	local remoteFolder = Instance.new("Folder")
	remoteFolder.Name, remoteFolder.Parent = "MythicsRemotes", ReplicatedStorage
	LobbyServices.start(remoteFolder)
	local function remote(className: string, name: string): any
		local item = Instance.new(className)
		item.Name, item.Parent = name, remoteFolder
		return item
	end
	local command = remote("RemoteEvent", "Command")
	local movement = remote("UnreliableRemoteEvent", "Movement")
	-- Full snapshots include event history. Keep them reliable until a bounded compact codec exists.
	local snapshot = remote("RemoteEvent", "Snapshot")
	local reliable = remote("RemoteEvent", "State")
	local templates = Instance.new("Folder")
	templates.Name, templates.Parent = "MythicsActors", ReplicatedStorage
	local session: any = nil
	local owner: Player? = nil
	local lastPhase = ""
	local budgets: { [Player]: any } = {}
	local channelSeq: any = { movement = 0, action = 0 }
	local loading: { [Player]: boolean } = {}
	local function spawnLobby(player: Player)
		if loading[player] or not player.Parent then return end
		loading[player] = true
		local ok = pcall(function() player:LoadCharacterAsync() end)
		loading[player] = nil
		if ok and player.Character then
			if player == owner then player.Character:Destroy() else player.Character:PivotTo(Lobby.Spawn) end
		end
	end
	local function added(player: Player)
		player.DevComputerMovementMode = Enum.DevComputerMovementMode.Scriptable
		player.DevTouchMovementMode = Enum.DevTouchMovementMode.Scriptable
		player.CharacterAdded:Connect(function(character)
			local humanoid = character:WaitForChild("Humanoid", 10)
			if humanoid and humanoid:IsA("Humanoid") then
				humanoid.Died:Connect(function() task.delay(3, function() if player ~= owner then spawnLobby(player) end end) end)
			end
		end)
		task.spawn(spawnLobby, player)
	end
	Players.PlayerAdded:Connect(added)
	for _, player in Players:GetPlayers() do added(player) end
	local function permit(player: Player, category: string, limit: number): boolean
		local budget = budgets[player]
		if not budget then budget = {} budgets[player] = budget end
		local now = os.clock()
		local bucket = budget[category]
		if not bucket or now - bucket.since >= 1 then
			bucket = { since = now, count = 0 }
			budget[category] = bucket
		end
		bucket.count += 1
		return bucket.count <= limit
	end
	local function buildActors(player: Player, match: any)
		for _, child in templates:GetChildren() do child:Destroy() end
		local description: HumanoidDescription? = nil
		local ok, result = pcall(function() return Players:GetHumanoidDescriptionFromUserIdAsync(player.UserId) end)
		if ok then description = result end
		for _, athlete in match.athletes do
			if session ~= match then break end
			local appearance = if not athlete.bot and description then description else Instance.new("HumanoidDescription")
			if athlete.bot then
				local uniform = if athlete.team == "A" then Color3.fromRGB(21, 76, 138) else Color3.fromRGB(185, 67, 56)
				appearance.HeadColor = Color3.fromRGB(210, 166, 124)
				appearance.TorsoColor, appearance.LeftArmColor, appearance.RightArmColor = uniform, uniform, uniform
				appearance.LeftLegColor, appearance.RightLegColor = Color3.fromRGB(35, 46, 59), Color3.fromRGB(35, 46, 59)
			end
			local success, model = pcall(function()
				return Players:CreateHumanoidModelFromDescriptionAsync(appearance :: HumanoidDescription, Enum.HumanoidRigType.R15)
			end)
			if not success then
				reliable:FireClient(player, { error = "Não foi possível carregar o avatar. Volte ao início e tente novamente." })
				continue
			end
			if session ~= match then model:Destroy() break end
			model.Name = athlete.id
			local humanoid = model:FindFirstChildOfClass("Humanoid")
			if humanoid then humanoid.DisplayDistanceType = Enum.HumanoidDisplayDistanceType.None end
			for _, child in model:GetDescendants() do
				if child:IsA("BasePart") then
					child.CanCollide, child.CanTouch, child.CanQuery = false, false, false
					if athlete.bot and child.Name ~= "Head" then
						child.Color = if athlete.team == "A" then Color3.fromRGB(21, 76, 138) else Color3.fromRGB(185, 67, 56)
					end
				end
			end
			local root = model:FindFirstChild("HumanoidRootPart")
			if root and root:IsA("BasePart") then root.Anchored = true end
			model:SetAttribute("MatchId", match.state.matchId)
			model:SetAttribute("ExpectedDescendants", #model:GetDescendants())
			model.Parent = templates
			if athlete.bot or not description then appearance:Destroy() end
		end
		if description then description:Destroy() end
	end
	local function finite(value: any): boolean
		return type(value) == "number" and value == value and math.abs(value) < math.huge
	end
	local validActions = { jump = true, receive = true, set = true, serve = true, attack = true, ability = true }
	local function acceptInput(player: Player, data: any, channel: string)
		if player ~= owner or not session or type(data) ~= "table" or data.matchId ~= session.state.matchId then return end
		if not finite(data.seq) or data.seq % 1 ~= 0 or data.seq <= channelSeq[channel] then return end
		if not finite(data.moveX) or not finite(data.moveZ) or data.moveX^2 + data.moveZ^2 > 1.00001 then return end
		if type(data.aim) ~= "table" or not finite(data.aim.x) or not finite(data.aim.z) or data.aim.x^2 + data.aim.z^2 > 1.00001 then return end
		local actions = {}
		if channel == "action" then
			if type(data.actions) ~= "table" or #data.actions > 6 then return end
			for key, action in data.actions do
				if type(key) ~= "number" or type(action) ~= "string" or not validActions[action] then return end
				if not table.find(actions, action) then table.insert(actions, action) end
			end
		end
		channelSeq[channel] = data.seq
		local aimLength = math.sqrt(data.aim.x^2 + data.aim.z^2)
		local aimScale = math.max(1, aimLength)
		session:submit(tostring(player.UserId), {
			seq = (session.sequences[tostring(player.UserId)] or 0) + 1,
			moveX = data.moveX, moveZ = data.moveZ,
			aim = { x = data.aim.x/aimScale, z = data.aim.z/aimScale }, actions = actions,
		})
	end
	movement.OnServerEvent:Connect(function(player: Player, data: any)
		if permit(player, "input", 60) then acceptInput(player, data, "movement") end
	end)
	command.OnServerEvent:Connect(function(player: Player, kind: any, data: any)
		if kind == "input" then
			if permit(player, "input", 60) then acceptInput(player, data, "action") end
			return
		end
		if not permit(player, "command", 10) then return end
		if kind == "start" then
			if type(data) == "table" and data.mode and data.mode ~= "SoloBots2v2" then reliable:FireClient(player, { error = "Modo ainda indisponível" }) return end
			if owner and owner ~= player then reliable:FireClient(player, { error = "Esta quadra solo está ocupada" }) return end
			if session and session.state.phase ~= "finished" then return end
			if type(data) ~= "table" or not Config.Abilities[data.ability] then return end
			if data.team ~= "A" and data.team ~= "B" then return end
			if data.difficulty ~= "easy" and data.difficulty ~= "normal" and data.difficulty ~= "hard" then return end
			owner, channelSeq = player, { movement = 0, action = 0 }
			if player.Character then player.Character:Destroy() end
			session = Runtime.new(HttpService:GenerateGUID(false), tostring(player.UserId), data.team, data.ability, data.difficulty, Random.new():NextInteger(1, 2147483647))
			lastPhase = ""
			reliable:FireClient(player, session:snapshot())
			task.spawn(buildActors, player, session)
		elseif kind == "sync" then
			if player == owner and session then reliable:FireClient(player, session:snapshot()) else reliable:FireClient(player, { lobby = true }) end
		elseif kind == "leave" and player == owner then
			session, owner = nil, nil
			for _, child in templates:GetChildren() do child:Destroy() end
			reliable:FireClient(player, { lobby = true })
			task.spawn(spawnLobby, player)
		end
	end)
	Players.PlayerRemoving:Connect(function(player)
		budgets[player] = nil
		if player == owner then
			session, owner = nil, nil
			for _, child in templates:GetChildren() do child:Destroy() end
		end
	end)
	local accumulator = 0
	RunService.Heartbeat:Connect(function(dt)
		if not session or not owner then accumulator = 0 return end
		if session.state.phase == "finished" then accumulator = 0 return end
		accumulator += dt
		local count = 0
		while accumulator >= Config.Step and count < 8 do
			accumulator -= Config.Step
			count += 1
			session:step()
			if session.tick % 3 == 0 then snapshot:FireClient(owner, session:snapshot()) end
			if lastPhase ~= session.state.phase then
				lastPhase = session.state.phase
				reliable:FireClient(owner, session:snapshot())
			end
			if session.state.phase == "finished" then accumulator = 0 break end
		end
	end)
end

return Server
