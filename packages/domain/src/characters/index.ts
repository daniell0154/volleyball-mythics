import type { CharacterAttributes } from "@volleyball-mythics/protocol";
import { overallFromAttributes, validateCharacterAttributes } from "../config/physics.js";

export interface CharacterRevision {
  readonly id: string;
  readonly version: number;
  readonly name: string;
  readonly attributes: CharacterAttributes;
  readonly overall: number;
  readonly assetKey?: string;
  readonly abilityId?: string;
  readonly abilityConfig?: Readonly<Record<string, unknown>>;
}

function freezeRecord<T>(value: T): T {
  if (value && typeof value === "object") {
    for (const child of Object.values(value as Record<string, unknown>)) freezeRecord(child);
    Object.freeze(value);
  }
  return value;
}

export function validateCharacterRevision(character: CharacterRevision): CharacterRevision {
  if (!/^[a-z0-9][a-z0-9_-]{0,63}$/.test(character.id) || !Number.isInteger(character.version) || character.version < 1 || !character.name.trim()) {
    throw new Error("invalid character identity or version");
  }
  validateCharacterAttributes(character.attributes);
  if (character.overall !== overallFromAttributes(character.attributes)) throw new Error("character overall does not match its seven attributes");
  if (character.assetKey !== undefined && (typeof character.assetKey !== "string" || character.assetKey.length > 160)) throw new Error("invalid character asset key");
  return character;
}

/** Stores immutable, numbered revisions; replacing the enabled catalog never mutates a revision. */
export class VersionedCharacterCatalog {
  private revisions = new Map<string, Readonly<CharacterRevision>>();
  private enabledKeys: string[] = [];

  replaceEnabled(entries: readonly CharacterRevision[]): readonly Readonly<CharacterRevision>[] {
    const keys = new Set<string>();
    const next: Readonly<CharacterRevision>[] = [];
    for (const input of entries) {
      validateCharacterRevision(input);
      const key = `${input.id}:${input.version}`;
      if (keys.has(key)) throw new Error(`duplicate character revision ${key}`);
      keys.add(key);
      const normalized = Object.freeze({ ...input, attributes: Object.freeze({ ...input.attributes }), ...(input.abilityConfig ? { abilityConfig: freezeRecord(structuredClone(input.abilityConfig)) } : {}) });
      const previous = this.revisions.get(key);
      if (previous && JSON.stringify(previous) !== JSON.stringify(normalized)) throw new Error(`immutable character revision changed: ${key}`);
      this.revisions.set(key, previous ?? normalized);
      next.push(this.revisions.get(key)!);
    }
    this.enabledKeys = next.map((entry) => `${entry.id}:${entry.version}`);
    return this.enabled();
  }

  enabled(): readonly Readonly<CharacterRevision>[] {
    return this.enabledKeys.map((key) => this.revisions.get(key)!);
  }

  get(id: string, version: number): Readonly<CharacterRevision> | undefined {
    return this.revisions.get(`${id}:${version}`);
  }
}
