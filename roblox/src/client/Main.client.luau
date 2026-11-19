--!strict
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local Input = game:GetService("UserInputService")
local GuiService = game:GetService("GuiService")
local Config = require(ReplicatedStorage:WaitForChild("MythicsShared"):WaitForChild("Config"))
local Hud = require(script.Parent.Hud)
local Controls = require(script.Parent.Controls)
local remotes = ReplicatedStorage:WaitForChild("MythicsRemotes")
local command = remotes:WaitForChild("Command") :: RemoteEvent
local movementRemote = remotes:WaitForChild("Movement") :: UnreliableRemoteEvent
local templates = ReplicatedStorage:WaitForChild("MythicsActors")
local hud = Hud.new()
local lobby = require(script.Parent.LobbyHud).new(hud)
hud.panel.Visible = false
local nativeControls = require(script.Parent.LobbyControls).new(hud)
nativeControls:Enable()
local playerGui = Players.LocalPlayer:WaitForChild("PlayerGui")
local function hideNativeTouch(child: Instance)
	if child.Name == "TouchGui" and child:IsA("ScreenGui") then child.Enabled = false end
end
playerGui.ChildAdded:Connect(hideNativeTouch)
for _, child in playerGui:GetChildren() do hideNativeTouch(child) end
RunService:BindToRenderStep("MythicsTouchVisibility", Enum.RenderPriority.Last.Value, function()
	local touchGui = playerGui:FindFirstChild("TouchGui")
	if touchGui then hideNativeTouch(touchGui) end
end)
local state: any = nil
local buffer: { any } = {}
local models: { [string]: any } = {}
local actionSeq, moveSeq, eventId, lastSend = 0, 0, 0, 0
local camera = workspace.CurrentCamera
local cameraEye: Vector3? = nil
local cameraDistance = 0
camera.CameraType, camera.FieldOfView = Enum.CameraType.Custom, 65
local visualFolder = Instance.new("Folder")
visualFolder.Name, visualFolder.Parent = "MythicsPresentation", workspace
local court = workspace:WaitForChild("MythicsCourt")
for _, object in workspace:GetDescendants() do
	if object:IsA("SpawnLocation") then
		object.LocalTransparencyModifier = 1
		for _, child in object:GetChildren() do if child:IsA("Decal") then child.Transparency = 1 end end
	end
end
local ball = court:WaitForChild("Ball") :: Part
local marker = Instance.new("Part")
marker.Name, marker.Shape, marker.Size = "BallShadow", Enum.PartType.Cylinder, Vector3.new(0.025,1.1,1.1)
marker.Anchored, marker.CanCollide, marker.CanQuery, marker.CanTouch = true, false, false, false
marker.Color, marker.Transparency, marker.Parent = Color3.fromRGB(255,230,0), 0.25, visualFolder
marker.Transparency = 1
local controls: any
local function vector(position: any): Vector3 return Vector3.new(position.x,position.y,position.z) end
local function inputPayload(channel: string, actions: { string }?)
	if not state then return nil end
	local move, aim = controls.sample()
	local humanTeam = "A"
	local generation = 0
	for _, athlete in state.athletes do if athlete.id == state.humanId then humanTeam, generation = athlete.team, athlete.generation end end
	local direction = if humanTeam == "A" then 1 else -1
	local sequence: number
	if channel == "action" then actionSeq += 1 sequence = actionSeq else moveSeq += 1 sequence = moveSeq end
	return {
		matchId = state.matchId, seq = sequence,
		generation = generation,
		moveX = -direction * move.X, moveZ = direction * move.Y,
		-- Rally targets use world X but own-side depth for Z.
		aim = { x = -direction * aim.X, z = aim.Y }, actions = actions,
	}
end
controls = Controls.new(hud, function(name)
	if not state then return end
	if name == "hit" then name = if state.phase == "serving" then "serve" else "attack" end
	command:FireServer("input", inputPayload("action", {name}))
	hud.feedback.Text = "Solicitado · aguardando confirmação"
end)
hud.start.Activated:Connect(function()
	if state and state.phase == "finished" then command:FireServer("rematch") hud.start.Text = "Aguardando revanche…" return end
	if lobby.busy then return end
	lobby.setBusy(true)
	local selection = table.clone(hud.selection)
	selection.mode = "SoloBots2v2"
	command:FireServer("start", selection)
	task.delay(10, function()
		if lobby.busy then
			lobby.setBusy(false)
			lobby.message("A entrada demorou. Tente novamente.")
			command:FireServer("sync")
		end
	end)
end)
lobby.onMode = function(mode: string)
	if lobby.busy then return end
	lobby.setBusy(true)
	command:FireServer("start", {mode=mode})
	task.delay(10, function()
		if lobby.busy then lobby.setBusy(false) lobby.message("A entrada demorou. Tente novamente.") command:FireServer("sync") end
	end)
