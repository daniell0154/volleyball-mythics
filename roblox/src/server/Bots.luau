--!strict
local Bots = {}
Bots.__index = Bots
local policies = {
	easy = { reaction = 24, error = 1.8 },
	normal = { reaction = 12, error = 0.35 },
	hard = { reaction = 6, error = 0.06 },
}

function Bots.new(seed: number, difficulty: string)
	return setmetatable({ seed = seed, policy = policies[difficulty] or policies.normal, history = {} }, Bots)
end

local function noise(seed: number): number
	local x = bit32.bxor(seed, bit32.lshift(seed, 13))
	x = bit32.bxor(x, bit32.rshift(x, 17))
	x = bit32.bxor(x, bit32.lshift(x, 5))
	return x / 4294967295 * 2 - 1
end

function Bots.step(self: any, match: any)
	if match.tick % 3 == 0 then
		local athletes = {}
		for _, athlete in match.athletes do
			table.insert(athletes, { id = athlete.id, team = athlete.team, x = athlete.position.x, z = athlete.position.z })
		end
		table.insert(self.history, {
			tick = match.tick, phase = match.state.phase, ball = table.clone(match.ball.position),
			last = match.contacts.lastPlayerId, side = match.contacts.lastTouchSide,
			touches = match.contacts.touches, athletes = athletes,
			serveSide = if match.contacts.touches == 0 and not match.contacts.lastContactWasBlock then match.contacts.lastTouchSide else nil,
		})
		if #self.history > 64 then table.remove(self.history, 1) end
	end
	if match.tick % self.policy.reaction ~= 0 then return end
	local observed = self.history[1]
	if not observed then return end
	for _, item in self.history do
		if item.tick <= match.tick - self.policy.reaction then observed = item end
	end
	local previous = self.history[1]
	for _, item in self.history do
		if item.tick <= observed.tick - 3 then previous = item end
	end
	local dt = math.max(1, observed.tick - previous.tick) / 60
	local ball = observed.ball
	local vx, vy, vz = (ball.x - previous.ball.x) / dt, (ball.y - previous.ball.y) / dt, (ball.z - previous.ball.z) / dt
	local discriminant = vy * vy + 2 * 9.81 * (ball.y - 1.7)
	local flight = if discriminant > 0 then math.clamp((vy + math.sqrt(discriminant)) / 9.81, 0, 2.5) else 0
	local error = noise(self.seed + (match.state.score.A + match.state.score.B + 1) * 109) * self.policy.error
	local target = { x = ball.x + vx * flight + error, z = ball.z + vz * flight + error }
	for _, team in { "A", "B" } do
		local responsible, closest = nil, math.huge
		for _, athlete in match.athletes do
			if athlete.team == team and athlete.id ~= observed.last then
				local input = match.inputs[athlete.id]
				local active = athlete.bot or (input and (math.abs(input.moveX) + math.abs(input.moveZ) > 0.1))
				if active then
					local distance = (athlete.position.x - target.x)^2 + (athlete.position.z - target.z)^2
					if distance < closest then closest, responsible = distance, athlete.id end
				end
			end
		end
		for _, athlete in match.athletes do
			if not athlete.bot or athlete.team ~= team then continue end
			local direction = if team == "A" then 1 else -1
			local x, z = if athlete.slot == 0 then -2 else 2, -direction * 6
			local actions = {}
			local aim = { x = 0, z = 0 }
			if match.state.phase == "serving" and team == match.state.servingSide and athlete.slot == match.state.servingSlot then
				x = athlete.position.x
				if athlete.position.z * direction <= -5 then table.insert(actions, "serve") end
			elseif match.state.phase == "rally" and observed.phase == "rally"
				and observed.serveSide ~= team and (if target.z < 0 then "A" else "B") == team and responsible == athlete.id then
				x, z = target.x, target.z
				local action = if observed.side == team then (if observed.touches >= 2 then "attack" else "set") else "receive"
				table.insert(actions, action)
				if action == "attack" and self.policy.error < 1 and ball.y > 1.5 then table.insert(actions, "jump") end
			end
			if self.policy.error < 1 and (actions[1] == "serve" or actions[1] == "attack") then
				local bestScore = -math.huge
				for _, candidate in { {x=-1,z=0}, {x=1,z=0}, {x=0,z=-1}, {x=0,z=1} } do
					local score = math.huge
					for _, opponent in observed.athletes do
						if opponent.team ~= team then
							score = math.min(score, (opponent.x - candidate.x * 3.5)^2 + (opponent.z - direction * (5 + candidate.z * 2))^2)
						end
					end
					if score > bestScore then bestScore, aim = score, candidate end
				end
			end
			local dx, dz = x - athlete.position.x, z - athlete.position.z
			local length = math.sqrt(dx*dx + dz*dz)
			match:submit(athlete.id, {
				seq = (match.sequences[athlete.id] or 0) + 1,
				moveX = if length > 0.15 then dx / math.max(1, length) else 0,
				moveZ = if length > 0.15 then dz / math.max(1, length) else 0,
				actions = actions, aim = aim,
			})
		end
	end
end

return Bots
