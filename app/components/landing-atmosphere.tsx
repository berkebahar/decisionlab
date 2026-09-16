"use client";

import { useEffect, useRef } from "react";

/** Decorative only: no movement is needed to understand or use the page. */
export default function LandingAtmosphere() {
  const art = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const graphic = art.current;
    const hero = graphic?.parentElement;
    if (!graphic || !hero) return;
    const motion = window.matchMedia("(prefers-reduced-motion: no-preference)");
    const pointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    let frame = 0;
    const reset = () => {
      cancelAnimationFrame(frame);
      graphic.style.transform = "translate(0, 0)";
    };
    const move = (event: PointerEvent) => {
      if (!motion.matches || !pointer.matches || event.pointerType !== "mouse") return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const box = hero.getBoundingClientRect();
        const x = (event.clientX - box.left) / box.width - .5;
        const y = (event.clientY - box.top) / box.height - .5;
        graphic.style.transform = `translate(${x * 8}px, ${y * 6}px)`;
      });
    };
    hero.addEventListener("pointermove", move, { passive: true });
    hero.addEventListener("pointerleave", reset);
    motion.addEventListener("change", reset);
    pointer.addEventListener("change", reset);

    // Content starts fully visible. These one-shot flourishes never gate access.
    const animations = new Set<Animation>();
    const observer = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer?.unobserve(entry.target);
        if (motion.matches && typeof entry.target.animate === "function") {
          const animation = entry.target.animate([{ opacity: .96 }, { opacity: 1 }], { duration: 220, easing: "ease-out" });
          animations.add(animation);
          animation.onfinish = () => animations.delete(animation);
        }
      }
    }, { threshold: .1 });
    document.querySelectorAll(".tools-section, .opportunity-section, .creator-section").forEach(section => observer?.observe(section));
    const stopAnimations = () => { if (!motion.matches) { animations.forEach(animation => animation.cancel()); animations.clear(); } };
    motion.addEventListener("change", stopAnimations);
    return () => {
      reset(); observer?.disconnect(); animations.forEach(animation => animation.cancel());
      hero.removeEventListener("pointermove", move); hero.removeEventListener("pointerleave", reset);
      motion.removeEventListener("change", reset); motion.removeEventListener("change", stopAnimations); pointer.removeEventListener("change", reset);
    };
  }, []);
  return <svg ref={art} className="hero-atmosphere" viewBox="0 0 1200 600" fill="none" aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMid slice">
    <path className="atmosphere-grid" d="M0 100H1200M0 200H1200M0 300H1200M0 400H1200M0 500H1200M100 0V600M300 0V600M500 0V600M700 0V600M900 0V600M1100 0V600" />
    <path className="atmosphere-path" d="M420 570V440Q420 400 470 400H660Q710 400 710 350V170Q710 130 760 130H1140M710 350Q710 310 760 310H990" />
    <circle cx="1140" cy="130" r="8" className="atmosphere-node" /><circle cx="990" cy="310" r="5" className="atmosphere-node" />
  </svg>;
}
