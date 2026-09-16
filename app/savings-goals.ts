export type SavingsGoal = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  weeklyContribution: number;
  targetDate?: string;
  createdAt: string;
};

export const GOALS_STORAGE_KEY = "decisionlab.savings-goals.v1";
type GoalStorage = Pick<Storage, "getItem" | "setItem">;

export function parseLocalDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.slice(0, 4) === "0000") return null;
  const date = new Date(`${value}T12:00:00`);
  return Number.isFinite(date.getTime()) && date.getFullYear() === Number(value.slice(0, 4))
    && date.getMonth() + 1 === Number(value.slice(5, 7)) && date.getDate() === Number(value.slice(8, 10)) ? date : null;
}

function isMoney(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1_000_000_000
    && Math.abs(value * 100 - Math.round(value * 100)) <= 0.0001;
}

function isGoal(value: unknown): value is SavingsGoal {
  if (!value || typeof value !== "object") return false;
  const goal = value as Record<string, unknown>;
  return typeof goal.id === "string" && goal.id.length > 0 && goal.id.length <= 80
    && typeof goal.name === "string" && goal.name.trim().length > 0 && goal.name.length <= 80
    && isMoney(goal.targetAmount) && goal.targetAmount > 0 && isMoney(goal.currentAmount)
    && isMoney(goal.weeklyContribution)
    && (goal.targetDate === undefined || (typeof goal.targetDate === "string" && parseLocalDate(goal.targetDate) !== null))
    && typeof goal.createdAt === "string" && Number.isFinite(Date.parse(goal.createdAt));
}

export function parseGoals(raw: string | null): SavingsGoal[] {
  if (raw === null) return [];
  const goals: unknown = JSON.parse(raw);
  if (!Array.isArray(goals) || !goals.every(isGoal) || new Set(goals.map((goal) => goal.id)).size !== goals.length) {
    throw new Error("Saved goals could not be read. Existing data has been kept.");
  }
  return goals;
}

// Always read the latest list; a change in another tab must not erase unrelated goals.
export function storeGoal(storage: GoalStorage, goal: SavingsGoal, editing = false) {
  if (!isGoal(goal)) throw new Error("Please check the goal details.");
  const goals = parseGoals(storage.getItem(GOALS_STORAGE_KEY));
  const exists = goals.some((item) => item.id === goal.id);
  if (editing && !exists) throw new Error("This goal was deleted in another tab. Create a new goal to keep these values.");
  if (!editing && exists) throw new Error("This goal already exists. Please try again.");
  storage.setItem(GOALS_STORAGE_KEY, JSON.stringify(editing ? goals.map((item) => item.id === goal.id ? goal : item) : [...goals, goal]));
}

export function deleteGoal(storage: GoalStorage, id: string) {
  const goals = parseGoals(storage.getItem(GOALS_STORAGE_KEY));
  storage.setItem(GOALS_STORAGE_KEY, JSON.stringify(goals.filter((goal) => goal.id !== id)));
}

export function goalProjection(goal: SavingsGoal, now: Date) {
  const remaining = Math.max(0, Math.round(goal.targetAmount * 100) - Math.round(goal.currentAmount * 100));
  const weekly = Math.round(goal.weeklyContribution * 100);
  const weeks = remaining === 0 ? 0 : weekly === 0 ? null : Math.ceil(remaining / weekly);
  const completion = new Date(now);
  completion.setHours(12, 0, 0, 0);
  if (weeks !== null) completion.setDate(completion.getDate() + weeks * 7);
  const completionDate = weeks !== null && Number.isFinite(completion.getTime()) && completion.getFullYear() <= 9999 ? completion : null;
  const target = goal.targetDate ? parseLocalDate(goal.targetDate) : null;
  return {
    progress: Math.min(100, Math.round(goal.currentAmount / goal.targetAmount * 1000) / 10),
    weeks,
    completionDate,
    onTrack: target && completionDate ? completionDate.getTime() <= target.getTime() : null,
  };
}

export const goalDateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });
