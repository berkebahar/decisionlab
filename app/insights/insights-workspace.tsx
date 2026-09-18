"use client";

import Link from "next/link";
import AnimatedNumber from "../components/animated-number";
import BrandMark from "../components/brand-mark";
import Icon from "../components/lab-icon";
import Skeleton from "../components/skeleton";
import { usd } from "../goal-lens-calculations";
import { parseDecisions, STORAGE_KEY } from "../saved-decisions-storage";
import { GOALS_STORAGE_KEY, parseGoals } from "../savings-goals";
import { parseScenarios, SCENARIOS_STORAGE_KEY } from "../simulator/scenario-storage";
import { STORAGE_UNAVAILABLE, useLocalStorage } from "../use-local-storage";
import { impactLevel, summarizeDecisions, summarizeGoals } from "./insight-calculations";
import styles from "./insights.module.css";

const modeInfo = {
  purchase: { title: "One purchase", color: "var(--blue)", icon: "wallet" as const },
  recurring: { title: "Recurring costs", color: "var(--success)", icon: "clock" as const },
  compare: { title: "Compare two", color: "var(--warning)", icon: "branch" as const },
};
const modeKeys = ["purchase", "recurring", "compare"] as const;
const dates = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });

function readSnapshot<T>(snapshot: string | null | undefined, parse: (raw: string | null) => T[], name: string): { items: T[]; error: string } {
  try { return { items: parse(snapshot ?? null), error: "" }; }
  catch { return { items: [], error: snapshot === STORAGE_UNAVAILABLE ? `Your browser has blocked access to ${name}.` : `Your ${name} could not be read. Existing data has been kept.` }; }
}

function DecisionMix({ summary }: { summary: ReturnType<typeof summarizeDecisions> }) {
  const total = Object.values(summary.modes).reduce((sum, mode) => sum + mode.count, 0);
  const circumference = 2 * Math.PI * 52;
  const segments = modeKeys.map((mode, index) => {
    const length = total ? summary.modes[mode].count / total * circumference : 0;
    const preceding = modeKeys.slice(0, index).reduce((sum, key) => sum + summary.modes[key].count, 0);
    const offset = total ? preceding / total * circumference : 0;
    return { mode, length, offset };
  });
  return <div className={styles.mix}>
    <svg className={styles.donut} viewBox="0 0 144 144" role="img" aria-label={`Saved decision mix: ${modeKeys.map((mode) => `${summary.modes[mode].count} ${modeInfo[mode].title}`).join(", ")}.`}>
      <circle cx="72" cy="72" r="52" fill="none" stroke="var(--border)" strokeWidth="12" />
      {segments.filter((segment) => segment.length > 0).map(({ mode, length, offset }) => <circle key={mode} cx="72" cy="72" r="52" fill="none" stroke={modeInfo[mode].color} strokeWidth="12" strokeDasharray={`${length} ${circumference - length}`} strokeDashoffset={-offset} transform="rotate(-90 72 72)" />)}
      <text x="72" y="59" textAnchor="middle" dominantBaseline="middle" fill="var(--foreground)" fontSize="30" fontWeight="600">{total}</text><text textAnchor="middle" fill="var(--muted)" fontSize="14"><tspan x="72" y="84">SAVED</tspan><tspan x="72" y="100">CHOICES</tspan></text>
    </svg>
    <ul className={styles.legend}>{modeKeys.map((mode) => <li key={mode}><span className={styles.legendDot} style={{ background: modeInfo[mode].color }} /><span>{modeInfo[mode].title}</span><strong>{summary.modes[mode].count}</strong></li>)}</ul>
  </div>;
}

