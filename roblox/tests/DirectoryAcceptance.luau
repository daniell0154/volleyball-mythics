--!strict
return function(root: Instance, realMap: any?)
	local Directory = require(root.Directory)
	local data = {}
	local map = realMap or {
		UpdateAsync = function(_,key,fn) data[key]=fn(data[key]) return data[key] end,
	}
	local a,b=Directory.new(map),Directory.new(map)
	local pool="duel:"..game:GetService("HttpService"):GenerateGUID(false)
	local first=a:claim(pool,"Online1v1",1,"token-a","room-a",100)
	local second=b:claim(pool,"Online1v1",2,"token-b","room-b",100)
	assert(first.id==second.id,"Simultaneous searches diverged")
	local third=a:claim(pool,"Online1v1",3,"token-c","room-c",101)
	assert(third.id~=first.id)
	a:release(pool,first.id,1,"wrong-token")
	assert(a:confirm(pool,first.id,1,"token-a","job-1","private-1",102))
	assert(not b:confirm(pool,first.id,2,"token-b","job-2","private-1",102))
	assert(not b:confirm(pool,first.id,2,"token-b","job-1","private-2",102))
	assert(b:confirm(pool,first.id,2,"token-b","job-1","private-1",102))
	a:announce(pool,first.id,"job-1",{["1"]=true},{["2"]=120},true,103)
	local returned=b:claim(pool,"Online1v1",2,"return-token","unused",104)
	assert(returned.id==first.id)
	a:release(pool,first.id,2,"return-token")
	assert(not b:confirm(pool,first.id,2,"return-token","job-1","private-1",105))
	assert(not b:confirm(pool,third.id,3,"token-c","job-3","private-3",142))
	local separate=a:claim(pool..":XboxOnly","Online1v1",4,"xbox-token","xbox-room",104)
	assert(separate.id=="xbox-room")
	local solo1=a:claim(pool..":solo","SoloBots2v2",1,"solo-1","solo-room-1",104)
	local solo2=b:claim(pool..":solo","SoloBots2v2",2,"solo-2","solo-room-2",104)
	assert(solo1.id~=solo2.id)
	return {scenarios=10,persistent=realMap~=nil}
end
