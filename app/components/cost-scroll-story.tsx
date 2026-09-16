"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import BotanicalShade from "./botanical-shade";
import { storyAssumptions, storyIndex, storyMoney, storyProduct, storyResult, storyStages, storyUnitCost } from "./cost-story-model";

export default function CostScrollStory() {
  // A complete statement is the server/no-script/small-screen fallback.
  const [stage, setStage] = useState(4);
  const [announcement, setAnnouncement] = useState("");
  const root = useRef<HTMLElement>(null);
  const scene = useRef<HTMLDivElement>(null);
  const outgoing = useRef<HTMLSpanElement>(null);
  const lastValue = useRef(storyStages[4].value);
  const enhanced = useRef(false);
  const select = useRef<(index: number) => void>(() => {});

  useEffect(() => {
    const element = root.current, composition = scene.current;
    if (!element || !composition) return;
    const eligible = window.matchMedia("(min-width: 1000px) and (min-height: 740px) and (prefers-reduced-motion: no-preference)");
    let frame = 0, visible = true, top = 88, span = 1;
    const size = () => {
      top = parseFloat(getComputedStyle(composition).top) || 0;
      span = Math.max(1, element.offsetHeight - composition.offsetHeight);
    };
    const measure = () => {
      frame = 0;
      if (!enhanced.current || !visible || document.hidden) return;
      const progress = Math.max(0, Math.min(1, (top - element.getBoundingClientRect().top) / span));
      // One positional read per scroll frame; size/style reads happen on resize.
      composition.style.setProperty("--story-progress", progress.toFixed(4));
      composition.style.setProperty("--stage-progress", Math.min(1, progress * 5 - storyIndex(progress)).toFixed(4));
      setStage(storyIndex(progress));
    };
    const schedule = () => { if (!frame && enhanced.current && visible && !document.hidden) frame = requestAnimationFrame(measure); };
    const configure = () => {
      enhanced.current = eligible.matches;
      element.dataset.scroll = String(eligible.matches);
      size();
      if (eligible.matches) schedule();
      else { cancelAnimationFrame(frame); frame = 0; composition.style.removeProperty("--story-progress"); composition.style.removeProperty("--stage-progress"); setStage(4); }
    };
    select.current = index => {
      if (!enhanced.current) { setStage(index); return; }
      size();
      const destination = window.scrollY + element.getBoundingClientRect().top - top + (index + .15) / storyStages.length * span;
      // Native page scrolling, no wheel/touch interception or forced smooth tour.
      window.scrollTo({ top: destination, behavior: "instant" });
      setStage(index);
    };
    const observer = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) schedule(); else { cancelAnimationFrame(frame); frame = 0; } });
    observer?.observe(element);
    const resized = () => { size(); schedule(); };
    const resizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(resized);
    resizeObserver?.observe(composition);
    configure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", resized, { passive: true });
    document.addEventListener("visibilitychange", schedule);
    eligible.addEventListener("change", configure);
    return () => {
      cancelAnimationFrame(frame); observer?.disconnect(); resizeObserver?.disconnect();
      window.removeEventListener("scroll", schedule); window.removeEventListener("resize", resized);
      document.removeEventListener("visibilitychange", schedule); eligible.removeEventListener("change", configure);
      enhanced.current = false;
    };
  }, []);

  const current = storyStages[stage];
  useEffect(() => {
    const ghost = outgoing.current;
    const previous = lastValue.current;
    lastValue.current = current.value;
    const motion = window.matchMedia("(prefers-reduced-motion: no-preference)");
    if (!ghost || previous === current.value || !enhanced.current || !motion.matches || typeof ghost.animate !== "function") return;
    ghost.textContent = previous;
    const animation = ghost.animate([
      { opacity: .28, transform: "translate(0, 0) scale(1)", filter: "blur(0px)" },
      { opacity: 0, transform: "translate(-8px, -22px) scale(.95)", filter: "blur(2px)" },
    ], { duration: 260, easing: "ease-out" });
    const stop = () => animation.cancel();
    motion.addEventListener("change", stop); window.addEventListener("beforeprint", stop);
    return () => { stop(); motion.removeEventListener("change", stop); window.removeEventListener("beforeprint", stop); };
  }, [current.value]);
  return <section ref={root} className="cost-scroll-story" id="cost-story" aria-labelledby="cost-story-heading" data-scroll="false">
    <div ref={scene} className="cost-story-scene" data-stage={stage}>
      <div className="story-foreground" aria-hidden="true"><BotanicalShade placement="hero" /></div>
      <div className="container cost-story-layout">
        <div className="cost-story-copy">
          <p className="eyebrow">01 / Follow the cost</p>
          <h2 id="cost-story-heading">Where does the<br />money actually go?</h2>
          <p>Follow one fictional camera from its price tag to the cost of owning it.</p>
          <div className="story-controls" role="group" aria-label="Choose a cost story stage">
            {storyStages.map((item, index) => <button type="button" key={item.label} aria-pressed={stage === index} onClick={() => { select.current(index); setAnnouncement(`${item.title} ${item.caption}: ${item.value}`); }}><span aria-hidden="true">0{index + 1}</span>{item.label}</button>)}
          </div>
          <p className="story-scroll-hint">Scroll to follow the story, or choose a stage.</p>
          <div className="story-caption"><h3>{current.title}</h3><p>{current.detail}</p></div>
          <div className="story-links"><Link className="text-link" href="/analyze">Analyze your own product →</Link><a href="#cost-explorer" className="text-link">Skip to the cost explorer ↓</a></div>
          <p className="sr-only" role="status">{announcement}</p>
        </div>
        <figure className="story-instrument" aria-label={`${current.caption}: ${current.value}`}>
          <div className="story-media" aria-hidden="true"><Image src="/images/decisionlab-botanical-hero.webp" alt="" fill sizes="(min-width: 1000px) 60vw, 100vw" /><div className="story-media-rules" /></div>
          <div className="story-paper" aria-hidden="true" />
          <div className="story-document" hidden={stage !== 4}>
            <p className="eyebrow">DecisionLab / Fictional camera</p><h3>True Cost Receipt</h3>
            <dl><div><dt>Sticker price</dt><dd>{storyMoney(storyProduct.price)}</dd></div><div><dt>Accessories</dt><dd>+{storyMoney(storyProduct.accessories!)}</dd></div><div><dt>Maintenance · 24 months</dt><dd>+{storyMoney(storyResult.maintenance)}</dd></div><div><dt>Subscriptions · 24 months</dt><dd>+{storyMoney(storyResult.subscriptions)}</dd></div><div><dt>Expected resale</dt><dd>−{storyMoney(storyResult.resaleDeduction)}</dd></div></dl>
          </div>
          <div className="story-figure"><span className="story-figure-label">{current.caption}</span><strong><span key={current.value} className="story-current-value">{current.value}</span><span ref={outgoing} className="story-outgoing-value" aria-hidden="true" /></strong></div>
          <div className="story-material-caption" aria-hidden="true">
            {stage === 0 ? <span>The visible price is just the beginning.</span> : <dl className="story-cost-fragments">
              <div><dt>Accessories</dt><dd>+{storyMoney(storyProduct.accessories!)}</dd></div>
              <div><dt>Maintenance</dt><dd>+{storyMoney(storyResult.maintenance)}</dd></div>
              {stage >= 2 && <div><dt>Subscriptions</dt><dd>+{storyMoney(storyResult.subscriptions)}</dd></div>}
              {stage >= 3 && <div><dt>Expected resale</dt><dd>−{storyMoney(storyResult.resaleDeduction)}</dd></div>}
            </dl>}
          </div>
          <figcaption className="story-unit-cost" hidden={stage !== 4}><strong>{storyUnitCost}</strong> / use <span>520 expected uses · 24 months</span></figcaption>
        </figure>
      </div>
      <p className="container story-assumptions">{storyAssumptions}</p>
    </div>
  </section>;
}
