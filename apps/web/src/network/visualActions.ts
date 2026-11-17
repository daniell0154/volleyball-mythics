import type { MatchSnapshot, VisualAction } from "@volleyball-mythics/protocol";

/** Validate the optional extension at the server-message boundary. */
export function validateVisualActions(snapshot: MatchSnapshot): void {
  if (snapshot.visualActions === undefined) return;
  if (!Array.isArray(snapshot.visualActions) || snapshot.visualActions.length > 32) throw new Error("invalid visual actions");
  const ids = new Set<number>();
  for (const action of snapshot.visualActions as VisualAction[]) {
    if (!action || !Number.isSafeInteger(action.id) || action.id <= 0 || ids.has(action.id) ||
      !Number.isSafeInteger(action.tick) || action.tick < 0 || action.tick > snapshot.tick || snapshot.tick - action.tick > 120 ||
      !Number.isFinite(action.facing) || Math.abs(action.facing) > Math.PI ||
      !["serve","receive","set","attack","block","rant","freePoint"].includes(action.kind) ||
      !snapshot.athletes.some((athlete) => athlete.id === action.actorId)) throw new Error("invalid visual action");
    ids.add(action.id);
  }
}
