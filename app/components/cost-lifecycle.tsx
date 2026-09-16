"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { lifecycleStages, storyAssumptions } from "./cost-story-model";

export default function CostLifecycle() {
  const rail = useRef<HTMLOListElement>(null);
  const progress = useRef<HTMLSpanElement>(null);
  const drag = useRef<{ id: number; x: number; y: number; left: number; moved: boolean } | null>(null);
  const [active, setActive] = useState(0);
  const [announcement, setAnnouncement] = useState("");
  useEffect(() => {
    const element = rail.current;
    if (!element) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const items = [...element.children] as HTMLElement[];
      const left = element.getBoundingClientRect().left;
      const inset = parseFloat(getComputedStyle(element).paddingLeft) || 0;
      const nearest = items.reduce((best, item, index) => Math.abs(item.getBoundingClientRect().left - left - inset) < Math.abs(items[best].getBoundingClientRect().left - left - inset) ? index : best, 0);
      setActive(nearest);
      if (progress.current) progress.current.style.transform = `scaleX(${(nearest + 1) / items.length})`;
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    element.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    update();
    return () => { cancelAnimationFrame(frame); element.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule); };
  }, []);
  function go(index: number) {
    const element = rail.current;
    const target = element?.children[index] as HTMLElement | undefined;
    if (!element || !target) return;
    const inset = parseFloat(getComputedStyle(element).paddingLeft) || 0;
    element.scrollTo({ left: element.scrollLeft + target.getBoundingClientRect().left - element.getBoundingClientRect().left - inset, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
    setAnnouncement(`${index + 1} of ${lifecycleStages.length}: ${lifecycleStages[index].label}, ${lifecycleStages[index].value}. ${lifecycleStages[index].detail}`);
  }
  function start(event: PointerEvent<HTMLOListElement>) {
    if (event.pointerType !== "mouse" || event.button !== 0 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, left: event.currentTarget.scrollLeft, moved: false };
  }
  function move(event: PointerEvent<HTMLOListElement>) {
    const state = drag.current;
    if (!state || state.id !== event.pointerId) return;
    const x = event.clientX - state.x, y = event.clientY - state.y;
    if (!state.moved && Math.abs(x) > 6 && Math.abs(x) > Math.abs(y)) {
      state.moved = true; event.currentTarget.setPointerCapture(event.pointerId); event.currentTarget.dataset.dragging = "true";
    }
    if (state.moved) { event.preventDefault(); event.currentTarget.scrollLeft = state.left - x; }
  }
  function stop(event: PointerEvent<HTMLOListElement>) {
    if (drag.current?.id !== event.pointerId) return;
    drag.current = null; delete event.currentTarget.dataset.dragging;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }
  return <section className="cost-lifecycle" id="cost-explorer" aria-labelledby="cost-explorer-heading">
    <div className="lifecycle-ambient-type" data-atmosphere-reveal="typography" aria-hidden="true">
      <div className="lifecycle-type-track">
        {[0, 1].map(copy => <span key={copy}>Buy · Own · Use · Maintain · Resell ·&nbsp;</span>)}
      </div>
    </div>
    <header className="container lifecycle-heading"><div><p className="eyebrow">02 / Explore the cost</p><h2 id="cost-explorer-heading">Every purchase has<br />more than one price.</h2></div><p id="lifecycle-help">Swipe, drag, or use the arrows to explore.<br />One purchase. Five perspectives.</p></header>
    <ol ref={rail} className="lifecycle-rail" tabIndex={0} aria-label="Explore five purchase costs" aria-describedby="lifecycle-help" onPointerDown={start} onPointerMove={move} onPointerUp={stop} onPointerCancel={stop} onLostPointerCapture={stop} onPointerLeave={event => { if (!drag.current?.moved) stop(event); }} onKeyDown={event => {
      if (event.target !== event.currentTarget || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const index = event.key === "ArrowRight" ? Math.min(4, active + 1) : event.key === "ArrowLeft" ? Math.max(0, active - 1) : event.key === "Home" ? 0 : event.key === "End" ? 4 : null;
      if (index !== null) { event.preventDefault(); go(index); }
    }}>
      {lifecycleStages.map((item, index) => <li key={item.label} className={`lifecycle-spread lifecycle-${item.material}`} aria-label={`${index + 1} of 5`}>
        <span className="lifecycle-number" aria-hidden="true">0{index + 1}</span><div className="lifecycle-art" aria-hidden="true" />
        <div className="lifecycle-spread-copy"><h3>{item.label}</h3><p className="lifecycle-value">{item.value}</p><p className="lifecycle-unit">{item.unit}</p><p className="lifecycle-detail">{item.detail}</p></div>
      </li>)}
    </ol>
    <div className="container lifecycle-navigation"><div className="lifecycle-progress" aria-hidden="true"><span ref={progress} /></div><span aria-hidden="true">0{active + 1} / 05</span><div className="lifecycle-buttons"><button type="button" className="button-outline" aria-label="Previous cost perspective" aria-controls="cost-explorer" disabled={active === 0} onClick={() => go(Math.max(0, active - 1))}>←</button><button type="button" className="button-outline" aria-label="Next cost perspective" aria-controls="cost-explorer" disabled={active === 4} onClick={() => go(Math.min(4, active + 1))}>→</button></div></div>
    <p className="sr-only" role="status">{announcement}</p><p className="container lifecycle-assumptions">{storyAssumptions}</p>
  </section>;
}
