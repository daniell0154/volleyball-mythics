import { createAvatar } from "./avatar.js";
import { createAthleticAvatar } from "./athleticAvatar.js";
import { appearance } from "./avatarAppearance.js";
export { AVATAR_MANIFEST } from "./avatarAppearance.js";

export function createPresentationAvatar(assetKey: string, team: "A" | "B") {
  const look = appearance(assetKey);
  return look.rig === "athletic" ? createAthleticAvatar(assetKey, team, look) : createAvatar(assetKey, team, look);
}
