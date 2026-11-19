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
	local self: any = { collection = service, busy = {}, lastRequest = {}, temporary = temporary }
	local remote = Instance.new("RemoteFunction")
	remote.Name, remote.Parent = "Collection", folder
	local function publish(player: Player, profile: any)
		if not player.Parent then return end
		player:SetAttribute("EquippedSignature", profile.equipped)
	end
	self.load = function(player: Player)
		local profile = service:read(player.UserId)
		if profile then publish(player, profile) end
		return profile
	end
	remote.OnServerInvoke = function(player: Player, request: any)
		if self.busy[player] or os.clock() - (self.lastRequest[player] or -10) < 0.5 then return { error = "busy" } end
		self.lastRequest[player] = os.clock()
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
	self.equipped = function(player: Player, mode: string)
		if self.busy[player] then return nil, false end
		self.busy[player] = true
		local profile = self.load(player)
		self.busy[player] = nil
		if not profile then return nil, false end
		for _, item in service:catalog() do
			if item.id == profile.equipped and profile.owned[item.id] and item.enabled then
				local fallback = mode == "Online1v1" and item.doublesOnly
				return if fallback then "fundamentals" else item.id, fallback
			end
		end
		return "fundamentals"
	end
	Players.PlayerRemoving:Connect(function(player) self.lastRequest[player], self.busy[player] = nil, nil end)
	return self
end
return ProfileService
