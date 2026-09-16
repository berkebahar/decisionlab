import type { SavedDecision } from "../saved-decisions-storage";
import type { SavingsGoal } from "../savings-goals";

export type ImpactLevel = "low" | "moderate" | "high";
export function impactLevel(extraWeeks: number): ImpactLevel {
  return extraWeeks <= 2 ? "low" : extraWeeks <= 8 ? "moderate" : "high";
}

export function summarizeDecisions(decisions: SavedDecision[]) {
  const modes = { purchase: { count: 0, amount: 0 }, recurring: { count: 0, amount: 0 }, compare: { count: 0, amount: 0 } };
  const impact = { low: 0, moderate: 0, high: 0 };
  let options = 0;
  for (const decision of decisions) {
    modes[decision.mode].count += 1;
    for (const purchase of decision.purchases) {
      modes[decision.mode].amount += Math.round(purchase.price * 100);
      if (decision.mode !== "recurring" || decision.calculationVersion === 2) {
        impact[impactLevel(purchase.extraWeeks)] += 1;
        options += 1;
      }
    }
  }
  for (const mode of Object.values(modes)) mode.amount /= 100;
  return { modes, impact, options };
}

export function summarizeGoals(goals: SavingsGoal[]) {
  const totals = goals.reduce((result, goal) => ({
    saved: result.saved + Math.round(goal.currentAmount * 100),
    target: result.target + Math.round(goal.targetAmount * 100),
    weekly: result.weekly + Math.round(goal.weeklyContribution * 100),
  }), { saved: 0, target: 0, weekly: 0 });
  return { saved: totals.saved / 100, target: totals.target / 100, weekly: totals.weekly / 100,
    progress: totals.target ? Math.min(100, Math.round(totals.saved / totals.target * 1000) / 10) : 0,
    completed: goals.filter((goal) => goal.currentAmount >= goal.targetAmount).length,
  };
}
