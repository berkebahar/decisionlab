"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import BrandMark from "./brand-mark";
import Icon from "./lab-icon";
import ThemeToggle from "./theme-toggle";

export const pages = [["/analyze", "Analyze"], ["/compare", "Compare"], ["/queue", "Queue"], ["/purchases", "Purchases"], ["/insights", "Insights"], ["/about", "About"]];

export default function SiteNavigation() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const drawer = useRef<HTMLDialogElement>(null);
  const links = useRef<HTMLDivElement>(null);
  const indicator = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const nav = links.current;
    const line = indicator.current;
    if (!nav || !line) return;
    const position = () => {
      const active = nav.querySelector<HTMLElement>('[aria-current="page"]');
      if (!active || !nav.offsetWidth) {
        delete line.dataset.ready;
        return;
      }
      line.style.width = `${active.offsetWidth - 24}px`;
      line.style.transform = `translateX(${active.offsetLeft + 12}px)`;
      line.dataset.ready = "true";
    };
    position();
    const resize = new ResizeObserver(position);
    resize.observe(nav);
    return () => resize.disconnect();
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const media = window.matchMedia("(min-width: 1025px)");
    const closeOnDesktop = () => { if (media.matches) { drawer.current?.close(); setOpen(false); } };
    media.addEventListener("change", closeOnDesktop);
    return () => { document.body.style.overflow = previous; media.removeEventListener("change", closeOnDesktop); };
  }, [open]);

  function close() { drawer.current?.close(); setOpen(false); }
  return <header className="site-header">
    <nav className="navigation container" aria-label="Main navigation">
      <Link className="brand" href="/" aria-label="DecisionLab home"><BrandMark /><span>Decision<span className="brand-accent">Lab</span><span className="brand-descriptor">Consider your next move.</span></span></Link>
      <div ref={links} className="nav-links site-links" id="site-links"><span ref={indicator} className="nav-active-indicator" aria-hidden="true" />{pages.map(([href, label]) => <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined}>{label}</Link>)}</div>
      <div className="nav-actions"><ThemeToggle /><button ref={toggle} className="menu-toggle icon-button" type="button" aria-label="Open navigation menu" aria-expanded={open} aria-controls="mobile-navigation" onClick={() => { drawer.current?.showModal(); setOpen(true); }}><Icon name="menu" /></button></div>
    </nav>
    <dialog ref={drawer} className="mobile-drawer" id="mobile-navigation" aria-label="Navigation menu" onCancel={() => setOpen(false)} onClose={() => { setOpen(false); toggle.current?.focus(); }} onClick={(event) => { if (event.target === event.currentTarget) close(); }}>
      <div className="drawer-content"><div className="drawer-heading"><span className="brand"><BrandMark />DecisionLab</span><button autoFocus className="icon-button" type="button" aria-label="Close navigation menu" onClick={close}><Icon name="close" /></button></div>
        <p className="eyebrow">Your decision workspace</p>
        <nav aria-label="Mobile navigation">{pages.map(([href, label], index) => <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined} onClick={close}><span className="nav-index">0{index + 1}</span>{label}<Icon name="arrow" size={18} /></Link>)}</nav>
        <div className="support-links"><Link href="/dashboard" onClick={close}>Goals & legacy decisions</Link><Link href="/goallens" onClick={close}>GoalLens</Link><Link href="/simulator" onClick={close}>Advanced Simulator</Link></div><div className="drawer-note"><Icon name="target" /><p>Small decisions.<br /><strong>More possibilities.</strong></p></div>
        <p className="drawer-credit">Created, designed, and developed by Berke Bahar.</p>
      </div>
    </dialog>
  </header>;
}
