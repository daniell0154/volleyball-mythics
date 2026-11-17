import type { MatchEnded, Team } from "@volleyball-mythics/protocol";
export function ResultPanel({ result, team }: { result: MatchEnded; team: Team }) {
  const save = result.persistence === "saved" ? "Resultado salvo" : result.persistence === "failed" ? "Não foi possível salvar o resultado. O placar desta partida permanece confirmado pelo servidor." : "Salvando resultado…";
  return <section aria-label="Resultado da partida" style={{ padding: 20, marginTop: 16, border: "1px solid #84dbc0", background: "#183449" }}>
    <h2>{result.winner === null ? "Partida cancelada" : result.winner === team ? "Vitória!" : "Derrota"}</h2>
    <p>{result.score.A} × {result.score.B} · {result.reason === "forfeit" ? "Abandono ou desconexão" : result.reason === "server_failure" ? "Sem vencedor" : "Primeiro a seis pontos"}</p>
    <p role="status">{save}</p>
  </section>;
}
