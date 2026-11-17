import type { InputPayload } from "@volleyball-mythics/protocol";
const codes = new Set(["KeyW", "KeyA", "KeyS", "KeyD", "Space", "KeyJ", "KeyK", "KeyL", "KeyU"]);
export class KeyboardInput {
  private held = new Set<string>();
  private pending = new Set<string>();
  private seq = 0;
  press(code: string, repeat = false): boolean {
    if (!codes.has(code)) return false;
    if (!repeat && !this.held.has(code)) this.pending.add(code);
    this.held.add(code); return true;
  }
  release(code: string): void { this.held.delete(code); }
  clear(): void { this.held.clear(); this.pending.clear(); }
  sample(phase: string): InputPayload {
    const actions: InputPayload["actions"][number][] = [];
    for (const [code, action] of [["Space", "jump"], ["KeyJ", "receive"], ["KeyK", "set"], ["KeyU", "ability"]] as const) {
      if (this.pending.has(code)) actions.push(action);
    }
    if (this.pending.has("KeyL")) {
      if (phase === "serving") actions.push("serve");
      else if (phase === "rally") actions.push("attack");
    }
    this.pending.clear();
    let moveX = Number(this.held.has("KeyD")) - Number(this.held.has("KeyA"));
    let moveZ = Number(this.held.has("KeyS")) - Number(this.held.has("KeyW"));
    const length = Math.hypot(moveX, moveZ);
    if (length > 1) { moveX /= length; moveZ /= length; }
    return { seq: ++this.seq, moveX, moveZ, actions };
  }
}
export function attachKeyboard(target: HTMLElement, keyboard: KeyboardInput): () => void {
  const down = (event: KeyboardEvent) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (keyboard.press(event.code, event.repeat)) event.preventDefault();
  };
  const up = (event: KeyboardEvent) => keyboard.release(event.code);
  const clear = () => keyboard.clear();
  const visibility = () => { if (document.hidden) clear(); };
  target.addEventListener("keydown", down); target.addEventListener("keyup", up); target.addEventListener("blur", clear);
  window.addEventListener("blur", clear); document.addEventListener("visibilitychange", visibility);
  return () => {
    clear(); target.removeEventListener("keydown", down); target.removeEventListener("keyup", up); target.removeEventListener("blur", clear);
    window.removeEventListener("blur", clear); document.removeEventListener("visibilitychange", visibility);
  };
}
