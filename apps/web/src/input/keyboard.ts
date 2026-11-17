import type { InputPayload } from "@volleyball-mythics/protocol";
const codes = new Set(["KeyW", "KeyA", "KeyS", "KeyD", "Space", "KeyJ", "KeyK", "KeyL", "KeyU"]);
const aimCodes=new Set(["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","KeyC"]);
export class KeyboardInput {
  onIntent: ((code: string) => void) | undefined;
  private held = new Set<string>();
  private pending = new Set<string>();
  private seq = 0;
  private aimEnabled=false;
  private cursorAim:{x:number;z:number}|undefined;
  enableAim(enabled:boolean):void{this.aimEnabled=enabled;if(!enabled)this.cursorAim=undefined;}
  setCursorAim(x:number,z:number):void{if(!this.aimEnabled||!Number.isFinite(x)||!Number.isFinite(z))return;const length=Math.max(1,Math.hypot(x,z));this.cursorAim={x:x/length,z:z/length};}
  synchronizeSequence(seq: number): void { this.seq = Math.max(this.seq, seq); }
  press(code: string, repeat = false): boolean {
    if (!codes.has(code)&&!(this.aimEnabled&&aimCodes.has(code))) return false;
    if(code==="KeyC")this.cursorAim=undefined;
    if (!repeat && !this.held.has(code)) { this.pending.add(code); this.onIntent?.(code); }
    this.held.add(code); return true;
  }
  release(code: string): void { this.held.delete(code); }
  clear(): void { this.held.clear(); this.pending.clear(); this.cursorAim=undefined; }
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
    let aim=this.cursorAim??{x:Number(this.held.has("ArrowRight"))-Number(this.held.has("ArrowLeft")),z:Number(this.held.has("ArrowUp"))-Number(this.held.has("ArrowDown"))};
    const aimLength=Math.max(1,Math.hypot(aim.x,aim.z));aim={x:aim.x/aimLength,z:aim.z/aimLength};
    return { seq: ++this.seq, moveX, moveZ, actions,...(this.aimEnabled?{aim}:{}) };
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
