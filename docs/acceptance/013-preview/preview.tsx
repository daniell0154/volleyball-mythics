import React from "react";
import {createRoot} from "react-dom/client";
import {Lobby} from "../../../apps/web/src/lobby/Lobby.js";
import "../../../apps/web/src/styles.css";
const mode=new URLSearchParams(location.search).get("catalog");
let id=sessionStorage.getItem("013-ui-id");if(!id){id="ui-test-"+crypto.randomUUID();sessionStorage.setItem("013-ui-id",id);}
const services={
 prepareSession:async()=>id!,
 saveName:async(name:string)=>{if(name.trim().length<2)throw Error("short name");},
 loadCatalog:async()=>{await new Promise(resolve=>setTimeout(resolve,300));if(mode==="error")throw Error("fixture error");if(mode==="empty")return[];return await(await fetch("http://127.0.0.1:3017")).json();},
 serverUrl:()=>"ws://127.0.0.1:3016/socket",
};
createRoot(document.getElementById("root")!).render(<><header className="app-header"><span className="brand"><span className="brand-mark" aria-hidden="true">V</span>VOLLEYBALL <b>MYTHICS</b></span><span className="muted">Revisão local da interface</span></header><Lobby services={services}/></>);
