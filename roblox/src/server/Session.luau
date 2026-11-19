--!strict
local Runtime = require(script.Parent.Runtime)
local Match = require(script.Parent.Domain.Match)
local Session = {}
Session.__index = Session

function Session.new(id: string, mode: string, userId: number, ability: string, team: string, difficulty: string, seed: number)
	local runtime = Runtime.new(id, "A0", team, ability, difficulty, seed, mode)
	local self: any = setmetatable({ runtime = runtime, mode = mode, members = {}, reservations = {}, pending = {},
		participants = {}, history = {}, votes = {}, disconnectUsed = {}, closed = false, joinCounter = 0 }, Session)
	for _, athlete in runtime.athletes do
		athlete.id, athlete.userId = athlete.team .. athlete.slot, nil
		athlete.abilityId, athlete.cooldownUntil = "fundamentals", 0
		athlete.bot, athlete.active = mode ~= "Online1v1", mode ~= "Online1v1"
	end
	local slot = if mode == "SoloBots2v2" then team .. "0" else "A0"
	self:assign(userId, slot, ability)
	if mode == "Online1v1" then
		runtime.warmup, runtime.state.phase, runtime.phaseTicks = true, "serving", 0
	end
	return self
end

function Session.athlete(self: any, id: string)
	for _, athlete in self.runtime.athletes do if athlete.id == id then return athlete end end
	return nil
end

function Session.record(self: any, userId: number, slot: string, kind: string)
	table.insert(self.history, { userId = userId, slot = slot, tick = self.runtime.tick, kind = kind, generation = self:athlete(slot).generation })
end

function Session.assign(self: any, userId: number, slot: string, ability: string)
	local athlete = self:athlete(slot)
	local former = athlete.userId
	if former then self.members[former] = nil self:record(former, slot, "leave") end
	athlete.generation += 1
	athlete.userId, athlete.bot, athlete.active, athlete.abilityId, athlete.effectUntil = userId, false, true, ability, 0
	self.runtime.inputs[slot], self.runtime.sequences[slot], self.runtime.touching[slot] = nil, nil, nil
	self.members[userId], self.participants[userId] = slot, true
	self.pending[userId], self.reservations[userId] = nil, nil
	self:record(userId, slot, "join")
end

function Session.join(self: any, userId: number, ability: string, now: number)
	self:expire(now)
	if self.closed or self.runtime.state.phase == "finished" then return false, "finished" end
	if self.members[userId] or self.pending[userId] then return true end
	local reservation = self.reservations[userId]
	if reservation then
		self.disconnectUsed[userId] = (self.disconnectUsed[userId] or 0) + math.max(0, now - reservation.since)
		self:assign(userId, reservation.slot, reservation.ability)
		if self.mode == "Online1v1" then
			self.runtime.suspended = false
			self.resumeAt = now + 3
			self.runtime.suspended = true
		end
		return true
	end
	if self.mode == "SoloBots2v2" then return false, "full" end
	local counts = { A = 0, B = 0 }
	for _, slot in self.members do counts[slot:sub(1, 1)] += 1 end
	for _, p in self.pending do counts[p.slot:sub(1, 1)] += 1 end
	local preferred = if counts.A < counts.B then "A" else "B"
	local available = {}
	for _, athlete in self.runtime.athletes do
		local reserved = false
		for _, r in self.reservations do if r.slot == athlete.id then reserved = true end end
		for _, p in self.pending do if p.slot == athlete.id then reserved = true end end
		if not athlete.userId and not reserved then table.insert(available, athlete) end
	end
	table.sort(available, function(a, b)
		if a.team ~= b.team then return a.team == preferred end
		return a.slot < b.slot
	end)
	if #available == 0 then return false, "full" end
	local slot = available[1].id
	if self.mode == "Online2v2" and self.runtime.state.phase == "rally" then
		self.pending[userId] = { slot = slot, ability = ability }
	else self:assign(userId, slot, ability) end
	if self.mode == "Online1v1" then
		self.runtime.warmup, self.runtime.suspended = false, false
		self.runtime.state = Match.transition(Match.create(self.runtime.state.matchId, "1v1"), { type = "START" })
		self.runtime.phaseTicks = 0
		for _, athlete in self.runtime.athletes do athlete.cooldownUntil = 0 end
		self.runtime:resetRally()
	end
	return true
