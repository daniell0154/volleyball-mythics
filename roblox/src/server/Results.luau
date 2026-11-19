--!strict
local Http = game:GetService("HttpService")
local Run = game:GetService("RunService")
local Results = {}
Results.__index = Results
local function canonical(value: any): string
	if type(value) ~= "table" then return Http:JSONEncode(value) end
	local keys = {}
	for key in value do table.insert(keys, key) end
	table.sort(keys, function(a,b) return tostring(a)<tostring(b) end)
	local parts = {}
	for _, key in keys do table.insert(parts,Http:JSONEncode(tostring(key)) .. "=" .. canonical(value[key])) end
	return "{" .. table.concat(parts,",") .. "}"
end
function Results.new(profiles: any, injectedStore: any?)
	local store = injectedStore or game:GetService("DataStoreService"):GetDataStore(if Run:IsStudio() then "MythicsStudioResults_v1" else "MythicsResults_v1")
	local self: any = setmetatable({store=store,profiles=profiles,pending={}},Results)
	if Run:IsServer() then
		game:BindToClose(function()
			local deadline=os.clock()+25
			while next(self.pending) and os.clock()<deadline do task.wait(.2) end
		end)
	end
	return self
end
function Results.save(self: any, payload: any): boolean
	local id, signature = payload.matchId, canonical(payload)
	-- The durable user inbox is also a repair journal if the process ends mid-write.
	for _, userId in payload.participants do
		self.store:UpdateAsync("user:"..userId,function(old)
			local index=table.clone(old or {})
			local receipt=index[id]
			if receipt then assert(receipt.signature==signature,"Conflicting result")
			else index[id]={payload=payload,signature=signature,complete=false} end
			return index
		end)
	end
	self.store:UpdateAsync("match:"..id,function(old)
		if old then assert(old.signature==signature,"Conflicting immutable result") return old end
		return {payload=payload,signature=signature}
	end)
	for _, userId in payload.participants do
		if payload.reason=="points" and payload.eligible[tostring(userId)] then
			if not self.profiles.collection:reward(userId,id) then return false end
		end
		self.store:UpdateAsync("user:"..userId,function(old)
			local index=table.clone(old or {})
			local entry=table.clone(index[id])
			entry.complete=true
			index[id]=entry
			return index
		end)
	end
	return true
end
function Results.enqueue(self: any, payload: any)
	if self.pending[payload.matchId] then return end
	self.pending[payload.matchId]=true
	task.spawn(function()
		local saved=false
		while not saved do
			local ok,result=pcall(function() return self:save(payload) end)
			saved=ok and result==true
			if not saved then warn("Result save pending",payload.matchId,result) task.wait(5) end
		end
		self.pending[payload.matchId]=nil
	end)
end
function Results.finish(self: any, session: any)
	local participants,eligible={},{}
	for userId in session.participants do table.insert(participants,userId) end
	table.sort(participants)
	for userId in session.members do eligible[tostring(userId)]=true end
	local payload={matchId=session.runtime.state.matchId,mode=session.mode,score=table.clone(session.runtime.state.score),
		winner=session.runtime.state.winner,reason=session.runtime.state.reason,history=table.clone(session.history),
		participants=participants,eligible=eligible,finishedAt=os.time(),rulesVersion=4}
	self:enqueue(payload)
end
function Results.repair(self: any, userId: number)
	local ok,index=pcall(function() return self.store:GetAsync("user:"..userId) end)
	if ok and index then
		for _, entry in index do if not entry.complete then self:enqueue(entry.payload) end end
	end
end
return Results
