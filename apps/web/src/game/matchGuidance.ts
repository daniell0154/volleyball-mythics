import type {MatchSnapshot,Team} from "@volleyball-mythics/protocol";
export const phaseLabel:Record<string,string>={countdown:"Prepare-se",serving:"Saque",rally:"Em jogo",point:"Ponto",finished:"Partida encerrada",cancelled:"Partida cancelada",disconnectedSuspension:"Aguardando reconexão"};
export function matchGuidance(snapshot:MatchSnapshot|null,team:Team,slot:number){
 if(!snapshot)return "Aguardando o servidor preparar a quadra.";
 switch(snapshot.phase){
  case "countdown":return "Prepare-se. A partida começa após a contagem.";
  case "serving":return snapshot.servingSide===team&&snapshot.servingSlot===slot?"É seu saque. Aperte L ou use o botão Sacar.":"Aguarde o saque da equipe "+snapshot.servingSide+", posição "+((snapshot.servingSlot??0)+1)+".";
  case "rally":return "Aproxime-se da bola: J recebe ou bloqueia, K levanta, L ataca. Espaço salta e U ativa o especial.";
  case "point":return "Ponto da equipe "+snapshot.servingSide+". Prepare-se para o próximo saque.";
  case "disconnectedSuspension":return "A partida está suspensa enquanto os participantes reconectam. A pose e a jogada foram preservadas.";
  case "finished":return "Confira o resultado e vote na revanche para jogar de novo.";
  case "cancelled":return "Partida cancelada sem vencedor. Você pode sair e criar outra sala.";
 }
}
