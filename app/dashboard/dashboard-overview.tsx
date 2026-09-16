import AnimatedNumber from "../components/animated-number";
import Icon from "../components/lab-icon";
import { usd } from "../goal-lens-calculations";
import { goalDateFormat, goalProjection, type SavingsGoal } from "../savings-goals";
import styles from "./dashboard.module.css";

export const ALLOCATION_COLORS = ["var(--blue)", "var(--allocation-cyan, #3c745b)", "var(--allocation-warm, #b06d2c)", "var(--allocation-violet, #79ba9d)"];

export function GoalSummary({ goals, loading, unavailable }: { goals: SavingsGoal[]; loading: boolean; unavailable: boolean }) {
  const totals = goals.reduce((sum, goal) => ({ saved: sum.saved + Math.round(goal.currentAmount * 100), target: sum.target + Math.round(goal.targetAmount * 100), weekly: sum.weekly + Math.round(goal.weeklyContribution * 100) }), { saved: 0, target: 0, weekly: 0 });
  const progress = totals.target ? Math.min(100, Math.round(totals.saved / totals.target * 100)) : 0;
  const active = goals.filter((goal) => goal.currentAmount < goal.targetAmount).length;
  const summaries = [
    { label: "Total saved", value: totals.saved, note: goals.length ? `${progress}% of your combined target` : "Your first deposit starts the story", icon: "wallet" as const },
    { label: "Total target amount", value: totals.target, note: `${active} ${active === 1 ? "goal" : "goals"} still in progress`, icon: "target" as const },
    { label: "Combined weekly savings", value: totals.weekly, note: "Your planned weekly contributions", icon: "chart" as const },
  ];

  return <div className={`summary-grid ${styles.summaryGrid}`}>
    {summaries.map((summary, index) => <div className={`summary-card ${styles.summaryCard}`} key={summary.label}>
      <div className={styles.summaryTop}><span>{summary.label}</span><Icon name={summary.icon} size={19} /></div>
      <strong>{loading || unavailable ? "—" : <AnimatedNumber value={summary.value / 100} format="currency" />}</strong>
      <p>{summary.note}</p>
      <div className={styles.summaryVisual} aria-hidden="true">
        {index === 0 ? <div className={styles.summaryProgress}><span style={{ width: `${progress}%` }} /></div>
          : index === 1 ? <div className={styles.goalDots}>{Array.from({ length: Math.min(goals.length, 14) }, (_, i) => <span key={i} data-filled={goals[i].currentAmount >= goals[i].targetAmount} />)}</div>
          : <div className={styles.summaryAllocation}>{goals.filter((goal) => goal.weeklyContribution > 0).map((goal, i) => <span key={goal.id} style={{ flexGrow: goal.weeklyContribution, background: ALLOCATION_COLORS[i % ALLOCATION_COLORS.length] }} />)}</div>}
      </div>
    </div>)}
  </div>;
}

export default function DashboardOverview({ goals, now }: { goals: SavingsGoal[]; now: Date }) {
  const weeklyTotal = goals.reduce((sum, goal) => sum + Math.round(goal.weeklyContribution * 100), 0);
  const contributing = goals.filter((goal) => goal.weeklyContribution > 0);
  const milestones = goals.map((goal) => {
    const percent = [25, 50, 75, 100].find((value) => goal.currentAmount / goal.targetAmount * 100 < value);
    if (!percent || goal.weeklyContribution === 0) return null;
    const amount = Math.ceil(Math.round(goal.targetAmount * 100) * percent / 100);
    const weeks = Math.ceil((amount - Math.round(goal.currentAmount * 100)) / Math.round(goal.weeklyContribution * 100));
    const milestone = goalProjection({ ...goal, targetAmount: amount / 100 }, now);
    return { goal, percent, weeks, date: milestone.completionDate };
  }).filter((value) => value !== null).sort((a, b) => a.weeks - b.weeks).slice(0, 3);

  return <div className={styles.overviewGrid}>
    <section className={styles.overviewPanel} aria-labelledby="weekly-allocation-heading">
      <div className={styles.panelHeading}><div><p className="eyebrow">A PLAN FOR EVERY DOLLAR</p><h2 id="weekly-allocation-heading">Your weekly allocation</h2></div><span className={styles.panelIcon}><Icon name="chart" size={20} /></span></div>
      <div className={styles.allocationTotal}><strong><AnimatedNumber value={weeklyTotal / 100} format="currency" /></strong><span>planned per week</span></div>
      {weeklyTotal > 0 ? <>
        <div className={styles.allocationBar} role="img" aria-label={`Weekly savings allocation: ${contributing.map((goal) => `${goal.name} ${usd.format(goal.weeklyContribution)}`).join(", ")}`}>
          {contributing.map((goal, index) => <span key={goal.id} style={{ flexGrow: Math.round(goal.weeklyContribution * 100), background: ALLOCATION_COLORS[index % ALLOCATION_COLORS.length] }} />)}
        </div>
        <ul className={styles.allocationLegend}>{contributing.map((goal, index) => <li key={goal.id}><span className={styles.legendDot} style={{ background: ALLOCATION_COLORS[index % ALLOCATION_COLORS.length] }} aria-hidden="true" /><span>{goal.name}</span><strong>{usd.format(goal.weeklyContribution)}</strong><span className={styles.allocationPercent}>{Math.round(Math.round(goal.weeklyContribution * 100) / weeklyTotal * 100)}%</span></li>)}</ul>
        <p className={styles.panelNote}>Assign each dollar to one goal only. These separate planned allocations are not additional income. Update balances as deposits happen.</p>
      </> : <p className={styles.panelNote}>Add a weekly contribution to a goal and see your savings plan take shape here.</p>}
    </section>
    <section className={styles.overviewPanel} aria-labelledby="milestones-heading">
      <div className={styles.panelHeading}><div><p className="eyebrow">THE NEXT LITTLE WINS</p><h2 id="milestones-heading">Coming into view</h2></div><span className={styles.panelIcon}><Icon name="clock" size={20} /></span></div>
      {milestones.length ? <ol className={styles.milestoneList}>{milestones.map((milestone) => <li key={milestone.goal.id}>
        <span className={styles.milestoneMarker} aria-hidden="true"><Icon name={milestone.percent === 100 ? "check" : "target"} size={16} /></span>
        <div><p>{milestone.goal.name}</p><strong>{milestone.percent === 100 ? "Goal fully funded" : `${milestone.percent}% of the way there`}</strong><span>{milestone.date ? goalDateFormat.format(milestone.date) : "Beyond year 9999"} · in {milestone.weeks.toLocaleString("en-US")} {milestone.weeks === 1 ? "week" : "weeks"}</span></div>
      </li>)}</ol> : <div className={styles.milestoneEmpty}><Icon name="target" size={28} /><p>{goals.every((goal) => goal.currentAmount >= goal.targetAmount) ? "Every goal is fully funded. Make room for your next ambition." : "Set a weekly contribution to reveal your next savings milestones."}</p></div>}
      <p className={styles.panelNote}>Estimated end-of-week deposits, first in one week. Dates shift with your actual deposit schedule.</p>
    </section>
  </div>;
}
