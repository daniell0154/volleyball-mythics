--!strict
return function(root: Instance)
	local Session = require(root.Session)
	local s = Session.new("doubles-test", "Online2v2", 1, "fundamentals", "A", "normal", 42)
	local function bots()
		local n = 0
		for _, a in s.runtime.athletes do if a.bot then n += 1 end end
		return n
	end
	assert(bots() == 3)
	s.runtime.state.phase = "rally"
	assert(s:join(2, "fundamentals", 1))
	assert(s:join(3, "fundamentals", 2))
	assert(s:join(4, "fundamentals", 3))
	assert(not s:join(5, "fundamentals", 3))
	assert(bots() == 3 and s.pending[2] and not s.members[2])
	local slot = s.pending[2].slot
	local athlete = s:athlete(slot)
	athlete.cooldownUntil = 600
	local generation = athlete.generation
	s.runtime:point("A", "test")
	for i = 1, 120 do s:step(3 + i/60) end
	assert(bots() == 0 and s.members[2] == slot)
	assert(athlete.generation > generation and athlete.cooldownUntil == 600)
	local counts = {A=0,B=0}
	for _, id in s.members do counts[id:sub(1,1)] += 1 end
	assert(counts.A == 2 and counts.B == 2)
	s:leave(2, false, 10)
	assert(bots() == 1 and s.reservations[2])
	assert(s:join(2, "fundamentals", 15))
	assert(bots() == 0 and s.members[2] == slot and athlete.cooldownUntil == 600)
	s:leave(3, false, 20)
	s:expire(41)
	assert(not s.reservations[3] and bots() == 1)
	assert(s:join(5, "fundamentals", 42))
	assert(bots() == 0)
	s:leave(5, true, 43)
	assert(bots() == 1 and not s.reservations[5])
	s.runtime.state.phase = "rally"
	assert(s:join(6, "fundamentals", 44))
	s.runtime.state.score.A = 5
	s.runtime:point("A", "test")
	s:step(45)
	assert(not s.participants[6] and next(s.pending) == nil)
	return { scenarios = 9, humans = 4 }
end
