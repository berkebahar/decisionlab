import Link from "next/link";
import { usd } from "../goal-lens-calculations";
import { goalDateFormat, goalProjection, parseLocalDate, type SavingsGoal } from "../savings-goals";
import PrecisionDial from "./precision-dial";
import AnimatedNumber from "./animated-number";
import GoalTimeline from "./goal-timeline";
import Icon from "./lab-icon";
import styles from "../dashboard/dashboard.module.css";

export default function GoalCard({ goal, now, onEdit, onDelete, preview = false }: { goal: SavingsGoal; now: Date; onEdit: () => void; onDelete: () => void; preview?: boolean }) {
  const projection = goalProjection(goal, now);
  const targetDate = goal.targetDate ? parseLocalDate(goal.targetDate) : null;
  const state = projection.weeks === 0 ? "complete" : projection.weeks === null ? "paused" : projection.onTrack === false ? "attention" : "active";
  return <article className={`dashboard-goal ${styles.goalCard}`} data-state={state}>
    <div className="dashboard-goal-heading"><span className="goal-symbol" aria-hidden="true"><Icon name={projection.weeks === 0 ? "check" : "target"} size={21} /></span><span className={`goal-status ${styles.goalStatus}${projection.weeks === 0 ? " is-complete" : ""}`}><span aria-hidden="true" />{projection.weeks === 0 ? "Goal reached" : projection.weeks === null ? "Paused" : projection.onTrack === false ? "Needs a little attention" : "In progress"}</span></div>
    <h3>{goal.name}</h3>
    <div className={styles.fundingRow}><div className="goal-funding"><strong><AnimatedNumber value={goal.currentAmount} format="currency" /></strong><span>of {usd.format(goal.targetAmount)}</span></div><PrecisionDial progress={projection.progress} name={goal.name} /></div>
    <div className="goal-progress-label"><span>Saved so far</span><strong>{projection.progress}%</strong></div>
    <div className="progress-track" role="progressbar" aria-label={`${goal.name} progress`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={projection.progress}><span style={{ width: `${projection.progress}%` }} /></div>
    <dl className="goal-details"><div><dt>Weekly contribution</dt><dd>{usd.format(goal.weeklyContribution)}</dd></div><div><dt>Estimated completion</dt><dd>{projection.weeks === 0 ? "Already reached" : projection.weeks === null ? "Add weekly savings" : projection.completionDate ? goalDateFormat.format(projection.completionDate) : "Beyond year 9999"}</dd></div>{targetDate && <div><dt>Target date</dt><dd>{goalDateFormat.format(targetDate)}</dd></div>}</dl>
    {targetDate && projection.weeks !== 0 && <p className={`target-note ${styles.targetNote}`}><Icon name={projection.onTrack ? "check" : "info"} size={16} />{projection.weeks === null ? "Set a weekly contribution to check your target date." : projection.onTrack ? "On track for your target date." : "Your estimate is past your target date. Try increasing your weekly contribution."}</p>}
    <p className="deposit-assumption">Estimate: one deposit at each week’s end, starting in one week.</p>
    <GoalTimeline goal={goal} projection={projection} />
    {preview ? <p className={styles.previewGoalNote}><Icon name="spark" size={15} /> Example goal · preview only</p> : <div className="goal-card-actions"><Link className={`text-link ${styles.goalToolLink}`} href={`/goallens?goal=${encodeURIComponent(goal.id)}`}>Open in GoalLens <Icon name="arrow" size={16} /></Link><div><button className="edit-button" type="button" aria-label={`Edit ${goal.name}`} onClick={onEdit}>Edit</button><button className="delete-button" type="button" aria-label={`Delete ${goal.name}`} onClick={onDelete}>Delete</button></div></div>}
  </article>;
}
