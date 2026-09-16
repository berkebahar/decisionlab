import { usd } from "../goal-lens-calculations";
import { goalProjection, type SavingsGoal } from "../savings-goals";
import styles from "../dashboard/dashboard.module.css";

export default function GoalTimeline({ goal, projection }: { goal: SavingsGoal; projection: ReturnType<typeof goalProjection> }) {
  const { weeks, progress } = projection;
  const startY = 78 - progress * 0.6;
  const endY = weeks === null ? startY : 18;
  const halfwayWeeks = weeks === null ? 0 : Math.ceil(weeks / 2);
  const halfwayAmount = Math.min(goal.targetAmount, (Math.round(goal.currentAmount * 100) + halfwayWeeks * Math.round(goal.weeklyContribution * 100)) / 100);
  const midpointX = weeks ? 12 + (halfwayWeeks / weeks) * 296 : 160;
  const midpointY = weeks === null ? startY : 78 - (halfwayAmount / goal.targetAmount) * 60;
  const points = `12,${startY} ${midpointX},${midpointY} 308,${endY}`;
  return <figure className={`goal-timeline ${styles.timeline}`}>
    <figcaption>YOUR SAVINGS TIMELINE <span>{weeks === 0 ? "Goal reached" : weeks === null ? "Paused" : `${weeks.toLocaleString("en-US")} ${weeks === 1 ? "week" : "weeks"} to go`}</span></figcaption>
    <svg viewBox="0 0 320 92" role="img" aria-label={weeks === 0 ? `${goal.name}: target reached.` : weeks === null ? `${goal.name}: savings remain at ${usd.format(goal.currentAmount)} with no weekly contribution.` : `${goal.name}: projected savings rise from ${usd.format(goal.currentAmount)} today to ${usd.format(goal.targetAmount)} in ${weeks} weeks.`}>
      <path d="M12 18H308M12 48H308M12 78H308M86 10V86M160 10V86M234 10V86" className={styles.chartGrid} strokeDasharray="3 5" />
      <polygon points={`12,86 ${points} 308,86`} className={styles.chartArea} />
      <polyline points={points} fill="none" className={styles.chartLine} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy={startY} r="4" className={styles.chartPoint} /><circle cx={midpointX} cy={midpointY} r="3" className={styles.chartMidpoint} /><circle cx="308" cy={endY} r="5" className={styles.chartPoint} />
    </svg>
    <div className="timeline-labels"><span>Now<strong>{usd.format(goal.currentAmount)}</strong></span><span>{weeks === null ? "Add a weekly contribution" : weeks === 0 ? "Complete" : "Estimated finish"}<strong>{usd.format(weeks === null ? goal.currentAmount : goal.targetAmount)}</strong></span></div>
  </figure>;
}
