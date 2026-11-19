--!strict
local Match = {}
type Side = "A" | "B"
export type State = {
	matchId: string, mode: "1v1" | "2v2", phase: string, score: { A: number, B: number },
	servingSide: Side, servingSlot: number, nextServingSlot: { A: number, B: number },
	rallyId: number, lastScoringSide: Side?, appliedPointIds: { string }, rulesVersion: number,
}
export type Event = { type: string, pointId: string?, scoringSide: Side? }

function Match.create(id: string, mode: "1v1" | "2v2"): State
	assert(string.find(id, "%S"), "matchId is required")
	return {
		matchId = id, mode = mode, phase = "lobby", score = { A = 0, B = 0 },
		servingSide = "A", servingSlot = 0, nextServingSlot = { A = 1, B = 0 },
		rallyId = 0, lastScoringSide = nil, appliedPointIds = {}, rulesVersion = 4,
	}
end

function Match.transition(state: State, event: Event): State
	if state.phase == "finished" or state.phase == "cancelled" then return state end
	local nextState = table.clone(state)
	if event.type == "CANCEL" then
		nextState.phase = "cancelled"
	elseif event.type == "START" and state.phase == "lobby" then
		nextState.phase = "countdown"
	elseif event.type == "COUNTDOWN_FINISHED" and state.phase == "countdown" then
		nextState.phase = "serving"
		nextState.rallyId += 1
	elseif event.type == "SERVE_HIT" and state.phase == "serving" then
		nextState.phase = "rally"
	elseif event.type == "POINT_DELAY_FINISHED" and state.phase == "point" then
		nextState.phase = "serving"
		nextState.rallyId += 1
	elseif event.type == "RALLY_POINT" and (state.phase == "rally" or state.phase == "serving") then
		local id, side = event.pointId, event.scoringSide
		if id == nil or id == "" or side == nil or table.find(state.appliedPointIds, id) then return state end
		nextState.score = table.clone(state.score)
		nextState.score[side] += 1
		nextState.phase = if nextState.score[side] == 6 then "finished" else "point"
		if side ~= state.servingSide and state.mode == "2v2" then
			nextState.servingSlot = state.nextServingSlot[side]
			nextState.nextServingSlot = table.clone(state.nextServingSlot)
			nextState.nextServingSlot[side] = if nextState.servingSlot == 0 then 1 else 0
		end
		nextState.servingSide = side
		nextState.lastScoringSide = side
		nextState.appliedPointIds = table.clone(state.appliedPointIds)
		table.insert(nextState.appliedPointIds, id)
	else
		return state
	end
	return nextState
end

return Match
