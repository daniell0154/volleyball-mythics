--!strict
local Ball = require(script.Parent.Domain.Ball)
local Contacts = require(script.Parent.Domain.Contacts)
local Match = require(script.Parent.Domain.Match)
local Rally = require(script.Parent.Domain.Rally)
local Bots = require(script.Parent.Bots)
local Config = require(game.ReplicatedStorage.MythicsShared.Config)
local Runtime = {}
Runtime.__index = Runtime

local function distance(a: any, b: any): number
	return math.sqrt((a.x-b.x)^2 + (a.y-b.y)^2 + (a.z-b.z)^2)
end

function Runtime.new(id: string, humanId: string, team: string, ability: string, difficulty: string, seed: number, profile: string?)
	local mode = if profile == "Online1v1" then "1v1" else "2v2"
	local self: any = setmetatable({
		state = Match.create(id, mode), tick = 0, phaseTicks = 0, athletes = {},
		inputs = {}, sequences = {}, touching = {}, contacts = Contacts.create(mode),
		ball = { position = { x = 0, y = 1.25, z = -6 }, velocity = { x = 0, y = 0, z = 0 }, grounded = false },
		bots = if mode == "1v1" then nil else Bots.new(seed, difficulty), feedback = "", events = {}, eventId = 0,
		humanId = humanId, abilityId = ability, cooldownUntil = 0, difficulty = difficulty,
	}, Runtime)
	for _, side in { "A", "B" } do
		for slot = 0, (if mode == "1v1" then 0 else 1) do
			local human = side == team and slot == 0
			table.insert(self.athletes, {
				id = if human then humanId else "bot:" .. side .. slot,
				team = side, slot = slot, bot = mode ~= "1v1" and not human,
				active = mode ~= "1v1" or human, abilityId = if human then ability else "fundamentals", cooldownUntil = 0, generation = 1,
				position = { x = if slot == 0 then -2 else 2, y = 0, z = if side == "A" then -6 else 6 },
				velocityY = 0, recovery = 0, effectUntil = 0, attributes = table.clone(Config.Attributes),
			})
		end
	end
	self.state = Match.transition(self.state, { type = "START" })
	return self
end

function Runtime.submit(self: any, id: string, input: any)
	if input.seq <= (self.sequences[id] or 0) then return end
	self.sequences[id] = input.seq
	local previous = self.inputs[id]
	local actions = if previous then previous.actions else {}
	local receivedAction = if previous then previous.actionTick else -100
	if #input.actions > 0 then
		-- Merge presses arriving before the same tick, without extending older presses.
		if not previous or self.tick - previous.actionTick > 6 then actions = {} end
		if #actions == 0 then receivedAction = self.tick end
		for _, action in input.actions do
			if not table.find(actions, action) then table.insert(actions, action) end
		end
	end
	self.inputs[id] = {
		moveX = input.moveX, moveZ = input.moveZ, aim = input.aim,
		actions = actions, actionTick = receivedAction, receivedTick = self.tick,
	}
end

function Runtime.visual(self: any, athlete: any, kind: string)
	self.eventId += 1
	table.insert(self.events, { id = self.eventId, athleteId = athlete.id, kind = kind, tick = self.tick })
	if #self.events > 32 then table.remove(self.events, 1) end
end

function Runtime.point(self: any, side: any, reason: string)
	if self.warmup then
		self.state.phase, self.phaseTicks = "serving", 0
		for _, athlete in self.athletes do if athlete.active then self.state.servingSide = athlete.team break end end
		self:resetRally()
		return
	end
	local nextState = Match.transition(self.state, {
		type = "RALLY_POINT", scoringSide = side, pointId = self.state.matchId .. ":" .. self.state.rallyId,
	})
	if nextState == self.state then return end
	self.state, self.phaseTicks, self.feedback = nextState, 0, reason
	self.inputs = {}
end

function Runtime.resetRally(self: any)
	self.contacts, self.touching, self.inputs = Contacts.create(self.state.mode), {}, {}
	self.feedback = ""
	for _, athlete in self.athletes do
		athlete.position = { x = if athlete.slot == 0 then -2 else 2, y = 0, z = if athlete.team == "A" then -6 else 6 }
		athlete.velocityY, athlete.recovery = 0, 0
		if athlete.team == self.state.servingSide and athlete.slot == self.state.servingSlot then
			self.ball = { position = {x=athlete.position.x,y=1.25,z=athlete.position.z}, velocity={x=0,y=0,z=0}, grounded=false }
		end
	end
