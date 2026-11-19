--!strict
local Http = game:GetService("HttpService")
local Players = game:GetService("Players")
local Teleport = game:GetService("TeleportService")
local Run = game:GetService("RunService")
local Directory = require(script.Parent.Directory)
local Routing = {}
Routing.__index = Routing
function Routing.new(onFailure: (Player, string) -> ())
	local self: any = setmetatable({ enabled = not Run:IsStudio(), pending = {}, arrivals = {}, room = nil, onFailure = onFailure }, Routing)
	if not self.enabled then return self end
	self.poolType = game.MatchmakingType.Name
	self.map = game:GetService("MemoryStoreService"):GetSortedMap("MythicsDirectory_v1")
	self.routes = game:GetService("MemoryStoreService"):GetSortedMap("MythicsReturnRoutes_v1")
	self.directory = Directory.new(self.map)
	Teleport.TeleportInitFailed:Connect(function(player, _, _, _, options)
		local pending = self.pending[player]
		if not pending or pending.options ~= options then return end
		self.pending[player] = nil
		if pending.pool then pcall(function() self.directory:release(pending.pool, pending.roomId, player.UserId, pending.token) end) end
		if pending.attempt < 3 and player.Parent and pending.mode then
			task.delay(1, function() self:travel(player, pending.mode, pending.attempt + 1, pending.preferences) end)
		else onFailure(player, "Falha no transporte. Tente novamente.") end
	end)
	Players.PlayerRemoving:Connect(function(player) self.pending[player] = nil end)
	return self
end
function Routing.travel(self: any, player: Player, mode: string, attempt: number?, preferences: any?): boolean
	if self.pending[player] then return true end
	local token = Http:GenerateGUID(false)
	local pool = mode .. ":" .. self.poolType
	local options = Instance.new("TeleportOptions")
	self.pending[player] = {mode=mode,attempt=attempt or 1,options=options,token=token,preferences=preferences}
	local ok, failure = pcall(function()
		local room = self.directory:claim(pool, mode, player.UserId, token, Http:GenerateGUID(false), os.time())
		if not room then error("Matchmaking ocupado") end
		local pending = self.pending[player]
		if not pending or not player.Parent then self.directory:release(pool, room.id, player.UserId, token) return end
		pending.pool, pending.roomId = pool, room.id
		options.ReservedServerId = room.reservedId
		options:SetTeleportData({mythics=1,pool=pool,roomId=room.id,token=token,startedAt=os.time(),preferences=preferences})
		Teleport:TeleportAsync(game.PlaceId, {player}, options)
	end)
	if not ok then
		local pending = self.pending[player]
		self.pending[player] = nil
		if pending and pending.pool then pcall(function() self.directory:release(pool,pending.roomId,player.UserId,token) end) end
		if (attempt or 1)<3 and player.Parent then
			task.delay(1,function() self:travel(player,mode,(attempt or 1)+1,preferences) end)
		else self.onFailure(player,"Não foi possível entrar na quadra. Tente novamente.") end
		warn("Match routing failed", failure)
	end
	return true
end
function Routing.arrive(self: any, player: Player)
	if not self.enabled then return nil end
	local data = player:GetJoinData().TeleportData
	if type(data)~="table" or data.mythics~=1 or type(data.pool)~="string" or type(data.roomId)~="string" or type(data.token)~="string" then return nil end
	local mode, poolType = data.pool:match("^([^:]+):(.+)$")
	if poolType~=self.poolType or (mode~="SoloBots2v2" and mode~="Online1v1" and mode~="Online2v2") then return nil end
	if self.room and (self.room.id~=data.roomId or self.room.pool~=data.pool) then return nil end
	local confirmed = self.directory:confirm(data.pool,data.roomId,player.UserId,data.token,game.JobId,game.PrivateServerId,os.time())
	if not confirmed then return nil end
	self.room = { id=confirmed.id,pool=data.pool,mode=mode }
	self.arrivals[player.UserId] = os.time()+40
	self.routes:SetAsync(tostring(player.UserId),{mode=mode,roomId=confirmed.id,pool=data.pool,expires=os.time()+60},60)
	return {mode=mode,roomId=confirmed.id,startedAt=data.startedAt,team=if type(data.preferences)=="table" then data.preferences.team else nil,
		difficulty=if type(data.preferences)=="table" then data.preferences.difficulty else nil}
end
function Routing.announce(self: any, session: any)
	if not self.enabled or not self.room then return end
	local members, returns = {}, {}
	for userId in session.members do members[tostring(userId)]=true end
	for userId in session.pending do members[tostring(userId)]=true end
	for userId, deadline in self.arrivals do
		if members[tostring(userId)] or deadline<=os.time() then self.arrivals[userId]=nil
		else members[tostring(userId)]=true end
	end
	for userId, reservation in session.reservations do
		returns[tostring(userId)]=os.time()+math.max(0,math.ceil(reservation.expires-os.clock()))
	end
	local open = not session.closed and session.runtime.state.phase~="finished" and session.mode~="SoloBots2v2"
	self.directory:announce(self.room.pool,self.room.id,game.JobId,members,returns,open,os.time())
	for userId in session.members do
		self.routes:SetAsync(tostring(userId),{mode=self.room.mode,roomId=self.room.id,pool=self.room.pool,expires=os.time()+60},60)
	end
end
function Routing.resume(self: any, player: Player): boolean
	if not self.enabled then return false end
	local route = self.routes:GetAsync(tostring(player.UserId))
	if route and route.expires>os.time() then self:travel(player,route.mode) return true end
	return false
end
function Routing.lobby(self: any, player: Player)
	if not self.enabled then return end
	pcall(function() self.routes:RemoveAsync(tostring(player.UserId)) end)
	local options = Instance.new("TeleportOptions")
	options.ForcePublicServer = true
	self.pending[player]={options=options,attempt=3}
	local ok = pcall(function() Teleport:TeleportAsync(game.PlaceId,{player},options) end)
	if not ok then self.pending[player]=nil self.onFailure(player,"Falha ao voltar. Use Voltar para tentar novamente.") end
end
return Routing
