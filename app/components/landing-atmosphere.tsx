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

    // Only decorative layers move. Text and controls never wait for an observer.
    const animations = new Map<Element, Animation>();
    const seen = new WeakSet<Element>();
    const cancel = (target: Element) => { animations.get(target)?.cancel(); animations.delete(target); };
    const stopAnimations = () => { animations.forEach(animation => animation.cancel()); animations.clear(); };
    const isAmbient = (layer: Element) => layer.getAttribute("data-atmosphere-reveal") === "foliage";
    const observer = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (isAmbient(entry.target)) {
          entry.target.setAttribute("data-ambient-active", String(entry.isIntersecting));
          continue;
        }
        if (!entry.isIntersecting) { cancel(entry.target); continue; }
        if (seen.has(entry.target) || !motion.matches || document.hidden || typeof entry.target.animate !== "function") continue;
        seen.add(entry.target);
        const paper = entry.target.getAttribute("data-atmosphere-reveal") === "paper";
        const animation = entry.target.animate(paper
          ? [{ transform: "translateY(-7px)", opacity: .55 }, { transform: "translateY(0)", opacity: 1 }]
          : [{ transform: "translate(-12px, 6px) rotate(-2deg)" }, { transform: "translate(0, 0) rotate(0deg)" }],
        { duration: paper ? 700 : 4200, easing: "cubic-bezier(.2,.65,.3,1)" });
        animations.set(entry.target, animation);
        animation.onfinish = () => animations.delete(entry.target);
      }
    }, { threshold: .1 });
    const page = hero.closest(".editorial-home");
    page?.querySelectorAll("[data-atmosphere-reveal]").forEach(layer => {
      if (isAmbient(layer)) layer.setAttribute("data-ambient", "true");
      observer?.observe(layer);
    });
    const visibility = () => { page?.setAttribute("data-atmosphere-hidden", String(document.hidden)); stopAnimations(); };
    visibility();
    motion.addEventListener("change", stopAnimations);
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("beforeprint", stopAnimations);
    return () => {
      reset(); observer?.disconnect(); stopAnimations();
      hero.removeEventListener("pointermove", move); hero.removeEventListener("pointerleave", reset);
      motion.removeEventListener("change", reset); motion.removeEventListener("change", stopAnimations); pointer.removeEventListener("change", reset);
      document.removeEventListener("visibilitychange", visibility); window.removeEventListener("beforeprint", stopAnimations);
      page?.querySelectorAll("[data-ambient]").forEach(layer => { layer.removeAttribute("data-ambient"); layer.removeAttribute("data-ambient-active"); });
    };
  }, []);
  return <svg ref={art} className="hero-atmosphere" viewBox="0 0 1200 600" fill="none" aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMid slice">
    <path className="atmosphere-grid" d="M0 100H1200M0 200H1200M0 300H1200M0 400H1200M0 500H1200M100 0V600M300 0V600M500 0V600M700 0V600M900 0V600M1100 0V600" />
    <path className="atmosphere-path" d="M420 570V440Q420 400 470 400H660Q710 400 710 350V170Q710 130 760 130H1140M710 350Q710 310 760 310H990" />
    <circle cx="1140" cy="130" r="8" className="atmosphere-node" /><circle cx="990" cy="310" r="5" className="atmosphere-node" />
  </svg>;
}
