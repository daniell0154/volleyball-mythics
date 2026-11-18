export const SKIN_TONES = {
  peach: "#f1c7a5",
  warm: "#d8a07b",
  bronze: "#ab714e",
  deep: "#704931",
} as const;

export const HAIR_STYLES = {
  short: { shape: 0, long: false },
  swept: { shape: 1, long: false },
  back: { shape: 2, long: false },
  "short-long": { shape: 0, long: true },
  "swept-long": { shape: 1, long: true },
  "back-long": { shape: 2, long: true },
  bald: { shape: 0, long: false },
  curly: { shape: 0, long: false },
} as const;

/** Presentation revision only. The catalog retains its original key. */
export const AVATAR_MANIFEST = Object.freeze({
  "procedural:v1:male:2626328580": "athletic-v2",
  "procedural:v1:male:2016838844": "athletic-v2",
} as const);

type Rig = "classic" | "athletic";
type Gender = "male" | "female";
type Skin = keyof typeof SKIN_TONES;
type Hair = keyof typeof HAIR_STYLES;
type LookSelection = { rig: Rig; gender: Gender; skinId: Skin; hairId: Hair };
const skins = Object.keys(SKIN_TONES) as Skin[];
const shortHair = ["short", "swept", "back"] as const;
const longHair = ["short-long", "swept-long", "back-long"] as const;
const legacy = /^procedural:(v1|athletic-v2):(male|female):([0-9]{1,10})$/;
const custom = /^procedural:visual-v3:(classic|athletic):(male|female):([0-9]{1,10}):([a-z]+):([a-z-]+)$/;

export function parseAppearance(assetKey: string) {
  const current = custom.exec(assetKey);
  const previous = current ? null : legacy.exec(assetKey);
  const match = current ?? previous;
  if (!match || match[0] !== assetKey || Number(match[3]) > 4294967295) return null;
  if (current && (!Object.hasOwn(SKIN_TONES, current[4]!) || !Object.hasOwn(HAIR_STYLES, current[5]!))) return null;

  const seed = Number(match[3]);
  let state = seed;
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
  const pick = <T,>(values: readonly T[]) => values[Math.floor(random() * values.length)]!;
  const generatedSkin = pick(skins);
  const hair = pick(["#261b16", "#543628", "#b48a4b", "#171923"]);
  const accent = pick(["#fbd24c", "#74e6cd", "#ef96c3", "#d6e3fb"]);
  const height = .95 + random() * .1;
  const gender = match[2] as Gender;
  const generatedHair = pick<Hair>(gender === "female" ? longHair : shortHair);
  const skinId = current ? current[4] as Skin : generatedSkin;
  const hairId = current ? current[5] as Hair : generatedHair;
  const rig: Rig = current ? current[1] as Rig
    : previous?.[1] === "athletic-v2" || Object.hasOwn(AVATAR_MANIFEST, assetKey) ? "athletic" : "classic";
  return { seed, rig, gender, skinId, hairId, skin: SKIN_TONES[skinId], hair, accent, height,
    hairStyle: HAIR_STYLES[hairId].shape, longHair: HAIR_STYLES[hairId].long };
}

export function appearance(assetKey: string) {
  const look = parseAppearance(assetKey);
  if (!look) throw new Error("Unknown avatar asset");
  return look;
}

export function visualKey({ rig, gender, seed, skinId, hairId }: LookSelection & { seed: number }) {
  return `procedural:visual-v3:${rig}:${gender}:${seed}:${skinId}:${hairId}`;
}

export function editAppearance(assetKey: string, selection: Partial<LookSelection>) {
  const look = appearance(assetKey);
  const { rig, gender, skinId, hairId } = { ...look, ...selection };
  if (rig === look.rig && gender === look.gender && skinId === look.skinId && hairId === look.hairId) return assetKey;
  return visualKey({ rig, gender, skinId, hairId, seed: look.seed });
}
