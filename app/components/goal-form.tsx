"use client";

import { useState, type FormEvent } from "react";
import { MAX_AMOUNT, moneyError } from "../goal-lens-calculations";
import { parseLocalDate, type SavingsGoal } from "../savings-goals";
import Icon from "./lab-icon";
import styles from "../dashboard/dashboard.module.css";

const moneyFields = [
  { name: "targetAmount", label: "Target amount", help: "The full amount you’re aiming for." },
  { name: "currentAmount", label: "Current amount", help: "What you’ve already put aside." },
  { name: "weeklyContribution", label: "Weekly contribution", help: "Your planned savings each week. $0 pauses the estimate." },
] as const;

export default function GoalForm({ goal, onSave, onCancel }: { goal?: SavingsGoal; onSave: (goal: SavingsGoal) => void; onCancel: () => void }) {
  const [fields, setFields] = useState({ name: goal?.name ?? "", targetAmount: goal ? String(goal.targetAmount) : "", currentAmount: String(goal?.currentAmount ?? 0), weeklyContribution: String(goal?.weeklyContribution ?? 0), targetDate: goal?.targetDate ?? "" });
  const [error, setError] = useState("");
  const [invalidField, setInvalidField] = useState<keyof typeof fields | null>(null);

  function fail(message: string, name: keyof typeof fields) {
    setError(message);
    setInvalidField(name);
    requestAnimationFrame(() => document.getElementById(name === "targetDate" ? "goal-date" : `goal-${name}`)?.focus());
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!fields.name.trim()) { fail("Give your goal a name.", "name"); return; }
    for (const field of moneyFields) {
      const error = fields[field.name].trim() ? moneyError(Number(fields[field.name])) : "Enter an amount.";
      if (error) { fail(`${field.label}: ${error}`, field.name); return; }
    }
    if (Number(fields.targetAmount) <= 0) { fail("Your target amount must be greater than zero.", "targetAmount"); return; }
    if (fields.targetDate && !parseLocalDate(fields.targetDate)) { fail("Choose a valid target date.", "targetDate"); return; }
    try {
      onSave({ id: goal?.id ?? crypto.randomUUID(), name: fields.name.trim(), targetAmount: Number(fields.targetAmount), currentAmount: Number(fields.currentAmount), weeklyContribution: Number(fields.weeklyContribution), ...(fields.targetDate ? { targetDate: fields.targetDate } : {}), createdAt: goal?.createdAt ?? new Date().toISOString() });
    } catch (error) {
      setInvalidField(null);
      setError(error instanceof Error ? error.message : "We couldn’t save your goal. Please try again.");
    }
  }

  function update(name: keyof typeof fields, value: string) {
    setFields((current) => ({ ...current, [name]: value }));
    setError("");
    setInvalidField(null);
  }

  return <form className={`goal-form content-panel ${styles.goalForm}`} onSubmit={submit} aria-labelledby="goal-form-heading" aria-describedby={error ? "goal-form-error" : "goal-form-hint"}>
    <div className={styles.formHeading}><div className="section-intro"><p className="eyebrow">MAKE ROOM FOR WHAT MATTERS</p><h2 id="goal-form-heading">{goal ? "Edit your goal" : "A new goal starts here."}</h2><p id="goal-form-hint">All amounts are in USD. Start with what you have; you can update it anytime.</p></div><span className={styles.panelIcon}><Icon name="target" size={24} /></span></div>
    <div className="goal-form-fields">
      <label htmlFor="goal-name">Goal name<span className={styles.inputWrap}><span className={styles.inputPrefix} aria-hidden="true"><Icon name="target" size={18} /></span><input autoFocus id="goal-name" maxLength={80} required placeholder="e.g. A laptop for everyday work" value={fields.name} aria-invalid={invalidField === "name" || undefined} aria-describedby={invalidField === "name" ? "goal-form-error" : undefined} onChange={(event) => update("name", event.target.value)} /></span></label>
      {moneyFields.map(({ name, label, help }) => <label key={name} htmlFor={`goal-${name}`}><span id={`goal-${name}-label`}>{label} (USD)</span><span className={styles.inputWrap}><span className={styles.inputPrefix} aria-hidden="true">$</span><input id={`goal-${name}`} type="number" inputMode="decimal" min={name === "targetAmount" ? 0.01 : 0} max={MAX_AMOUNT} step="0.01" required value={fields[name]} aria-labelledby={`goal-${name}-label`} aria-invalid={invalidField === name || undefined} aria-describedby={`goal-${name}-hint${invalidField === name ? " goal-form-error" : ""}`} onChange={(event) => update(name, event.target.value)} /></span><span className={styles.fieldHelp} id={`goal-${name}-hint`}>{help}</span></label>)}
      <label htmlFor="goal-date"><span id="goal-date-label">Target date <span className="optional-label">(optional)</span></span><input id="goal-date" type="date" min="0001-01-01" max="9999-12-31" value={fields.targetDate} aria-labelledby="goal-date-label" aria-invalid={invalidField === "targetDate" || undefined} aria-describedby={`goal-date-hint${invalidField === "targetDate" ? " goal-form-error" : ""}`} onChange={(event) => update("targetDate", event.target.value)} /><span className={styles.fieldHelp} id="goal-date-hint">Add a date to see whether your weekly pace is on track.</span></label>
    </div>
    <p className="form-note">Assign each dollar to only one goal; combined totals assume separate allocations. A weekly contribution of $0 pauses your estimate. Progress changes when you update your current amount.</p>
    {error && <p className="form-error" id="goal-form-error" role="alert">{error}</p>}
    <div className="goal-actions"><button className="button-primary" type="submit"><Icon name="check" size={18} />{goal ? "Save changes" : "Create goal"}</button><button className="button-outline" type="button" onClick={onCancel}>Cancel</button></div>
  </form>;
}