export default function InsightsWorkspace() {
  const goalSnapshot = useLocalStorage(GOALS_STORAGE_KEY);
  const decisionSnapshot = useLocalStorage(STORAGE_KEY);
  const scenarioSnapshot = useLocalStorage(SCENARIOS_STORAGE_KEY);
  const { items: goals, error: goalError } = readSnapshot(goalSnapshot, parseGoals, "goals");
  const { items: decisions, error: decisionError } = readSnapshot(decisionSnapshot, parseDecisions, "saved decisions");
  const { items: scenarios, error: scenarioError } = readSnapshot(scenarioSnapshot, parseScenarios, "saved scenarios");
  const errors = [goalError, decisionError, scenarioError].filter(Boolean);
  const goalSummary = summarizeGoals(goals);
  const summary = summarizeDecisions(decisions);
  const recorded = decisions.filter(d => d.journal && d.journal.outcome !== "undecided").length;
  const recent = [...decisions].sort((a, b) => Date.parse(b.savedAt) - Date.parse(a.savedAt)).slice(0, 4);
  const loading = goalSnapshot === undefined || decisionSnapshot === undefined || scenarioSnapshot === undefined;
  const empty = !goals.length && !decisions.length && !scenarios.length;

  if (loading) return <div className={styles.workspace}><Skeleton label="Preparing supporting insights" /></div>;

  return <div className={styles.workspace}>
    {errors.length > 0 && <div className={styles.error} role="status">{errors.map((error) => <p key={error}>{error}</p>)}<p>Available information is shown below.</p></div>}
    {empty && !errors.length ? <section className={styles.empty} aria-labelledby="insights-empty-heading"><BrandMark /><p className={styles.kicker}>YOUR PERSONAL OBSERVATORY</p><h2 id="insights-empty-heading">A little curiosity.<br />A lot of perspective.</h2><p>Your insights start with a goal or a saved decision. Set a destination, explore a choice, and watch the bigger picture take shape.</p><div><Link href="/dashboard" className="button-primary">Create your first goal <Icon name="arrow" size={18} /></Link><Link href="/goallens" className="button-outline">Open GoalLens</Link></div><span>Saved on this device. Only visible in this browser.</span><div className={styles.emptyGrid} aria-hidden="true"><span /><span /><span /><span /><span /><span /></div></section> : <>
      <section className={styles.metrics} aria-label="Your insight summary">
        <article><span className={styles.metricIcon}><Icon name="target" /></span><p>Total saved toward goals</p><strong><AnimatedNumber value={goalSummary.saved} format="currency" /></strong><span>{goals.length ? `${goalSummary.progress}% of ${usd.format(goalSummary.target)} combined target` : "Add a goal to start tracking progress"}</span></article>
        <article><span className={styles.metricIcon}><Icon name="branch" /></span><p>Choices explored</p><strong><AnimatedNumber value={decisions.length + scenarios.length} /></strong><span>{decisions.length} {decisions.length === 1 ? "decision" : "decisions"} · {scenarios.length} {scenarios.length === 1 ? "scenario" : "scenarios"}</span></article>
        <article><span className={styles.metricIcon}><Icon name="chart" /></span><p>Combined weekly savings</p><strong><AnimatedNumber value={goalSummary.weekly} format="currency" /></strong><span>Planned across {goals.length} {goals.length === 1 ? "goal" : "goals"}</span></article>
      </section>
      <p className={styles.note}>{recorded} recorded choices · {decisions.length - recorded} undecided or hypothetical comparisons. Outcomes are self-reported, not verified transactions. Exploring or skipping a purchase does not prove that money was saved.</p>
      <div className={styles.topGrid}>
        <section className={styles.progressPanel} data-pointer-light aria-labelledby="portfolio-heading"><div className={styles.panelTop}><p className={styles.kicker}>THE BIGGER PICTURE</p><Icon name="target" size={24} /></div><h2 id="portfolio-heading">Your future is taking shape.</h2><p>Every contribution moves something forward.</p><div className={styles.progressAmount}><AnimatedNumber value={goalSummary.progress} suffix="%" /><span>of your combined<br />goal targets funded</span></div><div className={styles.progressTrack} role="progressbar" aria-label="Combined goal progress" aria-valuenow={goalSummary.progress} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${goalSummary.progress}%` }} /></div><div className={styles.progressLegend}><span>{usd.format(goalSummary.saved)} saved</span><span>{usd.format(Math.max(0, goalSummary.target - goalSummary.saved))} to go</span></div><div className={styles.progressFooter}><span><Icon name="check" size={16} />{goalSummary.completed} {goalSummary.completed === 1 ? "goal" : "goals"} reached</span><Link href="/dashboard">Savings Goals <Icon name="arrow" size={16} /></Link></div></section>
        <section className={styles.panel} aria-labelledby="decision-mix-heading"><p className={styles.kicker}>YOUR EXPLORATION MIX</p><h2 id="decision-mix-heading">More ways to think it through.</h2><DecisionMix summary={summary} /><p className={styles.note}>{decisions.length ? "Each saved GoalLens snapshot counts once. Savings Simulator scenarios are counted separately above." : "Save a GoalLens comparison to see your decision mix here."}</p></section>
      </div>
      <div className={styles.twoColumns}>
        <section className={styles.panel} aria-labelledby="spending-heading"><div className={styles.panelTop}><p className={styles.kicker}>SPENDING YOU’VE EXPLORED</p><Icon name="wallet" size={22} /></div><h2 id="spending-heading">Give the numbers some context.</h2><p className={styles.description}>Hypothetical costs in your saved comparisons.</p><div className={styles.spendingRows}>{modeKeys.map((mode) => <div key={mode}><span className={styles.rowIcon} style={{ color: modeInfo[mode].color }}><Icon name={modeInfo[mode].icon} size={19} /></span><div><h3>{modeInfo[mode].title}</h3><p>{mode === "recurring" ? "Annualized costs across snapshots" : mode === "compare" ? "Both alternatives in each snapshot" : "One-time costs across snapshots"}</p></div><strong>{usd.format(summary.modes[mode].amount)}{mode === "recurring" && <small>/ year</small>}</strong></div>)}</div><p className={styles.note}>These are explored options, not actual purchases. Repeated snapshots can include the same choice. Annual and one-time costs are kept separate; alternatives are not a spending total.</p></section>
        <section className={styles.panel} aria-labelledby="impact-heading"><div className={styles.panelTop}><p className={styles.kicker}>TIME IS PART OF THE PRICE</p><Icon name="clock" size={22} /></div><h2 id="impact-heading">How much does a choice shift?</h2><p className={styles.description}>Separate modeled delays; never a combined delay. Legacy recurring equivalents are excluded.</p><div className={styles.impactRows}>{(["low", "moderate", "high"] as const).map((level) => <div key={level} className={styles[level]}><div><span>{level[0].toUpperCase() + level.slice(1)} impact <small>{level === "low" ? "0–2 weeks" : level === "moderate" ? "3–8 weeks" : "9+ weeks"}</small></span><strong>{summary.impact[level]} {summary.impact[level] === 1 ? "option" : "options"}</strong></div><div className={styles.impactTrack}><span style={{ width: `${summary.options ? summary.impact[level] / summary.options * 100 : 0}%` }} /></div></div>)}</div><details className={styles.term}><summary>What does “opportunity cost” mean?<Icon name="plus" size={16} /></summary><p>It’s the next-best use of the same money or time. Here we show one part of that trade-off: how many extra weeks a purchase could add to your savings goal. These labels describe time, not whether a choice is good or bad.</p></details></section>
      </div>
      <section className={styles.activity} aria-labelledby="insights-activity-heading"><div className={styles.sectionHeading}><div><p className={styles.kicker}>THE THINKING BEHIND THE NUMBERS</p><h2 id="insights-activity-heading">Recent decision activity</h2></div><Link href="/dashboard#saved-decisions" className="text-link">Saved GoalLens comparisons <Icon name="arrow" size={16} /></Link></div>{recent.length ? <div className={styles.activityList}>{recent.map((decision) => <article key={decision.id}><span className={styles.activityIcon}><Icon name={modeInfo[decision.mode].icon} size={21} /></span><div className={styles.activityDetail}><p>{modeInfo[decision.mode].title}<span>·</span><time dateTime={decision.savedAt}>{dates.format(new Date(decision.savedAt))}</time></p><h3>{decision.goalName}</h3><p>{decision.journal && decision.journal.outcome !== "undecided" ? `Recorded: ${decision.journal.outcome}` : "Hypothetical · undecided"}</p><ul>{decision.purchases.map((purchase, index) => <li key={index}><span>{purchase.name} <span className={styles.activityPrice}>· {usd.format(purchase.price)}{decision.mode === "recurring" ? "/year" : ""}</span></span><span className={`${styles.impactBadge} ${styles[impactLevel(purchase.extraWeeks)]}`}>{decision.mode === "recurring" && decision.calculationVersion !== 2 ? "Legacy equivalent" : `+${purchase.extraWeeks.toLocaleString("en-US")} weeks`}</span></li>)}</ul></div></article>)}</div> : <div className={styles.smallEmpty}><BrandMark /><div><h3>Make your next choice a little clearer.</h3><p>Your saved GoalLens comparisons will appear here.</p></div><Link href="/goallens" className="button-outline">Open GoalLens <Icon name="arrow" size={16} /></Link></div>}</section>
      {scenarios.length > 0 && <aside className={styles.scenarioCallout}><span className={styles.rowIcon}><Icon name="branch" size={24} /></span><div><h3>{scenarios.length} saved {scenarios.length === 1 ? "scenario" : "scenarios"}. More than one way forward.</h3><p>Revisit your contribution and spending experiments in Savings Simulator.</p></div><Link className="button-outline" href="/simulator#scenarios-heading">Your scenarios <Icon name="arrow" size={16} /></Link></aside>}
      <p className={styles.privacy}><Icon name="info" size={16} />These insights use only the goals, decisions, and scenarios saved in this browser. They are educational estimates, not financial advice.</p>
    </>}
  </div>;
}
