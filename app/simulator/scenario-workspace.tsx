"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import AnimatedNumber from "../components/animated-number";
import BrandMark from "../components/brand-mark";
import Icon from "../components/lab-icon";
import Skeleton from "../components/skeleton";
import { calculateSavings, MAX_AMOUNT, moneyError, usd } from "../goal-lens-calculations";
import { notifyStorageChange, STORAGE_UNAVAILABLE, useLocalStorage } from "../use-local-storage";
import { deleteScenario, parseScenarios, SCENARIOS_STORAGE_KEY, storeScenario, type SavedScenario } from "./scenario-storage";
import styles from "./simulator.module.css";

type Fields = { goalName: string; goalPrice: string; amountSaved: string; currentWeekly: string; currentSpending: string; alternativeWeekly: string; alternativeSpending: string };
type MoneyField = Exclude<keyof Fields, "goalName">;
const initial: Fields = { goalName: "Travel fund", goalPrice: "1000", amountSaved: "400", currentWeekly: "40", currentSpending: "180", alternativeWeekly: "55", alternativeSpending: "60" };
const dates = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });
const toNumber = (value: string) => value.trim() === "" ? NaN : Number(value);

function MoneyInput({ name, label, value, error, weekly, onChange }: { name: MoneyField; label: string; value: string; error?: string; weekly?: boolean; onChange: (name: MoneyField, value: string) => void }) {
  const id = `simulator-${name}`;
  return <div className={styles.field}>
    <label htmlFor={id}>{label}<span className="sr-only"> in US dollars</span></label>
    <div className={styles.moneyInput}><span aria-hidden="true">$</span><input id={id} name={name} type="number" inputMode="decimal" min={weekly || name === "goalPrice" ? "0.01" : "0"} max={MAX_AMOUNT} step="0.01" value={value} onChange={(event) => onChange(name, event.target.value)} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined} required />{weekly && <span aria-hidden="true">/ wk</span>}</div>
    {error && <p className={styles.error} id={`${id}-error`}>{error}</p>}
  </div>;
}

function ComparisonTimeline({ current, alternative }: { current: number; alternative: number }) {
  const longest = Math.max(current, alternative, 1);
  return <figure className={styles.timeline}>
    <figcaption>Two plans. The same destination.</figcaption>
    {[{ label: "Current plan", weeks: current, color: "#98c9b3" }, { label: "Your alternative", weeks: alternative, color: "#a3cfbb" }].map((plan) => <div className={styles.timelineRow} key={plan.label}>
      <div><span>{plan.label}</span><strong>{plan.weeks.toLocaleString("en-US")} {plan.weeks === 1 ? "week" : "weeks"}</strong></div>
      <svg viewBox="0 0 480 32" aria-hidden="true" preserveAspectRatio="none"><path d="M8 16H472" stroke="#31604b" strokeWidth="2" strokeDasharray="3 7" /><rect x="0" y="8" width={Math.max(4, plan.weeks / longest * 480)} height="16" rx="8" fill={plan.color} /></svg>
    </div>)}
    <div className={styles.axis}><span>Today</span><span>{longest.toLocaleString("en-US")} weeks</span></div>
  </figure>;
}

function scenarioFields(scenario: SavedScenario): Fields {
  return { goalName: scenario.goalName, goalPrice: String(scenario.goalPrice), amountSaved: String(scenario.amountSaved), currentWeekly: String(scenario.current.weeklySavings), currentSpending: String(scenario.current.spending), alternativeWeekly: String(scenario.alternative.weeklySavings), alternativeSpending: String(scenario.alternative.spending) };
}

