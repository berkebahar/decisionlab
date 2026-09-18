"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { glide } from "./cost-motion";
import BotanicalShade from "./botanical-shade";
import EditorialType from "./editorial-type";
import { storyAssumptions, storyIndex, storyMoney, storyProduct, storyResult, storyStages, storyUnitCost } from "./cost-story-model";

export default function CostScrollStory() {
  // A complete statement is the server/no-script/small-screen fallback.
  const [selection, setSelection] = useState({ stage: 4, previous: 4 });
  const { stage, previous } = selection;
  const setStage = (next: number) => setSelection(value => value.stage === next ? value : { stage: next, previous: value.stage });
  const [announcement, setAnnouncement] = useState("");
  const root = useRef<HTMLElement>(null);
  const scene = useRef<HTMLDivElement>(null);
  const number = useRef<HTMLElement>(null);
  const lastFigure = useRef<{ x: number; y: number; fontSize: number } | null>(null);
  const enhanced = useRef(false);
  const select = useRef<(index: number) => void>(() => {});

  useEffect(() => {
    const element = root.current, composition = scene.current;
    if (!element || !composition) return;
    const eligible = window.matchMedia("(min-width: 1000px) and (min-height: 740px) and (prefers-reduced-motion: no-preference)");
    let frame = 0, visible = true, top = 88, span = 1, start = 0;
    let position = 0, target = 0, velocity = 0, lastTime = 0, initialized = false;
    const size = () => {
      top = parseFloat(getComputedStyle(composition).top) || 0;
      span = Math.max(1, element.offsetHeight - composition.offsetHeight);
      start = window.scrollY + element.getBoundingClientRect().top - top;
    };
    const paint = () => {
      composition.style.setProperty("--story-progress", position.toFixed(5));
      setStage(storyIndex(position));
    };
    const animate = (time: number) => {
      frame = 0;
      if (!enhanced.current || !visible || document.hidden) return;
      const seconds = Math.min((time - (lastTime || time - 16.67)) / 1000, .05);
      lastTime = time;
      const next = glide(position, velocity, target, seconds, target >= .8 ? 7 : 9);
      position = next.position; velocity = next.velocity;
      const settled = Math.abs(target - position) < .0001 && Math.abs(velocity) < .001;
      if (settled) { position = target; velocity = 0; lastTime = 0; }
      paint();
      if (!settled) frame = requestAnimationFrame(animate);
    };
    const schedule = () => {
      if (!enhanced.current || !visible || document.hidden) return;
      // Geometry is cached on resize; scrolling only updates the desired progress.
      target = Math.max(0, Math.min(1, (window.scrollY - start) / span));
      if (!initialized) { position = target; initialized = true; paint(); }
      if (!frame) frame = requestAnimationFrame(animate);
    };
    const configure = () => {
      element.dataset.interactive = "true";
      enhanced.current = eligible.matches;
      element.dataset.scroll = String(eligible.matches);
      size();
      if (eligible.matches) schedule();
      else { cancelAnimationFrame(frame); frame = 0; composition.style.removeProperty("--story-progress"); lastTime = 0; velocity = 0; initialized = false; setStage(4); }
    };
    select.current = index => {
      if (!enhanced.current) { setStage(index); return; }
      size();
      const destination = window.scrollY + element.getBoundingClientRect().top - top + (index + .15) / storyStages.length * span;
      // Native page scrolling, no wheel/touch interception or forced smooth tour.
      window.scrollTo({ top: destination, behavior: "instant" });
      schedule();
    };
    const observer = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) schedule(); else { cancelAnimationFrame(frame); frame = 0; lastTime = 0; } });
    observer?.observe(element);
    const resized = () => { size(); schedule(); };
    const resizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(resized);
    resizeObserver?.observe(composition);
    configure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", resized, { passive: true });
    const visibility = () => {
      if (document.hidden) { cancelAnimationFrame(frame); frame = 0; lastTime = 0; }
      else schedule();
    };
    document.addEventListener("visibilitychange", visibility);
    eligible.addEventListener("change", configure);
    return () => {
      cancelAnimationFrame(frame); observer?.disconnect(); resizeObserver?.disconnect();
      window.removeEventListener("scroll", schedule); window.removeEventListener("resize", resized);
      document.removeEventListener("visibilitychange", visibility); eligible.removeEventListener("change", configure);
      enhanced.current = false;
      delete element.dataset.interactive;
    };
  }, []);

  const current = storyStages[stage];
  const prior = storyStages[previous];
  useLayoutEffect(() => {
    const figure = number.current;
    const instrument = figure?.closest(".story-instrument");
    if (!figure || !instrument || !enhanced.current) { lastFigure.current = null; return; }
    // FLIP only measures when the composition changes, never in the animation loop.
    const bounds = figure.getBoundingClientRect(), origin = instrument.getBoundingClientRect();
    const next = { x: bounds.left - origin.left, y: bounds.top - origin.top, fontSize: parseFloat(getComputedStyle(figure).fontSize) };
    const previousFigure = lastFigure.current;
    lastFigure.current = next;
    if (!previousFigure || typeof figure.animate !== "function") return;
    const animation = figure.animate([
      { transform: `translate(${previousFigure.x - next.x}px, ${previousFigure.y - next.y}px) scale(${previousFigure.fontSize / next.fontSize})` },
      { transform: "none" },
    ], { duration: stage === 4 ? 1250 : 950, easing: "cubic-bezier(.22, .68, .16, 1)" });
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const stop = () => animation.cancel();
    motion.addEventListener("change", stop); window.addEventListener("beforeprint", stop);
    return () => { stop(); motion.removeEventListener("change", stop); window.removeEventListener("beforeprint", stop); };
  }, [stage]);
  return <section ref={root} className="cost-scroll-story" id="cost-story" aria-labelledby="cost-story-heading" data-scroll="false">
    <div ref={scene} className="cost-story-scene" data-stage={stage}>
      <EditorialType words="BUY · OWN · USE · RESELL · TRUE COST" loop />
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
          <div className="story-caption" key={stage}>
            <div className="story-caption-current"><h3>{current.title}</h3><p>{current.detail}</p><p className="sr-only">{current.caption}: {current.value}</p></div>
            <div className="story-caption-outgoing" aria-hidden="true" inert><p className="story-caption-title">{prior.title}</p><p>{prior.detail}</p></div>
          </div>
          <div className="story-links"><Link className="text-link" href="/analyze">Analyze your own product →</Link><a href="#receipt-preview" className="text-link">Try the receipt ↓</a></div>
          <p className="sr-only" role="status">{announcement}</p>
        </div>
        <figure className="story-instrument" aria-hidden="true" inert>
          <div className="story-media" aria-hidden="true"><Image src="/images/decisionlab-botanical-hero.webp" alt="" fill sizes="(min-width: 1000px) 60vw, 100vw" /><div className="story-media-rules" /></div>
          <div className="story-paper" aria-hidden="true" />
          <div className="story-document" hidden={stage !== 4}>
            <p className="eyebrow">Fictional camera / 24 months</p><p className="story-document-title">One complete estimate.</p>
          </div>
          <div className="story-figure"><span key={stage} className="story-figure-label">{current.caption}</span><strong ref={number}><span key={current.value} className="story-current-value">{current.value}</span><span key={`previous-${stage}`} className="story-outgoing-value" aria-hidden="true">{prior.value !== current.value ? prior.value : ""}</span></strong></div>
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
