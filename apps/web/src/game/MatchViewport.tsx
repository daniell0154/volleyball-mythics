import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

export function MatchViewport({ children }: { children(fullscreen: ReactNode): ReactNode }) {
  const viewport = useRef<HTMLElement>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [status, setStatus] = useState("");

  useLayoutEffect(() => {
    const element = viewport.current;
    if (!element) return;
    element.focus({ preventScroll: true });
    const update = () => setFullscreen(document.fullscreenElement === element);
    document.addEventListener("fullscreenchange", update);
    return () => {
      document.removeEventListener("fullscreenchange", update);
      if (document.fullscreenElement === element) void document.exitFullscreen().catch(() => {});
    };
  }, []);

  const toggle = async () => {
    const element = viewport.current;
    if (!element) return;
    setStatus("");
    try {
      if (document.fullscreenElement === element) await document.exitFullscreen();
      else await element.requestFullscreen();
    } catch {
      setStatus("Tela cheia do navegador indisponível. Você pode continuar na quadra.");
    }
  };

  return <main ref={viewport} className="match-viewport" aria-label="Quadra e controles" tabIndex={-1}>
    {children(<>
      <button type="button" onClick={() => void toggle()}>{fullscreen ? "Sair da tela cheia" : "Tela cheia do navegador"}</button>
      <span className="fullscreen-status" role="status">{status}</span>
    </>)}
  </main>;
}
