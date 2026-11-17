export function gameServerUrl(pageUrl: string, dev: boolean, configured?: string): string {
  if (configured?.trim()) return configured.trim();
  const page = new URL(pageUrl);
  if (dev) return "ws://127.0.0.1:3001/socket";
  return `${page.protocol === "https:" ? "wss:" : "ws:"}//${page.host}/socket`;
}
