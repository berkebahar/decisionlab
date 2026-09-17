"use client";

import { useEffect, useRef, useState } from "react";
import { glide, nearestStop, releaseTarget } from "./cost-motion";
import { lifecycleStages, storyAssumptions } from "./cost-story-model";

export default function CostLifecycle() {
  const rail = useRef<HTMLOListElement>(null);
  const progress = useRef<HTMLSpanElement>(null);
  const select = useRef<(index: number) => void>(() => {});
  const [active, setActive] = useState(0);
  const [announcement, setAnnouncement] = useState("");
  useEffect(() => {
    const element = rail.current;
    if (!element) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0, idle = 0, previousTime = 0;
    let position = element.scrollLeft, target = position, velocity = 0, written = -1;
    let stops: number[] = [], maximum = 0, touching = false;
    let drag: { id: number; x: number; y: number; left: number; moved: boolean; lastX: number; time: number; speed: number } | null = null;
    const clamp = (value: number) => Math.max(0, Math.min(maximum, value));
    const paint = () => {
      setActive(nearestStop(position, stops));
      // Follow the actual visual position, including between stages.
      const end = stops[stops.length - 1] || 1;
      if (progress.current) progress.current.style.transform = `scaleX(${.2 + .8 * Math.min(1, position / end)})`;
    };
    const cancel = () => { cancelAnimationFrame(frame); frame = 0; previousTime = 0; clearTimeout(idle); };
    const tick = (time: number) => {
      const seconds = Math.min((time - (previousTime || time - 16.67)) / 1000, .05);
      previousTime = time;
      const next = glide(position, velocity, target, seconds, drag?.moved ? 19 : 7);
      position = clamp(next.position); velocity = next.velocity;
      const settled = Math.abs(target - position) < .35 && Math.abs(velocity) < 3;
      if (settled) { position = target; velocity = 0; }
      written = position;
      element.scrollLeft = position;
      paint();
      if (!settled) frame = requestAnimationFrame(tick);
      else { frame = 0; previousTime = 0; }
    };
    const schedule = () => {
      if (!frame && !reduced.matches && !document.hidden) frame = requestAnimationFrame(tick);
    };
    const settle = () => {
      if (drag || touching || reduced.matches) return;
      target = stops[nearestStop(target, stops)] ?? 0;
      schedule();
    };
    const measure = () => {
      cancel();
      const items = [...element.children] as HTMLElement[];
      maximum = Math.max(0, element.scrollWidth - element.clientWidth);
      const first = items[0]?.offsetLeft ?? 0;
      stops = items.map(item => clamp(item.offsetLeft - first));
      position = target = element.scrollLeft; velocity = 0; written = -1;
      paint();
    };
    const scroll = () => {
      const actual = element.scrollLeft;
      if (Math.abs(actual - written) < 1) return;
      // Native touch/scrollbar scrolling retains the platform's own inertia.
      cancel(); position = target = actual; velocity = 0; paint();
      if (!touching && !reduced.matches) idle = window.setTimeout(settle, 200);
    };
    const wheel = (event: WheelEvent) => {
      if (reduced.matches || event.ctrlKey || Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
      const delta = event.deltaX * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? element.clientWidth : 1);
      if ((target <= 0 && delta < 0) || (target >= maximum && delta > 0)) return;
      event.preventDefault(); clearTimeout(idle);
      target = clamp(target + delta); schedule();
      idle = window.setTimeout(settle, 200);
    };
    const start = (event: PointerEvent) => {
      if (reduced.matches) return;
      if (event.pointerType !== "mouse") { touching = true; cancel(); position = target = element.scrollLeft; velocity = 0; return; }
      if (event.button !== 0) return;
      cancel(); position = target = element.scrollLeft; velocity = 0;
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY, left: position, moved: false, lastX: event.clientX, time: event.timeStamp, speed: 0 };
    };
    const move = (event: PointerEvent) => {
      if (!drag || drag.id !== event.pointerId) return;
      const x = event.clientX - drag.x, y = event.clientY - drag.y;
      if (!drag.moved && Math.abs(y) > 6 && Math.abs(y) >= Math.abs(x)) { drag = null; return; }
      if (!drag.moved && Math.abs(x) > 6 && Math.abs(x) > Math.abs(y)) {
        drag.moved = true; element.setPointerCapture(event.pointerId); element.dataset.dragging = "true";
      }
      if (!drag.moved) return;
      event.preventDefault();
      const elapsed = Math.max(1, event.timeStamp - drag.time);
      const speed = (drag.lastX - event.clientX) / elapsed * 1000;
      drag.speed = elapsed > 100 ? speed : drag.speed * .45 + speed * .55;
      drag.lastX = event.clientX; drag.time = event.timeStamp;
      target = clamp(drag.left - x); schedule();
    };
    const stop = (event: PointerEvent) => {
      // Touch pointers are cancelled when native panning starts, before the finger lifts.
      if (event.pointerType === "touch") return;
      if (event.pointerType !== "mouse") { touching = false; clearTimeout(idle); idle = window.setTimeout(settle, 200); return; }
      if (!drag || drag.id !== event.pointerId) return;
      const state = drag; drag = null; delete element.dataset.dragging;
      if (element.hasPointerCapture(event.pointerId)) element.releasePointerCapture(event.pointerId);
      if (!state.moved) return;
      target = releaseTarget(target, event.type === "pointerup" ? state.speed : 0, event.timeStamp - state.time, stops);
      schedule();
    };
    const touchEnd = (event: TouchEvent) => {
      touching = event.touches.length > 0;
      clearTimeout(idle);
      if (!touching) idle = window.setTimeout(settle, 200);
    };
    const leave = (event: PointerEvent) => { if (!drag?.moved) stop(event); };
    const configure = () => {
      drag = null; touching = false; delete element.dataset.dragging;
      element.dataset.motion = String(!reduced.matches);
      measure();
    };
    const suspend = () => {
      cancel(); drag = null; touching = false; delete element.dataset.dragging;
      position = target = element.scrollLeft; velocity = 0;
    };
    const visibility = () => { if (document.hidden) suspend(); };
    select.current = index => {
      clearTimeout(idle); target = stops[index] ?? 0;
      if (reduced.matches) { position = target; element.scrollLeft = target; paint(); }
      else schedule();
    };
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(element);
    const observer = new IntersectionObserver(([entry]) => { if (!entry.isIntersecting) suspend(); });
    observer.observe(element);
    configure();
    element.addEventListener("scroll", scroll, { passive: true });
    element.addEventListener("wheel", wheel, { passive: false });
    element.addEventListener("pointerdown", start);
    element.addEventListener("pointermove", move);
    element.addEventListener("pointerup", stop);
    element.addEventListener("pointercancel", stop);
    element.addEventListener("lostpointercapture", stop);
    element.addEventListener("pointerleave", leave);
    element.addEventListener("touchend", touchEnd, { passive: true });
    element.addEventListener("touchcancel", touchEnd, { passive: true });
    window.addEventListener("resize", measure, { passive: true });
    window.addEventListener("blur", suspend);
    window.addEventListener("beforeprint", suspend);
    document.addEventListener("visibilitychange", visibility);
    reduced.addEventListener("change", configure);
    return () => {
      suspend(); resizeObserver.disconnect(); observer.disconnect();
      delete element.dataset.motion;
      element.removeEventListener("scroll", scroll); element.removeEventListener("wheel", wheel);
      element.removeEventListener("pointerdown", start); element.removeEventListener("pointermove", move);
      element.removeEventListener("pointerup", stop); element.removeEventListener("pointercancel", stop);
      element.removeEventListener("lostpointercapture", stop); element.removeEventListener("pointerleave", leave);
      element.removeEventListener("touchend", touchEnd); element.removeEventListener("touchcancel", touchEnd);
      window.removeEventListener("resize", measure); window.removeEventListener("blur", suspend);
      window.removeEventListener("beforeprint", suspend); document.removeEventListener("visibilitychange", visibility);
      reduced.removeEventListener("change", configure);
    };
  }, []);
  function go(index: number) {
    select.current(index);
    setAnnouncement(`${index + 1} of ${lifecycleStages.length}: ${lifecycleStages[index].label}, ${lifecycleStages[index].value}. ${lifecycleStages[index].detail}`);
  }
  return <section className="cost-lifecycle" id="cost-explorer" aria-labelledby="cost-explorer-heading">
    <div className="lifecycle-ambient-type" aria-hidden="true">
      <div className="lifecycle-type-track">
        <span>Buy · Own · Use · Maintain · Resell</span>
      </div>
    </div>
    <header className="container lifecycle-heading"><div><p className="eyebrow">02 / Explore the cost</p><h2 id="cost-explorer-heading">Every purchase has<br />more than one price.</h2></div><p id="lifecycle-help">Swipe, drag, or use the arrows to explore.<br />One purchase. Five perspectives.</p></header>
    <ol ref={rail} className="lifecycle-rail" tabIndex={0} aria-label="Explore five purchase costs" aria-describedby="lifecycle-help" onKeyDown={event => {
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
