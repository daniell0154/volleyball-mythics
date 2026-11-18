import type { MatchEnded, Team } from "@volleyball-mythics/protocol";
export function ResultPanel({ result, team, userId, voteDisabled = false, onVote }: { result: MatchEnded; team: Team; userId: string; voteDisabled?: boolean; onVote(): void }) {
  const save = result.persistence === "saved" ? "Resultado salvo" : result.persistence === "failed" ? "Não foi possível salvar o resultado. O placar desta partida permanece confirmado pelo servidor." : result.persistence==="not_required"?"Nenhum resultado a salvar.":"Salvando resultado…";
  return <section aria-label="Resultado da partida" className="panel result-panel">
    <h2>{result.winner === null ? "Partida cancelada" : result.winner === team ? "Vitória!" : "Derrota"}</h2>
    <p className="result-score">{result.score.A} × {result.score.B}</p><p>{result.reason === "forfeit" ? "Abandono ou desconexão" : result.reason === "server_failure" ? "Sem vencedor" : "Primeiro a seis pontos"}</p>
    <p role="status">{save}</p>
    <p>Votos para revanche: {result.rematchVotes.length}</p>
    <button className="primary" disabled={voteDisabled || result.rematchVotes.includes(userId)} onClick={onVote}>{result.rematchVotes.includes(userId) ? "Aguardando os outros jogadores" : "Quero revanche"}</button><p className="helper">A revanche começa quando todos os jogadores humanos votarem. Bots não precisam votar.</p>
  </section>;
}
