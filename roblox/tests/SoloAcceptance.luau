--!nocheck
-- Run explicitly in Edit mode. Exercises the production Runtime entry points.
return function(root)
	local Runtime = require(root.Runtime)
	local results = {}
	for _, difficulty in {"easy", "normal", "hard"} do
		for _, team in {"A", "B"} do
			local match = Runtime.new("solo-" .. team .. difficulty, "fixture-human", team, "teammate_rant", difficulty, 42)
			local bots = 0
			for _, athlete in match.athletes do if athlete.bot then bots += 1 end end
			assert(bots == 3, "solo must have exactly three bots")
			for tick = 1, 18000 do
				local actions = {}
				if match.state.phase == "serving" then actions = {"serve"}
				elseif match.state.phase == "rally" and tick%120 == 0 then actions = {"jump", "receive", "ability"} end
				if #actions > 0 then
					match:submit("fixture-human", {
						seq = (match.sequences["fixture-human"] or 0)+1,
						moveX = 0, moveZ = 0, aim = {x=0,z=0}, actions = actions,
					})
				end
				match:step()
				if match.state.phase == "point" and match.feedback == "Bola no chão" then
					assert(math.abs(match.ball.position.y-0.11) < 1e-9, "ground point before touchdown")
				end
				if match.state.phase == "finished" then break end
				if tick%1000 == 0 then task.wait() end
			end
			assert(match.state.phase == "finished", "match did not finish")
			assert(math.max(match.state.score.A, match.state.score.B) == 6, "invalid winner")
			assert(match.cooldownUntil > 0, "ability never activated")
			table.insert(results, {team=team,difficulty=difficulty,tick=match.tick,score=match.state.score,events=match.eventId})
		end
	end
	local match = Runtime.new("ability-fixture","fixture-human","A","free_point_out","normal",42)
	match.state.phase = "rally"
	match.state.rallyId = 1
	local human = match.athletes[1]
	match.ball.position = {x=human.position.x,y=1,z=human.position.z}
	match:submit("fixture-human",{seq=1,moveX=0,moveZ=0,aim={x=0,z=0},actions={"ability"}})
	match:step()
	assert(match.state.score.B == 1 and match.state.phase == "point", "ability must award exactly one point")
	match:step()
	assert(match.state.score.B == 1, "duplicate ability point")
	match:submit("fixture-human",{seq=1,moveX=1,moveZ=0,aim={x=0,z=0},actions={"ability"}})
	assert(match.inputs["fixture-human"] == nil, "repeated input queued new movement")
	return {matches=results,freePointOnce=true}
end
