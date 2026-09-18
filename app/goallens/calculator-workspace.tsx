"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import GoalLens from "../goal-lens";
import { GOALS_STORAGE_KEY, parseGoals } from "../savings-goals";
import { useLocalStorage } from "../use-local-storage";
import Skeleton from "../components/skeleton";
import Icon from "../components/lab-icon";

export default function CalculatorWorkspace() {
  const params = useSearchParams();
  const goalId = params.get("goal");
  const requestedMode = params.get("mode");
  const mode = requestedMode === "recurring" || requestedMode === "compare" ? requestedMode : "purchase";
  const snapshot = useLocalStorage(GOALS_STORAGE_KEY);
  let goal;
  let error = "";
  if (goalId && snapshot !== undefined) {
    try {
      goal = parseGoals(snapshot).find((item) => item.id === goalId);
      if (!goal) error = "This goal could not be found in this browser. It may have been deleted or saved on another device.";
    } catch { error = "We couldn’t open your saved goal. Your browser storage may be blocked or unreadable. Your existing data has been kept."; }
  }
  if (goalId && snapshot === undefined) return <Skeleton label="Preparing your goal" />;
  return <>
    {error ? <div className="load-notice" role="status"><p>{error} The example below is ready to explore.</p><Link className="text-link" href="/dashboard">Back to Savings Goals →</Link></div> : goal && <div className="load-notice"><p><Icon name="check" size={17} /> Exploring <strong>{goal.name}</strong>. Changes here apply to this comparison. Update your saved goal in Savings Goals.</p>{goal.weeklyContribution === 0 && <p>Add weekly savings below to calculate a timeline for this paused goal.</p>}</div>}
    <GoalLens key={`${goal?.id ?? "example"}:${mode}`} initialGoal={goal} initialMode={mode} />
  </>;
}
