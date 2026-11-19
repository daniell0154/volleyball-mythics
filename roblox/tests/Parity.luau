--!nocheck
-- Explicitly invoked in Edit mode. Never runs when a production server starts.
return function(root, fixtures)
	local Ball = require(root.Domain.Ball)
	local Contacts = require(root.Domain.Contacts)
	local Match = require(root.Domain.Match)
	local Rally = require(root.Domain.Rally)
	local checks, maxError = 0, 0
	local function compare(actual, expected, path)
		if type(expected) == "number" then
			local difference = math.abs(actual - expected)
			maxError = math.max(maxError, difference)
			assert(difference <= 1e-9, path .. ": numeric difference " .. difference)
		elseif type(expected) == "table" then
			for key, value in expected do compare(actual[key], value, path .. "." .. tostring(key)) end
			for key in actual do assert(expected[key] ~= nil, path .. ": unexpected field " .. tostring(key)) end
		else
			assert(actual == expected, path .. ": value mismatch")
		end
		checks += 1
	end
	for caseIndex, fixture in fixtures.balls do
		local state = fixture.initial
		for tick, expected in fixture.ticks do
			local nextState, netHit, groundedNow = Ball.step(state)
			compare({ state = nextState, netHit = netHit, groundedNow = groundedNow }, expected, "ball." .. caseIndex .. "." .. tick)
			state = nextState
		end
	end
	for _, fixture in fixtures.contacts do
		local state = Contacts.create(fixture.mode)
		for index, step in fixture.steps do
			local result = Contacts.apply(state, step.id, step.side, step.kind)
			compare(result, step.result, "contact." .. fixture.mode .. "." .. index)
			if result.legal then state = result.state end
		end
	end
	for _, fixture in fixtures.matches do
		local state = Match.create("fixture-" .. fixture.mode, fixture.mode)
		for index, step in fixture.transitions do
			state = Match.transition(state, step.event)
			compare(state, step.state, "match." .. fixture.mode .. "." .. index)
		end
	end
	for index, shot in fixtures.shots do
		compare(Rally.velocity(shot.kind, shot.ball, shot.athlete, shot.direction, shot.attributes, shot.teammate, shot.aim), shot.velocity, "shot." .. index)
	end
	for _, fixture in fixtures.ground do compare(Contacts.ground(fixture.position, fixture.side), fixture.result, "ground") end
	for _, fixture in fixtures.movement do
		compare(Ball.move(fixture.position, fixture.input, fixture.speed, fixture.dt, fixture.bounds), fixture.result, "movement")
	end
	assert(not pcall(Ball.step, { position = { x = 0/0, y = 1, z = 0 }, velocity = { x=0,y=0,z=0 }, grounded=false }), "NaN accepted")
	return { checks = checks, maxAbsoluteError = maxError, ballTicks = #fixtures.balls * 180 }
end
