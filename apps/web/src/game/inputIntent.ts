export function inputIntent(code: string, phase: string): string | null {
  if (!["serving","rally"].includes(phase)) return null;
  const labels: Record<string,string> = { Space: "Salto", KeyJ: "Recepção / bloqueio", KeyK: "Levantamento", KeyU: "Especial", KeyL: phase === "serving" ? "Saque" : "Ataque" };
  return labels[code] ? labels[code] + " solicitado — aguardando confirmação do servidor" : null;
}
