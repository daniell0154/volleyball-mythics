// Isolated acceptance bridge, never imported by the production entry point.
import {createRoot} from "react-dom/client";
import {Admin} from "../../../apps/web/src/admin/Admin.js";
import {Lobby} from "../../../apps/web/src/lobby/Lobby.js";
import "../../../apps/web/src/styles.css";
async function api(path:string,body?:unknown){const r=await fetch("http://127.0.0.1:3014"+path,{method:body?"POST":"GET",...(body?{body:JSON.stringify(body)}:{})});const value=await r.json();if(!r.ok)throw value;return value;}
let authorized=false;
const services={authorized:async()=>authorized,login:async()=>{authorized=true;},logout:async()=>{authorized=false;},list:async()=>api("/list"),write:async(action:string,id:string,expected:number,payload?:unknown)=>api("/write",{action,id,expected,payload})};
let id=sessionStorage.getItem("012-id");if(!id){id="fixture-"+crypto.randomUUID();sessionStorage.setItem("012-id",id);}
createRoot(document.getElementById("root")!).render(location.search.includes("game")?<Lobby services={{prepareSession:async()=>id!,saveName:async()=>{},loadCatalog:()=>api("/catalog"),serverUrl:()=>"ws://127.0.0.1:3015/socket"}}/>:<Admin services={services}/>);
