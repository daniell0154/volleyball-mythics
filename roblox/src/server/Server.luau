--!strict
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local Http = game:GetService("HttpService")
local Config = require(ReplicatedStorage.MythicsShared.Config)
local Session = require(script.Parent.Session)
local Server = {}

function Server.start()
	Players.CharacterAutoLoads = false
	require(script.Parent.Court).build(workspace)
	local Lobby = require(script.Parent.Lobby)
	Lobby.build()
	local lighting = game:GetService("Lighting")
	lighting.ClockTime, lighting.Brightness = 16.5, 2
	lighting.Ambient, lighting.OutdoorAmbient = Color3.fromRGB(150,163,146), Color3.fromRGB(150,163,146)
	local folder = Instance.new("Folder")
	folder.Name, folder.Parent = "MythicsRemotes", ReplicatedStorage
	local function remote(className: string, name: string): any
		local item = Instance.new(className)
		item.Name, item.Parent = name, folder
		return item
	end
	local command = remote("RemoteEvent", "Command")
	local movement = remote("UnreliableRemoteEvent", "Movement")
	local snapshot = remote("RemoteEvent", "Snapshot")
	local state = remote("RemoteEvent", "State")
	local actorsFolder = Instance.new("Folder")
	actorsFolder.Name, actorsFolder.Parent = "MythicsActors", ReplicatedStorage
	local actors = require(script.Parent.Actors).new(actorsFolder)
	local profiles = require(script.Parent.ProfileService).new(folder)
	require(script.Parent.LobbyServices).start(folder)
	local sessions: { [string]: any } = {}
	local membership: { [number]: any } = {}
	local starting, loading, budgets, sequences = {}, {}, {}, {}
	local function send(player: Player, value: any) if player.Parent then state:FireClient(player, value) end end
	local function publish(session: any)
		actors:refresh(session)
		for _, player in Players:GetPlayers() do
			if membership[player.UserId] == session then send(player, session:snapshot(player.UserId)) end
		end
	end
	local function lobby(player: Player)
		if loading[player] or not player.Parent then return end
		loading[player] = true
		local ok = pcall(function() player:LoadCharacterAsync() end)
		loading[player] = nil
		if ok and player.Character then
			if membership[player.UserId] then player.Character:Destroy() else player.Character:PivotTo(Lobby.Spawn) end
		end
	end
	local function added(player: Player)
		player.DevComputerMovementMode = Enum.DevComputerMovementMode.Scriptable
		player.DevTouchMovementMode = Enum.DevTouchMovementMode.Scriptable
		player.CharacterAdded:Connect(function(character)
			local humanoid = character:WaitForChild("Humanoid", 10)
			if humanoid then humanoid.Died:Connect(function()
				task.delay(3, function() if not membership[player.UserId] then lobby(player) end end)
			end) end
		end)
		task.spawn(lobby, player)
	end
	Players.PlayerAdded:Connect(added)
	for _, player in Players:GetPlayers() do added(player) end
	local function permit(player: Player, kind: string, max: number)
		local key = tostring(player.UserId) .. ":" .. kind
		local value = budgets[key]
		local now = os.clock()
		if not value or now - value.since >= 1 then value = {since=now,count=0} budgets[key]=value end
		value.count += 1
		return value.count <= max
	end
	local function join(player: Player, data: any)
		if membership[player.UserId] or starting[player] then return end
		if type(data) ~= "table" then return end
		local mode = data.mode or "SoloBots2v2"
		if mode ~= "SoloBots2v2" and mode ~= "Online1v1" then send(player,{error="Modo indisponível"}) return end
		local team = if data.team == "B" then "B" else "A"
		local difficulty = if data.difficulty == "easy" or data.difficulty == "hard" then data.difficulty else "normal"
		starting[player] = true
		local ability = profiles.equipped(player, mode)
		starting[player] = nil
		if not player.Parent then return end
		if not ability then send(player,{error="Coleção indisponível. Tente novamente."}) return end
		local selected = nil
		for _, session in sessions do
			if session.mode == mode and session.reservations[player.UserId] then
				local admitted = session:join(player.UserId, ability, os.clock())
				if admitted then selected = session break end
			end
		end
		if not selected and mode ~= "SoloBots2v2" then
			for _, session in sessions do
				if session.mode == mode then
					local admitted = session:join(player.UserId, ability, os.clock())
					if admitted then selected = session break end
				end
			end
		end
		if not selected then
			selected = Session.new(Http:GenerateGUID(false), mode, player.UserId, ability, team, difficulty, Random.new():NextInteger(1,2147483647))
			sessions[selected.runtime.state.matchId] = selected
		end
		membership[player.UserId], sequences[player] = selected, {}
		if player.Character then player.Character:Destroy() end
		publish(selected)
	end
	local function leave(player: Player, explicit: boolean)
		local session = membership[player.UserId]
		membership[player.UserId], sequences[player] = nil, nil
		if session then session:leave(player.UserId, explicit, os.clock()) publish(session) end
		if explicit then send(player,{lobby=true}) task.spawn(lobby,player) end
	end
	local function finite(value: any): boolean return type(value)=="number" and value==value and math.abs(value)<math.huge end
	local valid = { jump=true,receive=true,set=true,serve=true,attack=true,ability=true }
	local function input(player: Player, data: any, channel: string)
		local s = membership[player.UserId]
		if not s or s.runtime.suspended or s.pending[player.UserId] then return end
		local slot = s.members[player.UserId]
		local athlete = if slot then s:athlete(slot) else nil
		if not athlete or type(data)~="table" or data.matchId~=s.runtime.state.matchId or data.generation~=athlete.generation then return end
		local sequence = sequences[player]
		if not sequence then return end
		if not finite(data.seq) or data.seq%1~=0 or data.seq<=(sequence[channel] or 0) then return end
		if not finite(data.moveX) or not finite(data.moveZ) or data.moveX^2+data.moveZ^2>1.00001 then return end
		if type(data.aim)~="table" or not finite(data.aim.x) or not finite(data.aim.z) or data.aim.x^2+data.aim.z^2>1.00001 then return end
		local actions = {}
		if channel=="action" then
			if type(data.actions)~="table" or #data.actions>6 then return end
			for key, action in data.actions do
				if type(key)~="number" or type(action)~="string" or not valid[action] then return end
				if not table.find(actions,action) then table.insert(actions,action) end
			end
		end
		sequence[channel] = data.seq
		local norm = math.max(1,math.sqrt(data.aim.x^2+data.aim.z^2))
		s.runtime:submit(slot,{seq=(s.runtime.sequences[slot] or 0)+1, moveX=data.moveX,moveZ=data.moveZ,aim={x=data.aim.x/norm,z=data.aim.z/norm},actions=actions})
	end
	movement.OnServerEvent:Connect(function(player,data) if permit(player,"input",60) then input(player,data,"movement") end end)
	command.OnServerEvent:Connect(function(player,kind,data)
		if kind=="input" then if permit(player,"input",60) then input(player,data,"action") end return end
		if not permit(player,"command",10) then return end
		if kind=="start" then join(player,data)
		elseif kind=="sync" then
			local s=membership[player.UserId]
			send(player,if s then s:snapshot(player.UserId) else {lobby=true})
		elseif kind=="leave" then leave(player,true)
		elseif kind=="rematch" then
			local s=membership[player.UserId]
			if not s then return end
			local oldId=s.runtime.state.matchId
			if s:vote(player.UserId,Http:GenerateGUID(false)) then
				sessions[oldId]=nil
				sessions[s.runtime.state.matchId]=s
				actors:remove(oldId)
				s.rewarded=nil
				for id in s.members do local p=Players:GetPlayerByUserId(id) if p then sequences[p]={} end end
			end
			publish(s)
		end
	end)
	Players.PlayerRemoving:Connect(function(player)
		leave(player,false)
		starting[player],sequences[player]=nil,nil
		budgets[tostring(player.UserId)..":input"],budgets[tostring(player.UserId)..":command"]=nil,nil
	end)
	local accumulator=0
	RunService.Heartbeat:Connect(function(dt)
		accumulator+=dt
		local steps=0
		while accumulator>=Config.Step and steps<8 do
			accumulator-=Config.Step
			steps+=1
			for id,s in sessions do
				if s.closed then actors:remove(id) sessions[id]=nil continue end
				local before=s.runtime.state.phase
				s:step(os.clock())
				if s.runtime.state.phase=="finished" and not s.rewarded then
					s.rewarded=true
					if s.runtime.state.reason=="points" then for userId in s.members do profiles.reward(userId,id) end end
				end
				if s.runtime.state.phase~=before then publish(s)
				elseif s.runtime.tick%3==0 then
					actors:refresh(s)
					for _,p in Players:GetPlayers() do if membership[p.UserId]==s then snapshot:FireClient(p,s:snapshot(p.UserId)) end end
				end
			end
		end
	end)
end
return Server
