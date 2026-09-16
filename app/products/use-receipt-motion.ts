"use client";

import { useEffect, type RefObject } from "react";

/** Readable from the first frame; motion adds order rather than gating the data. */
export function useReceiptMotion(receipt: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const element = receipt.current;
    if (!element || typeof IntersectionObserver === "undefined") return;
    const motion = window.matchMedia("(prefers-reduced-motion: no-preference)");
    const animations = new Set<Animation>();
    const stop = () => { animations.forEach(animation => animation.cancel()); animations.clear(); };
    const onPreference = () => { if (!motion.matches) stop(); };
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      observer.disconnect();
      if (!motion.matches) return;
      const rows = [...element.querySelectorAll<HTMLElement>(".receipt-line, .receipt-results")].filter(row => row.getClientRects().length);
      rows.forEach((row, index) => {
        if (typeof row.animate !== "function") return;
        const animation = row.animate([{ opacity: .86, transform: "translateY(4px)" }, { opacity: 1, transform: "translateY(0)" }], { duration: 280, delay: Math.min(index * 22, 180), easing: "cubic-bezier(.2,.7,.2,1)" });
        animations.add(animation); animation.onfinish = () => animations.delete(animation);
      });
    }, { threshold: .08 });
    observer.observe(element);
    motion.addEventListener("change", onPreference);
    window.addEventListener("beforeprint", stop);
    document.addEventListener("visibilitychange", stop);
    return () => { observer.disconnect(); stop(); motion.removeEventListener("change", onPreference); window.removeEventListener("beforeprint", stop); document.removeEventListener("visibilitychange", stop); };
  }, [receipt]);
}
