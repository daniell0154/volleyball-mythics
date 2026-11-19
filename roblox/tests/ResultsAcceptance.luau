--!strict
return function(root: Instance)
	local Collection = require(root.Collection)
	local Results = require(root.Results)
	local db,profiles = {},{}
	local failure = true
	local store = {
		UpdateAsync=function(_,key,fn)
			if key=="match:result-test" and failure then failure=false error("Injected partial write") end
			db[key]=fn(db[key])
			return db[key]
		end,
		GetAsync=function(_,key) return db[key] end,
	}
	local collection=Collection.new({UpdateAsync=function(_,key,fn) profiles[key]=fn(profiles[key]) return profiles[key] end},true)
	local results=Results.new({collection=collection},store)
	local payload={matchId="result-test",mode="Online1v1",score={A=6,B=3},winner="A",reason="points",
		participants={1,2},eligible={["1"]=true,["2"]=true},history={},finishedAt=100,rulesVersion=4}
	assert(not pcall(function() results:save(payload) end))
	assert(db["user:1"]["result-test"].complete==false)
	assert(results:save(payload))
	assert(results:save(payload))
	assert(collection:read(1).spins==2 and collection:read(2).spins==2)
	local conflict=table.clone(payload)
	conflict.winner="B"
	assert(not pcall(function() results:save(conflict) end))
	local forfeit=table.clone(payload)
	forfeit.matchId,forfeit.reason="forfeit-test","forfeit"
	assert(results:save(forfeit))
	assert(collection:read(1).spins==2)
	return {scenarios=5,duplicateRewards=0}
end
