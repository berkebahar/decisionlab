"use client";

import { useId, useRef, useState, type ReactNode } from "react";

/** An inline explanation works with touch and keyboard, without covering another row. */
export default function ReceiptLine({ label, children, help, subtotal = false, offset = false }: {
  label: string; children: ReactNode; help?: string; subtotal?: boolean; offset?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const id = useId(), trigger = useRef<HTMLButtonElement>(null);
  return <div className={`receipt-line${subtotal ? " receipt-subtotal" : ""}${offset ? " receipt-offset" : ""}`}>
    <dt>{help ? <>
      <button ref={trigger} className="receipt-line-trigger" type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen(value => !value)} onKeyDown={event => { if (event.key === "Escape" && open) { event.preventDefault(); setOpen(false); } }}>
        <span>{label}</span><span className="receipt-line-help-icon" aria-hidden="true">?</span>
      </button>
      {/* The same assumptions remain in the printed formula section. */}
      <span className="receipt-print-label">{label}</span>
      <span id={id} className="receipt-line-explanation" hidden={!open} data-print-omit>{help}</span>
    </> : label}</dt>
    <dd>{children}</dd>
  </div>;
}
