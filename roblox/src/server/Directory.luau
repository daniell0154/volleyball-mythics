--!strict
local Directory = {}
Directory.__index = Directory
local capacity = { SoloBots2v2 = 1, Online1v1 = 2, Online2v2 = 4 }

function Directory.new(map: any)
	return setmetatable({ map = map }, Directory)
end
local function clone(value: any): any
	if type(value) ~= "table" then return value end
	local result = {}
	for k, v in value do result[k] = clone(v) end
	return result
end
local function clean(value: any, now: number)
	local data = clone(value or {rooms={}})
	for id, room in data.rooms do
		if room.expires <= now then data.rooms[id] = nil
		else
			for user, claim in room.claims do if claim.expires <= now then room.claims[user] = nil end end
			for user, deadline in room.returns do if deadline <= now then room.returns[user] = nil end end
		end
	end
	return data
end
function Directory.claim(self: any, pool: string, mode: string, userId: number, token: string, newRoom: string, now: number)
	local user = tostring(userId)
	local data = self.map:UpdateAsync(pool, function(old)
		local nextData = clean(old, now)
		local ids = {}
		for id in nextData.rooms do table.insert(ids, id) end
		table.sort(ids)
		local selected = nil
		-- Reentry precedes admission to another match.
		for _, id in ids do
			local room = nextData.rooms[id]
			if room.mode == mode and (room.members[user] or room.returns[user] or room.claims[user]) then selected = room break end
		end
		if not selected and mode ~= "SoloBots2v2" then
			for _, id in ids do
				local room = nextData.rooms[id]
				local occupied = {}
				for u in room.members do occupied[u] = true end
				for u in room.claims do occupied[u] = true end
				for u in room.returns do occupied[u] = true end
				local count = 0
				for _ in occupied do count += 1 end
				if room.mode == mode and room.open and count < capacity[mode] then selected = room break end
			end
		end
		if not selected then
			if #ids >= 48 then return nextData end
			selected = { id=newRoom, mode=mode, reservedId=newRoom, expires=now+60, open=true, members={},claims={},returns={} }
			nextData.rooms[newRoom] = selected
		end
		selected.claims[user] = { token=token, expires=now+40 }
		return nextData
	end, 120)
	for _, room in data.rooms do
		local claim = room.claims[user]
		if claim and claim.token == token then return room end
	end
	return nil
end
function Directory.release(self: any, pool: string, roomId: string, userId: number, token: string)
	self.map:UpdateAsync(pool, function(old)
		local data = clone(old or {rooms={}})
		local room = data.rooms[roomId]
		local claim = if room then room.claims[tostring(userId)] else nil
		if claim and claim.token == token then room.claims[tostring(userId)] = nil end
		return data
	end, 120)
end
function Directory.confirm(self: any, pool: string, roomId: string, userId: number, token: string, jobId: string, privateId: string, now: number)
	local user = tostring(userId)
	local data = self.map:UpdateAsync(pool, function(old)
		local nextData = clean(old, now)
		local room = nextData.rooms[roomId]
		local claim = if room then room.claims[user] else nil
		if not room or not claim or claim.token ~= token then return nextData end
		if room.jobId and room.jobId ~= jobId then return nextData end
		if room.privateId and room.privateId ~= privateId then return nextData end
		room.jobId, room.privateId = jobId, privateId
		room.members[user], room.claims[user], room.returns[user] = true, nil, nil
		room.expires = now+60
		return nextData
	end, 120)
	local room = data.rooms[roomId]
	if room and room.jobId == jobId and room.privateId == privateId and room.members[user] then return room end
	return nil
end
function Directory.announce(self: any, pool: string, roomId: string, jobId: string, members: any, returns: any, open: boolean, now: number)
	self.map:UpdateAsync(pool, function(old)
		local data = clean(old, now)
		local room = data.rooms[roomId]
		if room and room.jobId == jobId then
			room.members, room.returns, room.open, room.expires = clone(members), clone(returns), open, now+60
		end
		return data
	end, 120)
end
return Directory
