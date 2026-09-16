"use client";
import { useState } from "react";
import TrueCostReceipt from "./true-cost-receipt";
import { demoGroups } from "./demo-products";
export default function ReceiptPreview() {
  const [uses, setUses] = useState(5);
  const example = { ...demoGroups[0].products[0], uses };
  return <div className="hero-receipt-preview"><div className="preview-control"><label htmlFor="demo-uses">Fictional laptop: expected uses per week <output htmlFor="demo-uses">{uses}</output></label><input id="demo-uses" type="range" min="0" max="14" step="1" value={uses} onChange={event => setUses(Number(event.target.value))} /><p>Adjust usage to see its effect. Example assumptions, not market data.</p></div><TrueCostReceipt analysis={example} demo compact /></div>;
}
