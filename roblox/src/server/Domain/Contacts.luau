--!strict
local Contacts = {}
export type Side = "A" | "B"
export type Mode = "1v1" | "2v2"
export type State = {
	mode: Mode, touches: number, lastPlayerId: string?, lastTouchSide: Side?, lastContactWasBlock: boolean,
}
export type Result = { legal: boolean, state: State?, counted: boolean?, pointFor: Side?, reason: string? }

function Contacts.create(mode: Mode): State
	return { mode = mode, touches = 0, lastPlayerId = nil, lastTouchSide = nil, lastContactWasBlock = false }
end

function Contacts.apply(state: State, playerId: string, side: Side, kind: "hit" | "block"): Result
	assert(string.find(playerId, "%S"), "playerId is required")
	local other: Side = if side == "A" then "B" else "A"
	if kind == "block" then
		return { legal = true, counted = false, state = {
			mode = state.mode, touches = 0, lastPlayerId = playerId, lastTouchSide = side, lastContactWasBlock = true,
		} }
	end
	local touches = if state.lastTouchSide ~= nil and state.lastTouchSide ~= side then 0 else state.touches
	if state.mode == "2v2" and touches > 0 and state.lastPlayerId == playerId and not state.lastContactWasBlock then
		return { legal = false, pointFor = other, reason = "consecutive_player" }
	end
	if touches >= 3 then
		return { legal = false, pointFor = other, reason = "fourth_touch" }
	end
	return { legal = true, counted = true, state = {
		mode = state.mode, touches = touches + 1, lastPlayerId = playerId, lastTouchSide = side, lastContactWasBlock = false,
	} }
end

function Contacts.ground(position: { x: number, z: number }, lastSide: Side?): Side
	assert(position.x == position.x and math.abs(position.x) < math.huge
		and position.z == position.z and math.abs(position.z) < math.huge, "position must be finite")
	assert(lastSide ~= nil, "grounded ball requires last touch side")
	if math.abs(position.x) <= 4.5 and math.abs(position.z) <= 9 then
		return if position.z < 0 then "B" else "A"
	end
	return if lastSide == "A" then "B" else "A"
end

return Contacts
