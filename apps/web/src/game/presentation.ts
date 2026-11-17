// Presentation-only data. These fixtures never determine a real match result.
export interface Position { readonly x: number; readonly y: number; readonly z: number }
export interface SceneSnapshot {
  readonly tick: number;
  readonly phase: string;
  readonly score: { readonly A: number; readonly B: number };
  readonly ball: Position;
  readonly athletes: readonly { readonly id: string; readonly team: "A" | "B"; readonly position: Position }[];
}
export interface SceneAdapter {
  update(snapshot: SceneSnapshot): void;
  resize(width: number, height: number): void;
  setQuality(quality: "low" | "high"): void;
  dispose(): void;
}
export type SceneFactory = (host: HTMLElement) => SceneAdapter;
export function syntheticSnapshot(seconds: number): SceneSnapshot {
  return {
    tick: Math.floor(seconds * 60), phase: "rally", score: { A: 0, B: 0 },
    ball: { x: Math.sin(seconds * 0.7) * 4.3, y: 3 + Math.abs(Math.sin(seconds * 1.3)) * 3, z: Math.sin(seconds) * 8.8 },
    athletes: [0, 1, 2, 3].map((i) => ({
      id: `fixture-${i}`, team: i < 2 ? "A" : "B",
      position: { x: (i % 2 ? 2 : -2) + Math.sin(seconds + i) * 0.5, y: 0, z: i < 2 ? -5 : 5 },
    })),
  };
}
