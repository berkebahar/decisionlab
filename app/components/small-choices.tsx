"use client";

import { useState } from "react";
import Link from "next/link";
import { usd } from "../goal-lens-calculations";
import AnimatedNumber from "./animated-number";
import Icon from "./lab-icon";

export default function SmallChoices() {
  const [weekly, setWeekly] = useState(15);
  const [weeks, setWeeks] = useState(52);
  const total = Math.round(weekly * 100) * weeks / 100;
  return <section className="small-choices container" aria-labelledby="small-choices-heading">
    <div className="experiment-copy"><p className="eyebrow">EXPERIMENT 002 / THE RIPPLE EFFECT</p><h2 id="small-choices-heading">Small choices.<br /><span>Surprisingly big outcomes.</span></h2><p>What could a small weekly habit become? Move the slider. Meet the possibility.</p><label htmlFor="habit-weekly">Set aside each week <output htmlFor="habit-weekly">{usd.format(weekly)}</output></label><input id="habit-weekly" type="range" min="0" max="50" step="1" value={weekly} aria-valuetext={usd.format(weekly)} onChange={(event) => setWeekly(Number(event.target.value))} /><div className="range-labels"><span>{usd.format(0)}</span><span>{usd.format(50)}</span></div><Link className="text-link" href="/simulator">Build your own what-if <Icon name="arrow" size={17} /></Link></div>
    <div className="experiment-result"><div className="experiment-tabs" role="group" aria-label="Savings timeframe">{[12, 26, 52].map((value) => <button type="button" key={value} aria-pressed={weeks === value} onClick={() => setWeeks(value)}>{value} weeks</button>)}</div><div className="experiment-total" aria-live="polite"><span>A little habit could become</span><strong><AnimatedNumber value={total} format="currency" /></strong><p>after {weeks} weeks. One choice at a time.</p></div><svg className="habit-chart" viewBox="0 0 400 130" role="img" aria-label={`${usd.format(weekly)} per week becomes ${usd.format(total)} after ${weeks} weeks, without interest.`}><path d="M10 20H390M10 60H390M10 100H390" className="chart-grid" />{Array.from({ length: 13 }, (_, index) => { const height = (index + 1) / 13 * 90 * weekly / 50; return <rect key={index} x={12 + index * 30} y={115 - height} width="16" height={Math.max(1, height)} rx="3" />; })}</svg><div className="chart-axis"><span>Today</span><span>Week {weeks}</span></div><p className="experiment-footnote">Weekly amount × {weeks} weeks. No interest assumed.</p></div>
  </section>;
}