export default function ScenarioWorkspace() {
  const [fields, setFields] = useState<Fields>(initial);
  const [message, setMessage] = useState({ text: "", success: false });
  const [saved, setSaved] = useState(false);
  const snapshot = useLocalStorage(SCENARIOS_STORAGE_KEY);
  const nameInput = useRef<HTMLInputElement>(null);
  const savedHeading = useRef<HTMLHeadingElement>(null);
  let scenarios: SavedScenario[] = [];
  let storageError = "";
  try { scenarios = parseScenarios(snapshot ?? null); }
  catch { storageError = snapshot === STORAGE_UNAVAILABLE ? "Browser storage is unavailable. You can still explore scenarios here." : "Saved scenarios could not be read. Your existing data has been kept."; }

  const errors: Partial<Record<keyof Fields, string>> = {};
  if (!fields.goalName.trim()) errors.goalName = "Give your goal a name.";
  for (const name of Object.keys(fields) as (keyof Fields)[]) {
    if (name === "goalName") continue;
    errors[name] = moneyError(toNumber(fields[name]));
    if ((name === "goalPrice" || name.endsWith("Weekly")) && toNumber(fields[name]) === 0) errors[name] = "Enter an amount greater than $0.00.";
  }
  const valid = !Object.values(errors).some(Boolean);
  const goal = { goalPrice: toNumber(fields.goalPrice), amountSaved: toNumber(fields.amountSaved) };
  const current = calculateSavings({ ...goal, purchasePrice: toNumber(fields.currentSpending), weeklySavings: toNumber(fields.currentWeekly) });
  const alternative = calculateSavings({ ...goal, purchasePrice: toNumber(fields.alternativeSpending), weeklySavings: toNumber(fields.alternativeWeekly) });
  const results = valid && !("error" in current) && !("error" in alternative) ? { current, alternative, difference: current.withPurchase - alternative.withPurchase } : null;

  function update(name: keyof Fields, value: string) {
    setFields((previous) => ({ ...previous, [name]: value }));
    setSaved(false);
    setMessage({ text: "", success: false });
  }
  function save() {
    if (!results) return;
    try {
      storeScenario(window.localStorage, {
        id: crypto.randomUUID(), goalName: fields.goalName.trim(), ...goal,
        current: { weeklySavings: toNumber(fields.currentWeekly), spending: toNumber(fields.currentSpending) },
        alternative: { weeklySavings: toNumber(fields.alternativeWeekly), spending: toNumber(fields.alternativeSpending) },
        savedAt: new Date().toISOString(),
      });
      notifyStorageChange();
      setSaved(true);
      setMessage({ text: "Scenario saved. Your two plans are ready to revisit below.", success: true });
    } catch { setMessage({ text: "We couldn’t save this scenario. Check that browser storage is available. Existing saved information has been kept.", success: false }); }
  }
  function remove(scenario: SavedScenario) {
    if (!window.confirm(`Delete the saved scenario for ${scenario.goalName}? This cannot be undone.`)) return;
    try {
      deleteScenario(window.localStorage, scenario.id);
      notifyStorageChange();
      setSaved(false);
      setMessage({ text: "Scenario deleted.", success: false });
      savedHeading.current?.focus();
    } catch { setMessage({ text: "We couldn’t delete this scenario. Please check browser storage and try again.", success: false }); }
  }
  function load(scenario: SavedScenario) {
    setFields(scenarioFields(scenario));
    setSaved(true);
    setMessage({ text: `Loaded your saved scenario for ${scenario.goalName}. Change any value to explore another plan.`, success: false });
    nameInput.current?.focus();
  }

  return <div className={styles.workspace}>
    <div className={styles.layout}>
      <form className={styles.inputs} noValidate onSubmit={(event) => { event.preventDefault(); save(); }}>
        <section className={styles.panel} aria-labelledby="scenario-goal-heading">
          <div className={styles.panelHeading}><span className={styles.icon}><Icon name="target" /></span><div><p className={styles.kicker}>01 / YOUR DESTINATION</p><h2 id="scenario-goal-heading">Start with something worth saving for.</h2></div></div>
          <div className={styles.field}><label htmlFor="scenario-goal-name">Goal name</label><input ref={nameInput} id="scenario-goal-name" value={fields.goalName} maxLength={80} onChange={(event) => update("goalName", event.target.value)} aria-invalid={!!errors.goalName} aria-describedby={errors.goalName ? "scenario-name-error" : undefined} required />{errors.goalName && <p className={styles.error} id="scenario-name-error">{errors.goalName}</p>}</div>
          <div className={styles.fieldGrid}><MoneyInput name="goalPrice" label="Target amount" value={fields.goalPrice} error={errors.goalPrice} onChange={update} /><MoneyInput name="amountSaved" label="Already saved" value={fields.amountSaved} error={errors.amountSaved} onChange={update} /></div>
        </section>
        <section className={styles.panel} aria-labelledby="scenario-plans-heading">
          <div className={styles.panelHeading}><span className={styles.icon}><Icon name="branch" /></span><div><p className={styles.kicker}>02 / EXPLORE THE PATHS</p><h2 id="scenario-plans-heading">Make room for a different outcome.</h2></div></div>
          <div className={styles.plans}>
            <fieldset><legend><span className={styles.planDot} />Current plan</legend><MoneyInput name="currentWeekly" label="Weekly savings" weekly value={fields.currentWeekly} error={errors.currentWeekly} onChange={update} /><MoneyInput name="currentSpending" label="One-time spending" value={fields.currentSpending} error={errors.currentSpending} onChange={update} /></fieldset>
            <fieldset><legend><span className={`${styles.planDot} ${styles.alternativeDot}`} />Your alternative</legend><MoneyInput name="alternativeWeekly" label="Weekly savings" weekly value={fields.alternativeWeekly} error={errors.alternativeWeekly} onChange={update} /><MoneyInput name="alternativeSpending" label="One-time spending" value={fields.alternativeSpending} error={errors.alternativeSpending} onChange={update} /></fieldset>
          </div>
          <p className={styles.note}>One-time spending comes from the same budget as your goal. Weekly savings is what you put aside each week, after regular expenses.</p>
          <div className={styles.actions}><button className="button-primary" type="submit" disabled={!results || saved || !!storageError}><Icon name={saved ? "check" : "plus"} size={18} />{saved ? "Scenario saved" : "Save scenario"}</button><button className="button-outline" type="button" onClick={() => { setFields(initial); setSaved(false); setMessage({ text: "Example values restored.", success: false }); }}>Reset example</button></div>
          <p role="status" className={`${styles.message} ${message.success ? styles.success : ""}`}>{message.success && <Icon name="check" size={18} />}{message.text}</p>
          {storageError && <p className={styles.error} role="status">{storageError}</p>}
        </section>
      </form>
      <aside className={styles.results} aria-labelledby="scenario-result-heading">
        <div className={styles.resultTop}><p className={styles.kicker}>LIVE SIMULATION</p><span className={styles.liveDot} aria-hidden="true" /></div>
        <h2 id="scenario-result-heading">A small adjustment.<br />A different arrival.</h2>
        {results ? <>
          <div className={styles.bigResult} aria-live="polite" aria-atomic="true"><AnimatedNumber value={Math.abs(results.difference)} /><span>{results.difference === 0 ? "weeks difference" : `${Math.abs(results.difference) === 1 ? "week" : "weeks"} ${results.difference > 0 ? "sooner" : "later"}`}</span></div>
          <p className={styles.resultNote}>{results.difference > 0 ? "That’s time your alternative could give back to your goal." : results.difference < 0 ? "Your alternative gives you more time before reaching this goal." : "Both plans reach your goal in the same number of whole weeks."}</p>
          <ComparisonTimeline current={results.current.withPurchase} alternative={results.alternative.withPurchase} />
          <dl className={styles.resultDetails}><div><dt>Weekly contribution change</dt><dd>{toNumber(fields.alternativeWeekly) >= toNumber(fields.currentWeekly) ? "+" : "−"}{usd.format(Math.abs(toNumber(fields.alternativeWeekly) - toNumber(fields.currentWeekly)))}</dd></div><div><dt>One-time spending change</dt><dd>{toNumber(fields.alternativeSpending) >= toNumber(fields.currentSpending) ? "+" : "−"}{usd.format(Math.abs(toNumber(fields.alternativeSpending) - toNumber(fields.currentSpending)))}</dd></div></dl>
        </> : <div className={styles.resultPlaceholder}><Icon name="info" size={30} /><p>Check the highlighted values to compare your two timelines.</p></div>}
        <details className={styles.formula}><summary>How is this calculated?<Icon name="plus" size={18} /></summary><p>For each plan: weeks = round up ((target − already saved + one-time spending) ÷ weekly savings), with a minimum of zero.</p><p>We compare those whole-week timelines. Deposits arrive at the end of each week, first in one week. Spending beyond current savings is hypothetical future spending; this does not assume borrowing or immediate affordability. Weekly contributions stay constant; interest, inflation, and changes in prices aren’t included.</p></details>
        <p className={styles.resultFootnote}>A thought experiment, not a prediction. <Link href="/about">About these estimates <span aria-hidden="true">↗</span></Link></p>
      </aside>
    </div>
    <section className={styles.savedSection} aria-labelledby="scenarios-heading">
      <div className={styles.sectionHeading}><div><p className={styles.kicker}>EXPERIMENTS WORTH KEEPING</p><h2 ref={savedHeading} id="scenarios-heading" tabIndex={-1}>Your saved scenarios <span>{scenarios.length}</span></h2></div><Link href="/insights" className="text-link">See your insights <Icon name="arrow" size={16} /></Link></div>
      {snapshot === undefined ? <Skeleton label="Loading your saved scenarios" /> : scenarios.length === 0 && !storageError ? <div className={styles.empty}><BrandMark /><h3>Your next possibility starts here.</h3><p>Change the values above, then save a scenario. Keep both plans together and revisit the choices that matter to you.</p><span>Private to this browser. No account needed.</span></div> : <div className={styles.savedGrid}>{scenarios.map((scenario) => {
        const currentResult = calculateSavings({ goalPrice: scenario.goalPrice, amountSaved: scenario.amountSaved, purchasePrice: scenario.current.spending, weeklySavings: scenario.current.weeklySavings });
        const alternativeResult = calculateSavings({ goalPrice: scenario.goalPrice, amountSaved: scenario.amountSaved, purchasePrice: scenario.alternative.spending, weeklySavings: scenario.alternative.weeklySavings });
        return <article className={styles.savedCard} key={scenario.id}><div className={styles.savedMeta}><span><Icon name="branch" size={16} /> Scenario</span><time dateTime={scenario.savedAt}>{dates.format(new Date(scenario.savedAt))}</time></div><h3>{scenario.goalName}</h3><p>{usd.format(scenario.amountSaved)} saved of {usd.format(scenario.goalPrice)}</p><div className={styles.savedComparison}><div><span>Current plan</span><strong>{"error" in currentResult ? "—" : currentResult.withPurchase.toLocaleString("en-US")} wk</strong><small>{usd.format(scenario.current.weeklySavings)}/week</small><small>{usd.format(scenario.current.spending)} spending</small></div><Icon name="arrow" size={18} /><div><span>Alternative</span><strong>{"error" in alternativeResult ? "—" : alternativeResult.withPurchase.toLocaleString("en-US")} wk</strong><small>{usd.format(scenario.alternative.weeklySavings)}/week</small><small>{usd.format(scenario.alternative.spending)} spending</small></div></div><div className={styles.savedActions}><button type="button" className="button-outline" onClick={() => load(scenario)}>Reopen scenario <Icon name="arrow" size={16} /></button><button className={styles.delete} type="button" onClick={() => remove(scenario)} aria-label={`Delete scenario for ${scenario.goalName}`}>Delete</button></div></article>;
      })}</div>}
    </section>
  </div>;
}
