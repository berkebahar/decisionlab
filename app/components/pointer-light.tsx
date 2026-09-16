"use client";

import { useEffect, useRef } from "react";

/** A single bounded light layer. No custom cursor and no continuous animation loop. */
export default function PointerLight() {
  const light = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const layer = light.current;
    if (!layer) return;
    const motion = window.matchMedia("(prefers-reduced-motion: no-preference)");
    const pointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    let frame = 0;
    const clear = () => { cancelAnimationFrame(frame); layer.dataset.visible = "false"; };
    const move = (event: PointerEvent) => {
      if (!motion.matches || !pointer.matches || event.pointerType !== "mouse") { clear(); return; }
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest(".true-receipt, input, select, textarea, dialog, [data-no-pointer-light]")) { clear(); return; }
      const surface = target?.closest<HTMLElement>("[data-pointer-light], .small-choices, .goal-card, .botanical-hero .preview-control");
      if (!surface) { clear(); return; }
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const box = surface.getBoundingClientRect();
        layer.style.left = `${box.left}px`;
        layer.style.top = `${box.top}px`;
        layer.style.width = `${box.width}px`;
        layer.style.height = `${box.height}px`;
        layer.style.borderRadius = getComputedStyle(surface).borderRadius;
        layer.style.setProperty("--light-x", `${event.clientX - box.left}px`);
        layer.style.setProperty("--light-y", `${event.clientY - box.top}px`);
        layer.dataset.visible = "true";
      });
    };
    document.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", clear);
    document.addEventListener("visibilitychange", clear);
    window.addEventListener("scroll", clear, { passive: true, capture: true });
    window.addEventListener("blur", clear);
    window.addEventListener("resize", clear);
    window.addEventListener("beforeprint", clear);
    motion.addEventListener("change", clear);
    pointer.addEventListener("change", clear);
    return () => {
      clear(); document.removeEventListener("pointermove", move); document.removeEventListener("pointerleave", clear);
      document.removeEventListener("visibilitychange", clear); window.removeEventListener("scroll", clear, true);
      window.removeEventListener("blur", clear); window.removeEventListener("resize", clear); window.removeEventListener("beforeprint", clear);
      motion.removeEventListener("change", clear); pointer.removeEventListener("change", clear);
    };
  }, []);
  return <div ref={light} className="pointer-light" aria-hidden="true" />;
}