end

function Runtime.ability(self: any, athlete: any)
	local ability = athlete.abilityId or self.abilityId
	local untilTick = athlete.cooldownUntil or self.cooldownUntil
	if self.tick < untilTick then self.feedback = "Habilidade em recarga" return end
	if ability == "teammate_rant" then
		local teammate = nil
		for _, candidate in self.athletes do
			if candidate.team == athlete.team and candidate.id ~= athlete.id then teammate = candidate end
		end
		if not teammate then self.feedback = "Sem parceiro disponível" return end
		if teammate.effectUntil > self.tick then self.feedback = "Parceiro já tem um efeito ativo" return end
		teammate.effectUntil = self.tick + 300
		self.cooldownUntil = self.tick + 1200
		athlete.cooldownUntil = self.cooldownUntil
		self:visual(athlete, "rant")
	elseif ability == "free_point_out" then
		if distance(self.ball.position, athlete.position) > 1.9 then self.feedback = "Chegue perto da bola" return end
		self.cooldownUntil = self.tick + 1500
		athlete.cooldownUntil = self.cooldownUntil
		self:visual(athlete, "freePoint")
		self:point(if athlete.team == "A" then "B" else "A", "Foi Sem Querer")
	end
end

function Runtime.action(self: any, athlete: any, input: any)
	local direction = if athlete.team == "A" then 1 else -1
	local actions = input.actions
	if self.state.phase == "rally" and not athlete.bot and table.find(actions, "ability") then self:ability(athlete) end
	if self.state.phase == "serving" then
		if not table.find(actions, "serve") then return end
		if athlete.team ~= self.state.servingSide or athlete.slot ~= self.state.servingSlot then
			if not athlete.bot then self.feedback = "Aguarde sua vez de sacar" end
			return
		end
		if athlete.position.z * direction > -5 then
			if not athlete.bot then self.feedback = "Recue para sacar" end
			return
		end
		self.state = Match.transition(self.state, { type = "SERVE_HIT" })
		self.phaseTicks = 0
		self.contacts = Contacts.create(self.state.mode)
		self.contacts.lastTouchSide, self.contacts.lastPlayerId = athlete.team, athlete.id
		local position = { x = athlete.position.x, y = athlete.position.y + 1.25, z = athlete.position.z }
		self.ball = {
			position = position, velocity = Rally.velocity("serve", position, athlete.position, direction, athlete.attributes, nil, input.aim),
			grounded = false,
		}
		self.touching[athlete.id], athlete.recovery = true, self.tick + 6
		self:visual(athlete, "serve")
		return
	end
	if self.state.phase ~= "rally" or self.touching[athlete.id] or self.tick < athlete.recovery then return end
	local action = if table.find(actions, "attack") then "attack"
		elseif table.find(actions, "set") then "set" elseif table.find(actions, "receive") then "receive" else nil
	if not action then return end
	local attribute = if action == "set" then athlete.attributes.set elseif action == "attack" then athlete.attributes.attack else athlete.attributes.receive
	local multiplier = if athlete.effectUntil > self.tick then 0.85 else 1
	local center = { x = athlete.position.x, y = athlete.position.y + 1.1, z = athlete.position.z }
	if distance(self.ball.position, center) > Rally.range(attribute) * multiplier then
		if not athlete.bot then self.feedback = "Chegue mais perto da bola" end
		return
	end
	local block = action == "receive" and athlete.position.y > 0.2 and math.abs(athlete.position.z) < 1 and self.ball.position.y >= 2.43
	local result = Contacts.apply(self.contacts, athlete.id, athlete.team, if block then "block" else "hit")
	if not result.legal then self:point(result.pointFor, result.reason or "Falta") return end
	self.contacts = result.state
	self.touching[athlete.id], athlete.recovery = true, self.tick + 6
	local teammate = nil
	for _, other in self.athletes do
		if other.team == athlete.team and other.id ~= athlete.id then teammate = other.position end
	end
	self.ball.velocity = Rally.velocity(if block then "block" else action, self.ball.position, athlete.position, direction, athlete.attributes, teammate, input.aim)
	self:visual(athlete, if block then "block" else action)
