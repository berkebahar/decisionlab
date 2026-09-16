"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

/** Original CSS rain: deterministic positions, no video or third-party assets. */
export default function BotanicalRain() {
  const [paused, setPaused] = useState(false);
  const rain = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const page = rain.current?.closest(".editorial-home");
    page?.setAttribute("data-atmosphere-paused", String(paused));
    return () => { page?.removeAttribute("data-atmosphere-paused"); };
  }, [paused]);
  useEffect(() => {
    const layer = rain.current;
    if (!layer) return;
    let inView = true;
    const update = () => { layer.dataset.active = String(inView && !document.hidden); };
    const observer = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      update();
    });
    observer?.observe(layer);
    document.addEventListener("visibilitychange", update);
    update();
    return () => { observer?.disconnect(); document.removeEventListener("visibilitychange", update); };
  }, []);

  return <>
    <div ref={rain} className="botanical-rain" aria-hidden="true" data-paused={paused}>
      {Array.from({ length: 32 }, (_, i) => <span key={i} style={{
        left: `${(i * 37 + 11) % 100}%`,
        "--rain-duration": `${1.7 + (i % 7) * .21}s`,
        "--rain-delay": `${-((i * 13) % 29) / 10}s`,
        "--rain-opacity": .14 + (i % 4) * .07,
        "--rain-length": `${22 + (i % 5) * 8}px`,
      } as CSSProperties} />)}
    </div>
    <button type="button" className="rain-toggle" aria-pressed={paused} onClick={() => setPaused(value => !value)}>
      {paused ? "Resume atmosphere" : "Pause atmosphere"}
    </button>
  </>;
}
