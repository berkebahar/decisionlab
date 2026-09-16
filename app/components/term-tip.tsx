"use client";

import { useEffect, useId, useRef, useState } from "react";
import Icon from "./lab-icon";

export default function TermTip({ term, children }: { term: string; children: React.ReactNode }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const wrapper = useRef<HTMLSpanElement>(null);
  const tooltip = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!open) return;
    const place = () => {
      const trigger = wrapper.current?.getBoundingClientRect();
      const tip = tooltip.current;
      if (!trigger || !tip) return;
      const width = Math.min(280, document.documentElement.clientWidth - 32);
      tip.style.width = `${width}px`;
      tip.style.left = `${Math.max(16, Math.min(trigger.left, document.documentElement.clientWidth - width - 16))}px`;
      tip.style.top = `${Math.max(16, trigger.top - tip.offsetHeight - 8 >= 16 ? trigger.top - tip.offsetHeight - 8 : Math.min(trigger.bottom + 8, window.innerHeight - tip.offsetHeight - 16))}px`;
    };
    const outside = (event: PointerEvent) => { if (event.target instanceof Node && !wrapper.current?.contains(event.target)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, { passive: true, capture: true });
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => { window.removeEventListener("resize", place); window.removeEventListener("scroll", place, true); document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); };
  }, [open]);
  return <span ref={wrapper} className="term-tip" onMouseLeave={() => { if (!wrapper.current?.contains(document.activeElement)) setOpen(false); }}>
    <button className="term-trigger" type="button" aria-label={`Explain ${term}`} aria-expanded={open} aria-controls={id} aria-describedby={open ? id : undefined} onMouseEnter={() => setOpen(true)} onFocus={() => setOpen(true)} onBlur={() => setOpen(false)} onClick={() => setOpen(true)} onKeyDown={(event) => { if (event.key === "Escape") { event.stopPropagation(); setOpen(false); } }}>{term} <Icon name="info" size={15} /></button>
    <span ref={tooltip} className="term-content" id={id} role="tooltip" hidden={!open}>{children}</span>
  </span>;
}
