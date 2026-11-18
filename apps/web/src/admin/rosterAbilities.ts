export interface RosterAbility {
  id: string;
  enabled: boolean;
  ability_config: {
    name: string;
    description: string;
    target: "self" | "teammate" | "opponent_team";
    durationSeconds: number;
    cooldownSeconds: number;
  };
}

export function drawAbility(catalog: readonly RosterAbility[], currentId: string, random = Math.random) {
  const enabled = catalog.filter(ability => ability.enabled);
  if (enabled.length <= 1) return enabled[0];
  const alternatives = enabled.filter(ability => ability.id !== currentId);
  return alternatives[Math.floor(random() * alternatives.length)];
}
