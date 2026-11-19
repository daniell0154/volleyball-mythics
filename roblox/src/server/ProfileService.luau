--!strict
local RunService = game:GetService("RunService")
local Players = game:GetService("Players")
local Collection = require(script.Parent.Collection)
local ProfileService = {}

function ProfileService.new(folder: Folder)
	local memory = {}
	local store: any
	local temporary = RunService:IsStudio() and workspace:GetAttribute("MythicsTemporaryProfiles") == true
	if temporary then
		store = { UpdateAsync = function(_, key, callback) memory[key] = callback(memory[key]) return memory[key] end }
	else
		store = game:GetService("DataStoreService"):GetDataStore(if RunService:IsStudio() then "MythicsStudioProfiles_v1" else "MythicsProfiles_v1")
	end
	local service = Collection.new(store, RunService:IsStudio())
	local self: any = { collection = service, profiles = {}, busy = {}, pendingRewards = {}, temporary = temporary }
	local remote = Instance.new("RemoteFunction")
	remote.Name, remote.Parent = "Collection", folder
	local function publish(player: Player, profile: any)
		if not player.Parent then return end
		self.profiles[player.UserId] = profile
		player:SetAttribute("EquippedSignature", profile.equipped)
	end
	self.load = function(player: Player)
		local profile = service:read(player.UserId)
		if profile then publish(player, profile) end
		return profile
	end
	remote.OnServerInvoke = function(player: Player, request: any)
		if self.busy[player] then return { error = "busy" } end
		self.busy[player] = true
		local profile, status, receipt
		local ok, failure = pcall(function()
			if request == nil then profile = self.load(player) status = "ok"
			else profile, status, receipt = service:operate(player.UserId, request) end
		end)
		self.busy[player] = nil
		if not ok then warn(failure) return { error = "unavailable" } end
		if not profile then return { error = status or "unavailable" } end
		publish(player, profile)
		return { profile = service:view(profile), status = status, receipt = receipt, temporary = temporary }
	end
	self.equipped = function(player: Player, mode: string): string?
		if self.busy[player] then return nil end
		self.busy[player] = true
		local profile = self.load(player)
		self.busy[player] = nil
		if not profile then return nil end
		for _, item in service:catalog() do
			if item.id == profile.equipped and profile.owned[item.id] and item.enabled then
				return if mode == "Online1v1" and item.doublesOnly then "fundamentals" else item.id
			end
		end
		return "fundamentals"
	end
	self.reward = function(userId: number, matchId: string)
		local key = matchId .. ":" .. userId
		if self.pendingRewards[key] then return end
		self.pendingRewards[key] = true
		task.spawn(function()
			local saved = false
			while not saved do
				local profile = service:reward(userId, matchId)
				saved = profile ~= nil
				if profile then
					local player = Players:GetPlayerByUserId(userId)
					if player then publish(player, profile) end
				else task.wait(5) end
			end
			self.pendingRewards[key] = nil
		end)
	end
	Players.PlayerRemoving:Connect(function(player) self.profiles[player.UserId] = nil end)
	game:BindToClose(function()
		local deadline = os.clock() + 25
		while next(self.pendingRewards) and os.clock() < deadline do task.wait(0.2) end
	end)
	return self
end
return ProfileService
