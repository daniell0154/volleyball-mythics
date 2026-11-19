--!strict
local Players = game:GetService("Players")
local Actors = {}
Actors.__index = Actors
function Actors.new(parent: Folder)
	return setmetatable({ parent = parent, loading = {}, retry = {} }, Actors)
end
function Actors.refresh(self: any, session: any)
	local matchId = session.runtime.state.matchId
	local folder = self.parent:FindFirstChild(matchId)
	if not folder then folder = Instance.new("Folder") folder.Name, folder.Parent = matchId, self.parent end
	for _, athlete in session.runtime.athletes do
		local existing = folder:FindFirstChild(athlete.id)
		if existing and existing:GetAttribute("Generation") == athlete.generation then continue end
		local key = matchId .. ":" .. athlete.id .. ":" .. athlete.generation
		if self.loading[key] then continue end
		if (self.retry[key] or 0) > os.clock() then continue end
		self.loading[key] = true
		local generation, userId, bot = athlete.generation, athlete.userId, athlete.bot
		task.spawn(function()
			local description = Instance.new("HumanoidDescription")
			if userId then
				local ok, result = pcall(Players.GetHumanoidDescriptionFromUserIdAsync, Players, userId)
				if ok then description:Destroy() description = result
				else
					description:Destroy()
					self.loading[key], self.retry[key] = nil, os.clock()+5
					warn("Retrying player appearance",userId)
					return
				end
			else
				local uniform = if athlete.team == "A" then Color3.fromRGB(21,76,138) else Color3.fromRGB(185,67,56)
				description.HeadColor = Color3.fromRGB(210,166,124)
				description.TorsoColor, description.LeftArmColor, description.RightArmColor = uniform, uniform, uniform
				description.LeftLegColor, description.RightLegColor = Color3.fromRGB(35,46,59), Color3.fromRGB(35,46,59)
			end
			local ok, model = pcall(Players.CreateHumanoidModelFromDescriptionAsync, Players, description, Enum.HumanoidRigType.R15)
			description:Destroy()
			self.loading[key] = nil
			if not ok then self.retry[key]=os.clock()+5 warn("Actor appearance unavailable", athlete.id) return end
			if session.closed or session.runtime.state.matchId ~= matchId or athlete.generation ~= generation or not folder.Parent then model:Destroy() return end
			model.Name = athlete.id
			local humanoid = model:FindFirstChildOfClass("Humanoid")
			if humanoid then humanoid.DisplayDistanceType = Enum.HumanoidDisplayDistanceType.None end
			for _, part in model:GetDescendants() do
				if part:IsA("BasePart") then part.CanCollide, part.CanTouch, part.CanQuery = false, false, false end
			end
			local root = model:FindFirstChild("HumanoidRootPart")
			if root then root.Anchored = true end
			model:SetAttribute("MatchId", matchId)
			model:SetAttribute("Generation", generation)
			model:SetAttribute("ExpectedDescendants", #model:GetDescendants())
			local old = folder:FindFirstChild(athlete.id)
			if old then old:Destroy() end
			model.Parent = folder
		end)
	end
end
function Actors.remove(self: any, matchId: string)
	local folder = self.parent:FindFirstChild(matchId)
	if folder then folder:Destroy() end
	for key in self.retry do if key:sub(1,#matchId+1)==matchId..":" then self.retry[key]=nil end end
end
return Actors
