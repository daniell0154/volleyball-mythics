--!strict
-- Generated from TypeScript. Chunks respect Studio Source size limits.
local chunks = {}
for i = 1, 10 do
 table.insert(chunks, require(script.Parent.FixtureChunks:FindFirstChild("Chunk" .. i) :: ModuleScript))
end
return game:GetService("HttpService"):JSONDecode(table.concat(chunks))
