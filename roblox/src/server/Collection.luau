--!strict
local Config = require(game.ReplicatedStorage.MythicsShared.Config)
local Collection = {}
Collection.__index = Collection

function Collection.new(store: any, development: boolean)
	return setmetatable({ store = store, development = development }, Collection)
end

function Collection.catalog(self: any)
	local items = {
		{ id = "fundamentals", name = Config.Abilities.fundamentals.name, effect = "Técnicas básicas de vôlei.", cooldown = 0, doublesOnly = false, enabled = true, initial = true },
		{ id = "teammate_rant", name = Config.Abilities.teammate_rant.name, effect = "Reduz a velocidade e o alcance do parceiro por 5 segundos.", cooldown = 20, doublesOnly = true, enabled = self.development, development = true },
		{ id = "free_point_out", name = Config.Abilities.free_point_out.name, effect = "Perto da bola, concede um ponto ao adversário.", cooldown = 25, doublesOnly = false, enabled = self.development, development = true },
	}
	return items
end

local function normalize(value: any): any
	local p = if type(value) == "table" then value else {}
	return {
		version = 1, revision = p.revision or 0, sequence = p.sequence or 0,
		owned = table.clone(p.owned or { fundamentals = true }),
		equipped = p.equipped or "fundamentals", spins = p.spins or 1,
		receipts = table.clone(p.receipts or {}), order = table.clone(p.order or {}),
		rewards = table.clone(p.rewards or {}),
	}
end

function Collection.candidates(self: any, profile: any)
	local result = {}
	for _, item in self:catalog() do
		if item.enabled and not item.initial and not profile.owned[item.id] then table.insert(result, item.id) end
	end
	return result
end

function Collection.view(self: any, profile: any)
	local candidates = self:candidates(profile)
	local chances = {}
	for _, id in candidates do chances[id] = 1 / #candidates end
	return { revision = profile.revision, sequence = profile.sequence, spins = profile.spins,
		owned = table.clone(profile.owned), equipped = profile.equipped,
		catalog = self:catalog(), chances = chances, complete = #candidates == 0 }
end

function Collection.update(self: any, userId: number, transform: (any) -> any)
	local lastError = ""
	for attempt = 1, 3 do
		local ok, result = pcall(function()
			return self.store:UpdateAsync("user:" .. userId, function(old)
				return transform(normalize(old))
			end)
		end)
		if ok and result then return result end
		lastError = tostring(result)
		if attempt < 3 then task.wait(0.25 * 2^(attempt-1)) end
	end
	warn("Collection save failed", lastError)
	return nil
end

function Collection.read(self: any, userId: number)
	return self:update(userId, function(p) p.owned.fundamentals = true return p end)
end

function Collection.operate(self: any, userId: number, request: any)
	if type(request) ~= "table" or type(request.id) ~= "string" or #request.id < 8 or #request.id > 80
		or type(request.seq) ~= "number" or request.seq % 1 ~= 0 or request.seq < 1
		or type(request.revision) ~= "number" then return nil, "invalid_request" end
	if request.kind ~= "spin" and request.kind ~= "equip" then return nil, "invalid_request" end
	local sample = Random.new():NextNumber()
	local result = self:update(userId, function(p)
		if p.receipts[request.id] or request.seq <= p.sequence or request.revision ~= p.revision then return p end
		local receipt: any = { kind = request.kind, status = "ok", seq = request.seq }
		if request.kind == "spin" then
			local candidates = self:candidates(p)
			if #candidates == 0 then receipt.status = "complete"
			elseif p.spins < 1 then receipt.status = "no_spins"
			else
				local id = candidates[math.min(#candidates, math.floor(sample * #candidates) + 1)]
				p.spins -= 1
				p.owned[id], receipt.ability = true, id
			end
		else
			local allowed = false
			for _, item in self:catalog() do
				if item.id == request.ability and item.enabled and p.owned[item.id] then allowed = true end
			end
			if allowed then p.equipped = request.ability else receipt.status = "not_owned" end
		end
		p.sequence, p.revision = request.seq, p.revision + 1
		p.receipts[request.id] = receipt
		table.insert(p.order, request.id)
		if #p.order > 32 then p.receipts[table.remove(p.order, 1)] = nil end
		return p
	end)
	if not result then return nil, "unavailable" end
	local receipt = result.receipts[request.id]
	if not receipt or receipt.seq ~= request.seq or receipt.kind ~= request.kind then return result, "stale" end
	return result, receipt.status, receipt
end

function Collection.reward(self: any, userId: number, matchId: string)
	return self:update(userId, function(p)
		if not p.rewards[matchId] then
			p.rewards[matchId], p.spins, p.revision = true, p.spins + 1, p.revision + 1
		end
		return p
	end)
end

return Collection
