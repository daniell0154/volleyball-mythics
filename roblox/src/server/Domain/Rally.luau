--!strict
local Rally = {}
type Vec3 = { x: number, y: number, z: number }
export type Attributes = { serve: number, receive: number, set: number, attack: number, block: number, speed: number, jump: number }

function Rally.range(attribute: number): number
	return 2.15 + 0.2 * (attribute - 1) / 99
end

function Rally.velocity(kind: string, ball: Vec3, athlete: Vec3, direction: number,
	attributes: Attributes, teammate: Vec3?, aim: { x: number, z: number }?): Vec3
	local x, z = 0, 0
	if aim then x, z = aim.x, aim.z end
	assert(x == x and z == z and math.abs(x) < math.huge and math.abs(z) < math.huge
		and math.sqrt(x * x + z * z) <= 1, "Invalid aim")
	local own = kind == "receive" or kind == "set"
	local targetX = math.clamp((if own and teammate then teammate.x else 0) + x * 3.5, -3.8, 3.8)
	local targetZ: number
	if own then
		local depth = if kind == "set" then math.clamp(2 + z, 1.2, 3)
			else math.clamp((if teammate then math.abs(teammate.z) else 4) + z, 2, 7)
		targetZ = -direction * depth
	else
		targetZ = direction * math.clamp(5 + z * 2, 3, 7)
	end
	local flight = 1.4
	if kind == "serve" then flight = 2.2 - 0.15 * (attributes.serve - 1) / 99
	elseif kind == "receive" then flight = 1.9
	elseif kind == "set" then flight = 1.6
	elseif kind == "attack" then flight = (if athlete.y > 0.5 then 1.3 else 1.65) - 0.12 * (attributes.attack - 1) / 99 end
	return {
		x = (targetX - ball.x) / flight,
		y = (0.11 - ball.y + 0.5 * 9.81 * flight * flight) / flight,
		z = (targetZ - ball.z) / flight,
	}
end

return Rally
