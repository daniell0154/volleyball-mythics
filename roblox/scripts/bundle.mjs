import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";
const base = fileURLToPath(new URL("../", import.meta.url));
function sources(directory) {
  return readdirSync(directory,{withFileTypes:true}).flatMap(entry=>{
    const path=resolve(directory,entry.name);
    return entry.isDirectory()?sources(path):[{path:relative(base,path).replaceAll("\\","/"),source:readFileSync(path,"utf8")}];
  });
}
const files = ["server", "client", "shared"].flatMap(directory => sources(resolve(base,"src",directory)));
const escape=value=>value.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
function item(className,name,children="",source) {
  return '<Item class="'+className+'"><Properties><string name="Name">'+escape(name)+'</string>'+
    (source===undefined?"":'<ProtectedString name="Source">'+escape(source)+'</ProtectedString>')+'</Properties>'+children+'</Item>';
}
function folder(directory,name) {
  const children=readdirSync(directory,{withFileTypes:true}).map(entry=>{
    const path=resolve(directory,entry.name);
    if(entry.isDirectory())return folder(path,entry.name);
    const className = entry.name.endsWith(".server.luau") ? "Script" : entry.name.endsWith(".client.luau") ? "LocalScript" : "ModuleScript";
    return item(className,entry.name.replace(/(\.(server|client))?\.luau$/,""),"",readFileSync(path,"utf8"));
  }).join("");
  return item("Folder",name,children);
}
if(process.argv.includes("--json")) {
  console.log(JSON.stringify(process.argv.includes("--tests") ? [...files,...sources(resolve(base,"tests"))] : files));
} else {
  const xml='<roblox version="4">'+
    item("ServerScriptService","ServerScriptService",folder(resolve(base,"src/server"),"VolleyballMythics"))+
    item("ReplicatedStorage","ReplicatedStorage",folder(resolve(base,"src/shared"),"MythicsShared"))+
    item("StarterPlayer","StarterPlayer",item("StarterPlayerScripts","StarterPlayerScripts",folder(resolve(base,"src/client"),"MythicsClient")))+
    '</roblox>';
  writeFileSync(resolve(base,"Place1.rbxlx"),xml);
  console.log("Saved roblox/Place1.rbxlx. Open in Studio and Play to build the court.");
}
