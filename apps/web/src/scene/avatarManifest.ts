import { createAvatar } from "./avatar.js";
import { createAthleticAvatar } from "./athleticAvatar.js";

/** Presentation revision only: never rewrites the catalog's immutable revision. */
export const AVATAR_MANIFEST = Object.freeze({
  "procedural:v1:male:2626328580": "athletic-v2",
  "procedural:v1:male:2016838844": "athletic-v2",
} as const);

export function createPresentationAvatar(assetKey: string, team: "A" | "B") {
  const revision = AVATAR_MANIFEST[assetKey as keyof typeof AVATAR_MANIFEST];
  return revision === "athletic-v2" ? createAthleticAvatar(assetKey, team) : createAvatar(assetKey, team);
}
