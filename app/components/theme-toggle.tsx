"use client";

import { useSyncExternalStore } from "react";
import Icon from "./lab-icon";

const THEME_KEY = "decisionlab.theme.v1";
const CHANGE_EVENT = "decisionlab:theme-change";
function getSnapshot() { return document.documentElement.dataset.theme === "dark" ? "dark" : "light"; }
function serverSnapshot() { return "light"; }
function subscribe(callback: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const sync = () => {
    let saved: string | null = null;
    try { saved = window.localStorage.getItem(THEME_KEY); } catch { /* The theme works without storage. */ }
    document.documentElement.dataset.theme = saved === "dark" || saved === "light" ? saved : media.matches ? "dark" : "light";
    callback();
  };
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", sync);
  media.addEventListener("change", sync);
  return () => { window.removeEventListener(CHANGE_EVENT, callback); window.removeEventListener("storage", sync); media.removeEventListener("change", sync); };
}
export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, serverSnapshot);
  return <button className="theme-toggle icon-button" type="button" aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`} onClick={() => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { window.localStorage.setItem(THEME_KEY, next); } catch { /* Preference applies to this session. */ }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }}><Icon name={theme === "dark" ? "sun" : "moon"} /></button>;
}
