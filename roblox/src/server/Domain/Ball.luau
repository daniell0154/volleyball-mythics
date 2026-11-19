--!strict
-- Positions are meters. Keep doubles until converting to Roblox Vector3.
local Ball = {}
export type Vec3 = { x: number, y: number, z: number }
export type State = { position: Vec3, velocity: Vec3, grounded: boolean }

local function finite(value: number): boolean
	return value == value and math.abs(value) < math.huge
end

function Ball.validateVector(value: Vec3)
	assert(finite(value.x) and finite(value.y) and finite(value.z), "ball state must be finite")
end

function Ball.step(state: State): (State, boolean, boolean)
	Ball.validateVector(state.position)
	Ball.validateVector(state.velocity)
	if state.grounded then
		return state, false, false
	end
	local dt, radius = 1 / 60, 0.11
	local p = state.position
	local v = { x = state.velocity.x, y = state.velocity.y - 9.81 * dt, z = state.velocity.z }
	local nextPosition = { x = p.x + v.x * dt, y = p.y + v.y * dt, z = p.z + v.z * dt }
	local floorFraction = math.huge
	if p.y > radius and nextPosition.y <= radius then
		floorFraction = (p.y - radius) / (p.y - nextPosition.y)
	end
	local crossedNet = (p.z < 0 and nextPosition.z >= 0) or (p.z > 0 and nextPosition.z <= 0)
	local netFraction = math.huge
	if crossedNet then
		netFraction = math.abs(p.z) / math.abs(nextPosition.z - p.z)
	end
	local netY = p.y + (nextPosition.y - p.y) * netFraction
	local netX = p.x + (nextPosition.x - p.x) * netFraction
	local netCollision = crossedNet and netFraction >= 0 and netFraction <= 1
		and math.abs(netX) <= 4.5 + radius and netY - radius <= 2.43
	local collisionFraction = if netCollision then netFraction else math.huge
	if floorFraction <= 1 and floorFraction <= collisionFraction then
		local fraction = math.max(0, floorFraction)
		return {
			position = { x = p.x + (nextPosition.x - p.x) * fraction, y = radius, z = p.z + (nextPosition.z - p.z) * fraction },
			velocity = v, grounded = true,
		}, false, true
	end
	if netCollision then
		return {
			position = { x = netX, y = netY, z = if p.z < 0 then -radius else radius },
			velocity = { x = v.x, y = v.y, z = -v.z * 0.45 }, grounded = false,
		}, true, false
	end
	return { position = nextPosition, velocity = v, grounded = false }, false, false
end

function Ball.move(position: Vec3, input: { x: number, z: number }, speed: number, dt: number,
	bounds: { minX: number, maxX: number, minZ: number, maxZ: number }): Vec3
	Ball.validateVector(position)
	for _, value in { input.x, input.z, speed, dt, bounds.minX, bounds.maxX, bounds.minZ, bounds.maxZ } do
		assert(finite(value), "movement inputs must be finite")
	end
	assert(speed >= 0 and dt >= 0, "negative movement")
	local length = math.sqrt(input.x * input.x + input.z * input.z)
	local scale = if length > 1 then 1 / length else 1
	return {
		x = math.clamp(position.x + input.x * scale * speed * dt, bounds.minX, bounds.maxX),
		y = position.y,
		z = math.clamp(position.z + input.z * scale * speed * dt, bounds.minZ, bounds.maxZ),
	}
end

return Ball
