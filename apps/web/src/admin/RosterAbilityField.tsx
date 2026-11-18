import { drawAbility, type RosterAbility } from "./rosterAbilities.js";

const targetLabels = { self: "Próprio atleta", teammate: "Parceiro de equipe", opponent_team: "Time adversário" };

export function RosterAbilityField({ catalog, currentId, drawEnabled, onChange }: {
  catalog: readonly RosterAbility[];
  currentId: string;
  drawEnabled: boolean;
  onChange: (id: string) => void;
}) {
  const selected = catalog.find(ability => ability.id === currentId);
  const enabled = catalog.filter(ability => ability.enabled);
  const status = enabled.length === 0 ? "Nenhuma habilidade disponível para publicação."
    : !drawEnabled ? "Sorteio aguardando liberação."
      : enabled.length === 1 ? `Única habilidade disponível: ${enabled[0]!.ability_config.name}.` : "";
  const config = selected?.ability_config;

  return <div className="admin-ability">
    <div className="admin-ability-controls">
      <label>Habilidade
        <select aria-label="Habilidade" value={currentId} onChange={event => onChange(event.target.value)}>
          {!currentId && <option value="" disabled>Selecione uma habilidade</option>}
          {currentId && !selected?.enabled && <option value={currentId} disabled>{config?.name ?? currentId} · indisponível</option>}
          {enabled.map(ability => <option key={ability.id} value={ability.id}>{ability.ability_config.name}</option>)}
        </select>
      </label>
      <button type="button" disabled={!drawEnabled || enabled.length === 0}
        aria-describedby={status ? "roster-ability-status" : undefined} onClick={() => {
          const result = drawAbility(catalog, currentId);
          if (result) onChange(result.id);
        }}>Sortear habilidade</button>
    </div>
    {status && <p className="helper" id="roster-ability-status">{status}</p>}
    {config && <div className="admin-ability-details" aria-label="Detalhes da habilidade" role="group">
      <p>{config.description}</p>
      <dl>
        <div><dt>Alvo</dt><dd>{targetLabels[config.target]}</dd></div>
        <div><dt>Duração</dt><dd>{config.durationSeconds === 0 ? "Imediata" : `${config.durationSeconds} s`}</dd></div>
        <div><dt>Recarga</dt><dd>{config.cooldownSeconds} s</dd></div>
      </dl>
    </div>}
  </div>;
}