end
hud.leave.Activated:Connect(function() command:FireServer("leave") end)
hud.onBack = function()
	if lobby.visible then lobby.back() else command:FireServer("leave") end
end
Players.LocalPlayer.CharacterAdded:Connect(function(character)
	local humanoid = character:WaitForChild("Humanoid")
	if not state then camera.CameraSubject, camera.CameraType = humanoid, Enum.CameraType.Custom end
end)
Input.InputBegan:Connect(function(input, processed)
	if processed or input.UserInputType ~= Enum.UserInputType.MouseButton1 or not state or not controls.enabled then return end
	for _, object in Players.LocalPlayer.PlayerGui:GetGuiObjectsAtPosition(input.Position.X,input.Position.Y) do
		if object:IsA("GuiButton") then return end
	end
	local ray = camera:ScreenPointToRay(input.Position.X,input.Position.Y)
	if math.abs(ray.Direction.Y) < 0.001 then return end
	local distance = (Config.Origin.Y-ray.Origin.Y)/ray.Direction.Y
	if distance <= 0 then return end
	local target = (ray.Origin+ray.Direction*distance-Config.Origin)/Config.Scale
	local direction = 1
	for _, athlete in state.athletes do
		if athlete.id == state.humanId then direction = if athlete.team == "A" then 1 else -1 end
	end
	controls.setAim(Vector2.new(-direction*target.X/3.5,(target.Z*direction-5)/2))
end)
local function clearModels()
	for _, entry in models do entry.model:Destroy() end
	models = {}
end
local function receive(nextState: any, reliable: boolean)
	if nextState.routing then lobby.setBusy(true) lobby.message("Entrando na quadra…") return end
	if nextState.error then
		lobby.setBusy(false)
		if lobby.visible then lobby.message(nextState.error) else hud.feedback.Text = nextState.error end
		return
	end
	if nextState.lobby then
		state, buffer = nil, {}
		controls.setEnabled(false)
		clearModels()
		hud.setMenu(true)
		lobby.setVisible(true)
		nativeControls:Enable()
		camera.CameraType = Enum.CameraType.Custom
		if Players.LocalPlayer.Character then camera.CameraSubject = Players.LocalPlayer.Character:FindFirstChildOfClass("Humanoid") end
		marker.Transparency = 1
		hud.score.Text, hud.status.Text, hud.feedback.Text = "", "", ""
		if nextState.message then lobby.message(nextState.message) end
		return
	end
	if not nextState.matchId then return end
	if not reliable and (not state or state.matchId ~= nextState.matchId) then return end
	if state and nextState.matchId == state.matchId and nextState.tick < state.tick then return end
	if not state or nextState.matchId ~= state.matchId then
		buffer, actionSeq, moveSeq, eventId = {}, 0, 0, 0
		cameraEye, cameraDistance = nil, 0
		clearModels()
		hud.setMenu(false)
		lobby.setVisible(false)
		nativeControls:Disable()
		camera.CameraType = Enum.CameraType.Scriptable
		marker.Transparency = 0.25
		GuiService.SelectedObject = nil
		controls.setEnabled(true)
	end
	state = nextState
	local enabled = not state.pending and not state.suspended and state.phase ~= "finished" and state.phase ~= "cancelled"
	if controls.enabled ~= enabled then controls.setEnabled(enabled) end
	table.insert(buffer, { time = os.clock(), snapshot = nextState })
	if #buffer > 12 then table.remove(buffer, 1) end
end
local stateRemote = remotes:WaitForChild("State") :: RemoteEvent
local snapshotRemote = remotes:WaitForChild("Snapshot") :: RemoteEvent
stateRemote.OnClientEvent:Connect(function(value) receive(value, true) end)
snapshotRemote.OnClientEvent:Connect(function(value) receive(value, false) end)
command:FireServer("sync")

