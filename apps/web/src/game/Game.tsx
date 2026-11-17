import { useEffect, useRef, useState } from "react";
import { View, Text } from "react-native-web";
import { syntheticSnapshot, type SceneFactory } from "./presentation.js";

export function Game({ createScene }: { createScene: SceneFactory }) {
  const host = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");
  const [quality, setQuality] = useState<"low" | "high">("low");
  const [generation, setGeneration] = useState(0);
  useEffect(() => {
    if (!host.current) return;
    let adapter: ReturnType<SceneFactory>;
    try { adapter = createScene(host.current); }
    catch { setError("Não foi possível iniciar WebGL. Verifique a aceleração gráfica e recarregue."); return; }
    setError("");
    adapter.setQuality(quality);
    const observer = new ResizeObserver(([entry]) => {
      if (entry) adapter.resize(entry.contentRect.width, entry.contentRect.height);
    });
    observer.observe(host.current);
    let frame = 0;
    const start = performance.now();
    const render = (now: number) => {
      adapter.update(syntheticSnapshot((now - start) / 1000));
      frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); adapter.dispose(); };
  }, [createScene, quality, generation]);
  return <View style={{ padding: 20, gap: 12 }}>
    <Text style={{ color: "#f0f6ff", fontSize: 26, fontWeight: "bold" }}>Volleyball Mythics</Text>
    <Text style={{ color: "#b9d9e8" }}>Spike 3D · rally sintético · quatro atletas temporários · sem partida online</Text>
    <View style={{ flexDirection: "row", gap: 16 }}>
      <button onClick={() => setQuality(quality === "low" ? "high" : "low")}><Text style={{ color: "#a8f5cb" }}>Qualidade: {quality === "low" ? "baixa" : "alta"}</Text></button>
      <button onClick={() => setGeneration((n) => n + 1)}><Text style={{ color: "#a8f5cb" }}>Recriar cena</Text></button>
    </View>
    {error && <Text role="alert" style={{ color: "#ffceab" }}>{error}</Text>}
    <div ref={host} aria-label="Quadra escolar 3D com bola e quatro atletas" style={{ width: "100%", height: "min(72vh, 720px)", minHeight: 280 }} />
    <Text style={{ color: "#b9d9e8" }}>WASD mover · Espaço saltar · J receber · K levantar · L atacar/sacar · U especial. Entradas em demonstração; não controlam os atletas sintéticos.</Text>
  </View>;
}
