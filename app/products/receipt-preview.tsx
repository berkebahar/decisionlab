"use client";
import { useState } from "react";
import TrueCostReceipt from "./true-cost-receipt";
import { demoGroups } from "./demo-products";
import type { ProductAnalysis } from "./product-model";
export default function ReceiptPreview({ product = demoGroups[0].products[0] }: { product?: ProductAnalysis }) {
  const [uses, setUses] = useState(product.uses);
  const example = { ...product, uses };
  return <div className="hero-receipt-preview"><div className="preview-control"><label htmlFor="demo-uses">Expected uses per week <output htmlFor="demo-uses">{uses}</output></label><input id="demo-uses" type="range" min="0" max="14" step="1" value={uses} onChange={event => setUses(Number(event.target.value))} /><p>{product.name}. Change usage to see the cost per use. Nothing is saved.</p></div><TrueCostReceipt analysis={example} demo compact /></div>;
}
