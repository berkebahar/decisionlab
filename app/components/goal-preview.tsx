"use client";

import Link from "next/link";
import { useState } from "react";
import { calculateSavings, usd } from "../goal-lens-calculations";
import Icon from "./lab-icon";
import AnimatedNumber from "./animated-number";

export default function GoalPreview() {
  const [price, setPrice] = useState(120);
  const result = calculateSavings({ purchasePrice: price, goalPrice: 1500, amountSaved: 900, weeklySavings: 30 });
  if ("error" in result) return null;
  return <article className="goal-card preview-card" aria-labelledby="preview-heading">
    <div className="card-header"><h2 className="product-name" id="preview-heading"><span className="tool-icon"><Icon name="target" /></span>GoalLens <span className="preview-heading-note">/ a quick experiment</span></h2><span className="live-badge"><span />LIVE</span></div>
    <div className="preview-choice"><label htmlFor="preview-price">What if you spent…</label><output htmlFor="preview-price"><AnimatedNumber value={price} format="currency" /></output></div>
    <input className="preview-range" id="preview-price" type="range" min="0" max="300" step="5" value={price} aria-valuetext={usd.format(price)} onChange={(event) => setPrice(Number(event.target.value))} />
    <div className="range-labels"><span>{usd.format(0)}</span><span>Drag to see the difference</span><span>{usd.format(300)}</span></div>
    <div className="preview-goal"><span className="preview-goal-icon"><Icon name="target" /></span><div><h3>Your laptop goal</h3><p>{usd.format(900)} saved of {usd.format(1500)}</p></div><strong>60<span>%</span></strong></div>
    <div className="preview-comparison" aria-live="polite"><div><span>Save it instead</span><strong>20 <small>weeks</small></strong><div className="mini-track"><span style={{width:`${20 / result.withPurchase * 100}%`}} /></div></div><div><span>Make the purchase</span><strong><AnimatedNumber value={result.withPurchase} /> <small>weeks</small></strong><div className="mini-track warm"><span style={{width:"100%"}} /></div></div></div>
    <div className="preview-impact"><span className="impact-tag"><Icon name="clock" size={16} /><strong>+{result.extraWeeks} {result.extraWeeks === 1 ? "week" : "weeks"}</strong></span><p>Same goal. A different timeline.<br /><span>At {usd.format(30)} saved each week.</span></p></div>
    <Link className="preview-link" href="/goallens">Try it with your own numbers <Icon name="arrow" size={18} /></Link>
  </article>;
}