local function modelFor(athlete: any): any
	if models[athlete.id] and models[athlete.id].generation ~= athlete.generation then
		models[athlete.id].model:Destroy()
		models[athlete.id] = nil
	end
	if not athlete.active then
		if models[athlete.id] then models[athlete.id].model:Destroy() models[athlete.id] = nil end
		return nil
	end
	if models[athlete.id] then return models[athlete.id] end
	local folder = templates:FindFirstChild(state.matchId)
	local template = if folder then folder:FindFirstChild(athlete.id) else nil
	if not template or template:GetAttribute("MatchId") ~= state.matchId then return nil end
	if template:GetAttribute("Generation") ~= athlete.generation then return nil end
	local expected = template:GetAttribute("ExpectedDescendants")
	if not expected or #template:GetDescendants() < expected then return nil end
	local model = template:Clone() :: Model
	local root = model:FindFirstChild("HumanoidRootPart") :: Part
	local humanoid = model:FindFirstChildOfClass("Humanoid")
	if not root or not humanoid then model:Destroy() return nil end
	local joints = {}
	for _, child in model:GetDescendants() do
		if child:IsA("Motor6D") then joints[child.Name] = { motor = child, base = child.C0 } end
	end
	local badge = Instance.new("BillboardGui")
	badge.Size, badge.StudsOffset, badge.AlwaysOnTop = UDim2.fromOffset(100,24), Vector3.new(0,3.6,0), true
	badge.Adornee, badge.Parent = root, model
	local text = Instance.new("TextLabel")
	text.Size, text.BackgroundColor3, text.BackgroundTransparency = UDim2.fromScale(1,1), Color3.fromRGB(16,35,52), 0.15
	text.Text, text.TextSize = if athlete.bot then "BOT · " .. athlete.team .. (athlete.slot+1) elseif athlete.id == state.humanId then "VOCÊ" else athlete.team .. (athlete.slot+1), 15
	text.Font, text.TextColor3, text.Parent = Enum.Font.GothamBold, Color3.new(1,1,1), badge
	model.Parent = visualFolder
	local entry = { model = model, joints = joints, feet = humanoid.HipHeight + root.Size.Y/2, actionUntil = 0, last = nil, kind = "", generation = athlete.generation }
	models[athlete.id] = entry
	return entry
end
local function pose(entry: any, speed: number, now: number)
	local swing = math.sin(now * 12) * math.min(0.65, speed * 0.12)
	local values = { LeftHip = swing, RightHip = -swing, LeftShoulder = -swing*0.6, RightShoulder = swing*0.6 }
	if entry.actionUntil > now then
		if entry.kind == "set" or entry.kind == "block" then
			values.LeftShoulder, values.RightShoulder = -2.4, -2.4
		elseif entry.kind == "receive" then values.LeftShoulder, values.RightShoulder = -1.1, -1.1
		else values.RightShoulder = -2.7 end
	end
	for name, value in values do
		local joint = entry.joints[name]
		if joint then joint.motor.C0 = joint.base * CFrame.Angles(value,0,0) end
	end
end

