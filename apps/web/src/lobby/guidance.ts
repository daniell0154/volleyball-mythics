import type {RoomState} from "@volleyball-mythics/protocol";
export function lobbyGuidance(room:RoomState){
 const required=room.mode==="1v1"?2:4,missing=required-room.members.length;
 const canStart=missing===0&&room.members.every(member=>member.connected&&member.character&&member.ready);
 const message=missing>0?"Falta"+(missing===1?" 1 jogador":"m "+missing+" jogadores")+". Compartilhe o convite."
  :room.members.some(member=>!member.connected)?"Aguardando conexão dos participantes."
  :room.members.some(member=>!member.character)?"Cada jogador precisa escolher um atleta."
  :!canStart?"Todos precisam marcar Pronto. Mudar atleta ou posição redefine a prontidão."
  :"Todos prontos. O criador já pode iniciar a partida.";
 return{required,missing,canStart,message};
}
export function commandMessage(code:string){
 if(code==="mode_unavailable")return "O modo 1v1 foi removido. Atualize a página para criar uma sala 2v2 online.";
 const messages:Record<string,string>={room_full:"Esta sala já está cheia.",room_not_found:"Sala não encontrada. Confira o código do convite.",forbidden:"Você não pode fazer essa alteração. Somente o criador inicia a partida.",invalid_state:"A sala precisa estar completa, com atleta escolhido e todos prontos.",rate_limited:"Muitas ações seguidas. Aguarde um instante e tente novamente.",invalid_message:"Não foi possível usar essa opção. Confira os dados e tente novamente."};
 return messages[code]??"Não foi possível concluir a ação. Verifique sua conexão e tente novamente.";
}
export function inviteUrl(code:string,currentUrl:string){const url=new URL(currentUrl);url.search="";url.hash="";url.searchParams.set("room",code);return url.toString();}
