"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import BrandMark from "../components/brand-mark";
import GoalCard from "../components/goal-card";
import GoalForm from "../components/goal-form";
import Icon from "../components/lab-icon";
import Skeleton from "../components/skeleton";
import { deleteGoal, GOALS_STORAGE_KEY, parseGoals, storeGoal, type SavingsGoal } from "../savings-goals";
import { notifyStorageChange, STORAGE_UNAVAILABLE, useLocalStorage } from "../use-local-storage";
import DashboardOverview, { GoalSummary } from "./dashboard-overview";
import styles from "./dashboard.module.css";

// Examples are only rendered in memory. They never enter the storage save path.
const demoGoals: SavingsGoal[] = [
  { id: "demo-laptop", name: "Everyday laptop", targetAmount: 1400, currentAmount: 860, weeklyContribution: 35, createdAt: "2026-01-01T12:00:00.000Z" },
  { id: "demo-trip", name: "Summer with friends", targetAmount: 900, currentAmount: 320, weeklyContribution: 20, createdAt: "2026-01-01T12:00:00.000Z" },
  { id: "demo-buffer", name: "A little breathing room", targetAmount: 500, currentAmount: 200, weeklyContribution: 15, createdAt: "2026-01-01T12:00:00.000Z" },
];

export default function GoalDashboard() {
  const snapshot = useLocalStorage(GOALS_STORAGE_KEY);
  const [editor, setEditor] = useState<SavingsGoal | "new" | null>(null);
  const [message, setMessage] = useState("");
  const [messageKind, setMessageKind] = useState<"success" | "error">("success");
  const [showDemo, setShowDemo] = useState(false);
  const [now] = useState(() => new Date());
  const addButton = useRef<HTMLButtonElement>(null);
  const previewButton = useRef<HTMLButtonElement>(null);
  const exitPreviewButton = useRef<HTMLButtonElement>(null);
  const editorTrigger = useRef<HTMLButtonElement | null>(null);
  let goals: SavingsGoal[] = [];
  let error = "";
  try { goals = parseGoals(snapshot ?? null); }
  catch { error = snapshot === STORAGE_UNAVAILABLE ? "Your browser has blocked storage. Allow site storage to create and view goals." : "We couldn’t read your saved goals. Your existing data has been kept and won’t be overwritten."; }
  const isDemo = showDemo && goals.length === 0 && !error && snapshot !== undefined;
  const displayedGoals = isDemo ? demoGoals : goals;

  function createGoal(trigger: HTMLButtonElement | null) {
    editorTrigger.current = trigger;
    setEditor("new");
    setShowDemo(false);
    setMessage("");
  }

  function togglePreview(open: boolean) {
    setShowDemo(open);
    requestAnimationFrame(() => (open ? exitPreviewButton.current : previewButton.current)?.focus());
  }

  function closeEditor() {
    setEditor(null);
    requestAnimationFrame(() => (editorTrigger.current?.isConnected ? editorTrigger.current : addButton.current)?.focus());
  }

  function save(goal: SavingsGoal) {
    try {
      storeGoal(window.localStorage, goal, editor !== "new");
    } catch (error) {
      throw new Error(error instanceof Error && error.message.includes("another tab") ? error.message : "We couldn’t save this goal. Browser storage may be blocked, full, or unreadable. Your existing goals have been kept.");
    }
    notifyStorageChange();
    setMessageKind("success");
    setMessage(editor === "new" ? "Goal created. Your next chapter starts here." : "Goal updated.");
    closeEditor();
  }

  function remove(goal: SavingsGoal) {
    if (!window.confirm(`Delete “${goal.name}”? This removes the saved goal from this browser and cannot be undone. Saved GoalLens decisions will remain.`)) return;
    try {
      deleteGoal(window.localStorage, goal.id);
      notifyStorageChange();
      setMessageKind("success");
      setMessage(`${goal.name} deleted.`);
      const editingDeletedGoal = editor && editor !== "new" && editor.id === goal.id;
      if (editingDeletedGoal) setEditor(null);
      requestAnimationFrame(() => {
        if (editor && !editingDeletedGoal) document.getElementById("goal-name")?.focus();
        else addButton.current?.focus();
      });
    } catch { setMessageKind("error"); setMessage("We couldn’t delete this goal. Check your browser’s storage settings and try again."); }
  }

  return <section className="goals-section" aria-labelledby="goals-heading">
    <div className={styles.dashboardStatus}><p><span className={styles.liveDot} aria-hidden="true" />{isDemo ? "A glimpse of what’s possible" : goals.length ? `Welcome back. ${goals.length} ${goals.length === 1 ? "ambition" : "ambitions"}, one clear view.` : "Your next chapter starts with one goal."}</p><span><Icon name="grid" size={14} /> Stored in this browser</span></div>
    {isDemo && <div className={styles.demoBanner} role="status"><div><strong><Icon name="spark" size={17} /> You’re exploring a sample dashboard</strong><p>These example goals are a preview. Your personal goals and saved decisions are unchanged.</p></div><button ref={exitPreviewButton} type="button" className="button-outline" onClick={() => togglePreview(false)}>Exit preview <Icon name="close" size={16} /></button></div>}
    <GoalSummary goals={displayedGoals} loading={snapshot === undefined} unavailable={Boolean(error)} />
    {!error && displayedGoals.length > 0 && <DashboardOverview goals={displayedGoals} now={now} />}
    <div className="goals-section-header"><div className="section-intro"><p className="eyebrow">ONE STEP AT A TIME</p><h2 id="goals-heading">{isDemo ? "Example goals" : "Your goals"} <span className="goal-count">{displayedGoals.length}</span></h2></div><button ref={addButton} className="button-primary" type="button" disabled={snapshot === undefined || Boolean(error) || editor !== null} onClick={() => createGoal(addButton.current)}><Icon name="plus" size={18} /> New goal</button></div>
    <div className={error || message ? `${styles.notice} ${error || messageKind === "error" ? styles.noticeError : styles.noticeSuccess}` : undefined} role="status">{(error || message) && <><Icon name={error || messageKind === "error" ? "info" : "check"} size={19} /><p>{error || message}</p></>}</div>
    {editor && <GoalForm key={editor === "new" ? "new" : editor.id} goal={editor === "new" ? undefined : editor} onSave={save} onCancel={closeEditor} />}
    {snapshot === undefined && <Skeleton label="Loading your goals" />}
    {snapshot !== undefined && !error && goals.length === 0 && !editor && !isDemo && <div className={`empty-state ${styles.emptyState}`}>
      <div className={styles.emptyBrand}><BrandMark /></div><p className="eyebrow">GIVE YOUR NEXT IDEA A PLAN</p><h3>What are you looking forward to?</h3><p>A laptop. A trip. A little independence. Start with one goal, and see how small weekly steps add up.</p>
      <div className={styles.emptyActions}><button className="button-primary" type="button" onClick={(event) => createGoal(event.currentTarget)}>Create your first goal <Icon name="plus" size={18} /></button><button ref={previewButton} className="button-outline" type="button" onClick={() => togglePreview(true)}>Explore a sample dashboard <Icon name="arrow" size={17} /></button></div>
      <div className={styles.onboardingSteps}><span><strong>01</strong> Name your ambition</span><span><strong>02</strong> Find your weekly pace</span><span><strong>03</strong> Watch it take shape</span></div>
    </div>}
    <div className="goals-grid">{displayedGoals.map((goal) => <GoalCard key={goal.id} goal={goal} now={now} preview={isDemo} onEdit={() => { editorTrigger.current = document.activeElement as HTMLButtonElement; setEditor(goal); setMessage(""); }} onDelete={() => remove(goal)} />)}</div>
    {!error && displayedGoals.length > 0 && <p className="form-note">Estimates start today and assume weekly deposits at a steady rate, with no interest or price changes. Update your current amounts as you save.</p>}
    {!error && goals.length > 0 && <div className={styles.quickActions}><span>Make your next move with clarity.</span><Link className="text-link" href="/simulator">Test a different weekly pace <Icon name="arrow" size={16} /></Link><Link className="text-link" href="/insights">Explore your insights <Icon name="arrow" size={16} /></Link></div>}
  </section>;
}