end

function Runtime.step(self: any)
	if self.state.phase == "finished" or self.state.phase == "cancelled" or self.suspended then return end
	self.tick += 1
	self.phaseTicks += 1
	if self.bots then self.bots:step(self) end
	if self.state.phase == "countdown" then
		if self.phaseTicks < 180 then return end
		self.state = Match.transition(self.state, { type = "COUNTDOWN_FINISHED" })
		self.phaseTicks = 0
		self:resetRally()
	elseif self.state.phase == "point" then
		if self.phaseTicks < 120 then return end
		self.state = Match.transition(self.state, { type = "POINT_DELAY_FINISHED" })
		self.phaseTicks = 0
		self:resetRally()
	end
	if self.state.phase == "serving" and self.phaseTicks >= 480 then
		self:point(if self.state.servingSide == "A" then "B" else "A", "Tempo de saque esgotado")
		return
	end
	for _, athlete in self.athletes do
		if not athlete.active then continue end
		local input = self.inputs[athlete.id]
		if input and self.tick - input.receivedTick <= 15 then
			local direction = if athlete.team == "A" then 1 else -1
			local speed = (2 + (athlete.attributes.speed - 1) / 99 * 6) * (if athlete.effectUntil > self.tick then 0.85 else 1)
			athlete.position = Ball.move(athlete.position, { x = input.moveX, z = input.moveZ }, speed, 1/60, {
				minX = -4.175, maxX = 4.175,
				minZ = if direction == 1 then -8.675 else 0.325, maxZ = if direction == 1 then -0.325 else 8.675,
			})
			local actions = if self.tick - input.actionTick <= 6 then input.actions else {}
			if table.find(actions, "jump") and athlete.position.y == 0 then athlete.velocityY = 4 + (athlete.attributes.jump - 1) / 99 * 5 end
			self:action(athlete, { actions = actions, aim = input.aim })
			input.actions = {}
			if self.state.phase == "point" or self.state.phase == "finished" then return end
		end
		if athlete.position.y > 0 or athlete.velocityY > 0 then
			athlete.velocityY -= 9.81 / 60
			athlete.position.y = math.max(0, athlete.position.y + athlete.velocityY / 60)
			if athlete.position.y == 0 then athlete.velocityY = 0 end
		end
	end
	if self.state.phase == "serving" then
		for _, athlete in self.athletes do
			if athlete.team == self.state.servingSide and athlete.slot == self.state.servingSlot then
				self.ball.position = { x = athlete.position.x, y = athlete.position.y + 1.25, z = athlete.position.z }
			end
		end
	elseif self.state.phase == "rally" then
		local nextBall, _, grounded = Ball.step(self.ball)
		self.ball = nextBall
		for _, athlete in self.athletes do
			local center = { x = athlete.position.x, y = athlete.position.y + 1.1, z = athlete.position.z }
			if distance(self.ball.position, center) > 2.5 then self.touching[athlete.id] = nil end
		end
		if grounded then self:point(Contacts.ground(self.ball.position, self.contacts.lastTouchSide), "Bola no chão") end
	end
end

function Runtime.snapshot(self: any, viewer: string?)
	local athletes = {}
	local localAthlete = nil
	for _, athlete in self.athletes do
		if athlete.id == (viewer or self.humanId) then localAthlete = athlete end
		table.insert(athletes, {
			id = athlete.id, team = athlete.team, slot = athlete.slot, bot = athlete.bot,
			position = table.clone(athlete.position), effectUntil = athlete.effectUntil,
			generation = athlete.generation, active = athlete.active, userId = athlete.userId,
		})
	end
	return {
		matchId = self.state.matchId, tick = self.tick, rallyId = self.state.rallyId, phase = self.state.phase, score = table.clone(self.state.score),
		phaseTicks = self.phaseTicks, servingSide = self.state.servingSide, servingSlot = self.state.servingSlot,
		ball = table.clone(self.ball.position), athletes = athletes, events = table.clone(self.events),
		abilityId = if localAthlete then localAthlete.abilityId else self.abilityId,
		cooldownUntil = if localAthlete then localAthlete.cooldownUntil else self.cooldownUntil,
		humanId = viewer or self.humanId, feedback = self.feedback,
		warmup = self.warmup == true, suspended = self.suspended == true,
	}
end

return Runtime
