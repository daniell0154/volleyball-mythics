--!strict
return function(root: Instance)
	local Collection = require(root.Collection)
	local data = {}
	local calls = 0
	local store = { UpdateAsync = function(_, key, callback)
		calls += 1
		-- Roblox can re-run transforms. Both attempts must produce the same prize.
		local first = callback(data[key])
		local second = callback(data[key])
		if first and second and #first.order > 0 then
			local op = first.order[#first.order]
			assert(first.receipts[op].ability == second.receipts[op].ability)
		end
		data[key] = second
		return second
	end }
	local a, b = Collection.new(store, true), Collection.new(store, true)
	local p = a:read(1)
	assert(p.spins == 1 and p.owned.fundamentals and p.equipped == "fundamentals")
	local op = { id = "operation-1", seq = 1, revision = 0, kind = "spin" }
	local first, status, receipt = a:operate(1, op)
	assert(status == "ok" and first.spins == 0 and first.owned[receipt.ability])
	local duplicate = b:operate(1, op)
	assert(duplicate.spins == 0 and duplicate.revision == 1)
	local stale, staleStatus = b:operate(1, { id = "operation-2", seq = 1, revision = 0, kind = "spin" })
	assert(staleStatus == "stale" and stale.spins == 0)
	local invalid, invalidStatus = a:operate(1, { id = "operation-3", seq = 2, revision = 1, kind = "equip", ability = "unknown" })
	assert(invalidStatus == "not_owned" and invalid.equipped == "fundamentals")
	a:reward(1, "match-one")
	local rewarded = b:reward(1, "match-one")
	assert(rewarded.spins == 1)
	local second = a:operate(1, { id = "operation-4", seq = 3, revision = rewarded.revision, kind = "spin" })
	assert(second.owned.teammate_rant and second.owned.free_point_out and second.spins == 0)
	a:reward(1, "match-two")
	local full = a:read(1)
	local preserved, complete = b:operate(1, { id = "operation-5", seq = 4, revision = full.revision, kind = "spin" })
	assert(complete == "complete" and preserved.spins == 1)
	local equipped = b:operate(1, { id = "operation-6", seq = 5, revision = preserved.revision, kind = "equip", ability = receipt.ability })
	assert(a:read(1).equipped == equipped.equipped)
	local public = Collection.new(store, false):view(equipped)
	assert(public.complete and #public.catalog == 3)
	return { scenarios = 9, transforms = calls * 2 }
end