end

function Session.finish(self: any, winner: string?, reason: string)
	local state = table.clone(self.runtime.state)
	state.phase = if winner then "finished" else "cancelled"
	state.winner, state.reason = winner, reason
	self.runtime.state, self.runtime.suspended = state, false
	self.runtime.inputs = {}
	if not winner then self.closed = true end
end

function Session.leave(self: any, userId: number, explicit: boolean, now: number)
	if self.pending[userId] then self.pending[userId] = nil return end
	local slot = self.members[userId]
	if not slot then return end
	local athlete = self:athlete(slot)
	self:record(userId, slot, if explicit then "leave" else "disconnect")
	self.members[userId], self.votes[userId] = nil, nil
	athlete.userId, athlete.generation = nil, athlete.generation + 1
	self.runtime.inputs[slot], self.runtime.sequences[slot] = nil, nil
	local finished = self.runtime.state.phase == "finished"
	local humans = 0
	for _ in self.members do humans += 1 end
	if humans == 0 then self.closed = true self:finish(nil, "empty") return end
	if not explicit and not finished and self.mode ~= "SoloBots2v2" then
		local remaining = if self.mode == "Online1v1" then math.min(20, 40 - (self.disconnectUsed[userId] or 0)) else 20
		if remaining > 0 then
			self.reservations[userId] = { slot = slot, since = now, expires = now + remaining, ability = athlete.abilityId }
		end
	end
	if self.mode == "Online1v1" then
		athlete.active, athlete.bot = false, false
		if not finished and not self.runtime.warmup then
			if self.reservations[userId] then self.runtime.suspended = true
			else self:finish(if athlete.team == "A" then "B" else "A", "forfeit") end
		end
	else
		athlete.bot, athlete.active, athlete.abilityId, athlete.effectUntil = true, true, "fundamentals", 0
	end
end

function Session.expire(self: any, now: number)
	for userId, reservation in self.reservations do
		if now >= reservation.expires then
			self.reservations[userId] = nil
			if self.mode == "Online1v1" and self.runtime.state.phase ~= "finished" then
				self:finish(if reservation.slot:sub(1, 1) == "A" then "B" else "A", "forfeit")
			end
		end
	end
	if self.resumeAt and now >= self.resumeAt then self.resumeAt, self.runtime.suspended = nil, false end
end

function Session.step(self: any, now: number)
	self:expire(now)
	if self.closed then return end
	local phase = self.runtime.state.phase
	if phase == "finished" then self.pending = {} return end
	self.runtime:step()
	if self.runtime.state.phase == "serving" and phase ~= "serving" then
		for userId, p in self.pending do self:assign(userId, p.slot, p.ability) end
	end
	if self.runtime.state.phase == "finished" then
		self.runtime.state.winner = self.runtime.state.lastScoringSide
		self.runtime.state.reason = "points"
		self.pending = {}
	end
end

function Session.snapshot(self: any, userId: number)
	local slot = self.members[userId]
	local result = self.runtime:snapshot(slot or "")
	result.mode, result.pending, result.slot = self.mode, self.pending[userId] ~= nil, slot
	result.winner, result.reason = self.runtime.state.winner, self.runtime.state.reason
	result.votes = table.clone(self.votes)
	return result
end

function Session.vote(self: any, userId: number, newId: string)
	if self.runtime.state.phase ~= "finished" or not self.members[userId] then return false end
	self.votes[userId] = true
	for id in self.members do if not self.votes[id] then return false end end
	if next(self.reservations) then return false end
	self.votes, self.history, self.participants = {}, {}, {}
	local r = self.runtime
	r.state = Match.transition(Match.create(newId, r.state.mode), { type = "START" })
	r.tick, r.phaseTicks, r.events, r.eventId = 0, 0, {}, 0
	r.inputs, r.sequences = {}, {}
	for id, slot in self.members do
		self.participants[id] = true
		local athlete = self:athlete(slot)
		athlete.cooldownUntil, athlete.effectUntil, athlete.generation = 0, 0, athlete.generation + 1
		self:record(id, slot, "join")
	end
	r:resetRally()
	return true
end
return Session
