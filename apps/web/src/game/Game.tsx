import { useEffect, useRef, useState } from "react";
import { View, Text } from "react-native-web";
import { syntheticSnapshot, type SceneFactory } from "./presentation.js";
import { KeyboardInput, attachKeyboard } from "../input/keyboard.js";

export function Game({ createScene }: { createScene: SceneFactory }) {
  const host = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");
  const [quality, setQuality] = useState<"low" | "high">("low");
  const [generation, setGeneration] = useState(0);
  const [inputDisplay, setInputDisplay] = useState("Clique na quadra para capturar o teclado.");
  const [inputPhase, setInputPhase] = useState<"serving" | "rally">("rally");
  const keyboard = useRef(new KeyboardInput());
  useEffect(() => host.current ? attachKeyboard(host.current, keyboard.current) : undefined, []);
  useEffect(() => {
    const timer = window.setInterval(() => {
      const input = keyboard.current.sample(inputPhase);
      setInputDisplay(`Intenção #${input.seq}: X ${input.moveX.toFixed(2)} / Z ${input.moveZ.toFixed(2)} · ${input.actions.join(", ") || "sem ação"}`);
    }, 100);
    return () => window.clearInterval(timer);
  }, [inputPhase]);
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
      <button onClick={() => { keyboard.current.clear(); setInputPhase(inputPhase === "rally" ? "serving" : "rally"); }}>Fase de entrada: {inputPhase === "rally" ? "rally" : "saque"}</button>
    </View>
    {error && <Text role="alert" style={{ color: "#ffceab" }}>{error}</Text>}
    <div ref={host} tabIndex={0} onClick={() => host.current?.focus()} aria-label="Quadra escolar 3D com bola e quatro atletas. Clique para usar o teclado." style={{ width: "100%", height: "min(72vh, 720px)", minHeight: 280 }} />
    <Text style={{ color: "#b9d9e8" }}>WASD mover · Espaço saltar · J receber · K levantar · L atacar/sacar · U especial. Intenções em demonstração; os atletas ainda seguem snapshots sintéticos.</Text>
    <Text style={{ color: "#f0f6ff" }}>{inputDisplay}</Text>
  </View>;
}