RunService.RenderStepped:Connect(function(dt)
	if not state then nativeControls.step(dt, lobby.panelOpen()) return end
	local now = os.clock()
	if controls.enabled and now-lastSend >= 1/30 then
		lastSend = now
		movementRemote:FireServer(inputPayload("movement"))
	end
	local latest = buffer[#buffer]
	local targetTick = latest.snapshot.tick - 6 + math.min(now-latest.time, 0.1)*60
	local a, b = buffer[1].snapshot, latest.snapshot
	for index = 1, #buffer-1 do
		if buffer[index].snapshot.tick <= targetTick and buffer[index+1].snapshot.tick >= targetTick then
			a, b = buffer[index].snapshot, buffer[index+1].snapshot
			break
		end
	end
	local alpha = if b.tick == a.tick then 1 else math.clamp((targetTick-a.tick)/(b.tick-a.tick),0,1)
	-- A new serve resets positions. Grounding and scoring share the rendered timeline.
	if a.rallyId ~= b.rallyId then alpha = 1 end
	local displayed = if alpha >= 1 then b else a
	hud.update(displayed)
	if displayed.phase == "finished" and not hud.panel.Visible then
		controls.setEnabled(false)
		local side = displayed.winner or (if displayed.score.A == 6 then "A" else "B")
		hud.setMenu(true, "Vitória do lado " .. side)
		hud.leave.Visible = true
	end
	local ballPosition = vector(a.ball):Lerp(vector(b.ball),alpha)
	ball.Position = Config.Origin + ballPosition * Config.Scale
	marker.CFrame = CFrame.new(Config.Origin + Vector3.new(ballPosition.X,0.025,ballPosition.Z)*Config.Scale) * CFrame.Angles(0,0,math.pi/2)
	local humanPosition, humanTeam = Vector3.zero, "A"
	for index, athlete in b.athletes do
		local previous = a.athletes[index]
		local position = if previous and previous.id == athlete.id then vector(previous.position):Lerp(vector(athlete.position),alpha) else vector(athlete.position)
		if athlete.id == state.humanId then humanPosition, humanTeam = position, athlete.team end
		local entry = modelFor(athlete)
		if entry then
			local speed = if entry.last then (position-entry.last).Magnitude/math.max(dt,0.001) else 0
			entry.last = position
			local direction = if athlete.team == "A" then 1 else -1
			local footPosition = Config.Origin + position*Config.Scale + Vector3.new(0,entry.feet,0)
			entry.model:PivotTo(CFrame.lookAt(footPosition, footPosition+Vector3.new(0,0,direction)))
			pose(entry,speed,now)
		end
	end
	for _, event in state.events do
		if event.id > eventId and event.tick <= targetTick then
			local entry = models[event.athleteId]
			if entry and state.tick-event.tick < 30 then entry.actionUntil, entry.kind = now+0.35, event.kind end
			eventId = math.max(eventId,event.id)
		end
	end
	local direction = if humanTeam == "A" then 1 else -1
	local viewport = camera.ViewportSize
	local aspect = viewport.X/math.max(1,viewport.Y)
	-- Close browser camera, with additional setback on narrow screens and high balls.
	local setback = 5.8 + math.max(0,1.7-aspect)*3 + math.max(0,ballPosition.Y-5)*0.65
	local desiredEye = Config.Origin + Vector3.new(humanPosition.X,3.2,humanPosition.Z-direction*setback)*Config.Scale
	cameraEye = if cameraEye then cameraEye:Lerp(desiredEye,1-math.exp(-8*math.min(dt,0.1))) else desiredEye
	local ahead = (ballPosition.Z-humanPosition.Z)*direction
	local target = Config.Origin + Vector3.new(
		humanPosition.X*0.65 + ballPosition.X*0.35,
		1.25+0.4*math.clamp(ballPosition.Y-1.25,-1,8),
		humanPosition.Z+direction*math.clamp(2.8+0.5*ahead,2.2,11)
	)*Config.Scale
	local frame = CFrame.lookAt(cameraEye :: Vector3, target)
	local vertical = math.tan(math.rad(camera.FieldOfView/2))
	local horizontal = vertical * aspect
	local top = vertical * math.max(0.2, 1-120/math.max(1,viewport.Y))
	local bottom = vertical * math.max(0.2, 1-(hud.ability.AbsoluteSize.Y+40)*2/math.max(1,viewport.Y))
	local required = 0
	for _, position in {
		humanPosition+Vector3.new(0,0.28,0), humanPosition+Vector3.new(0,1.75,0),
		ballPosition, Vector3.new(math.clamp(ballPosition.X,-4.5,4.5),0,math.clamp(ballPosition.Z,-9,9)),
	} do
		local point = frame:PointToObjectSpace(Config.Origin+position*Config.Scale)
		local radius = 0.3*Config.Scale
		local verticalFit = (math.abs(point.Y)+radius)/(if point.Y >= 0 then top else bottom)
		required = math.max(required,point.Z+radius+math.max((math.abs(point.X)+radius)/horizontal,verticalFit))
	end
	cameraDistance = if required > cameraDistance then required else math.max(required,cameraDistance*math.exp(-2.5*dt))
	camera.CFrame = frame + frame.LookVector*(-cameraDistance)
	local distance = (camera.CFrame.Position-ball.Position).Magnitude
	local minimumRadius = distance*math.tan(math.rad(camera.FieldOfView/2))*12/math.max(1,viewport.Y)
	ball.Size = Vector3.one*math.max(0.22*Config.Scale,minimumRadius*2)
	local _, aim = controls.sample()
	hud.aim.Text = if aim.Magnitude < 0.05 then "Mira central" else string.format("Mira %.1f · %.1f",aim.X,aim.Y)
end)
