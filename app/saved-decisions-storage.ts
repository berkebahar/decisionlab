export type DecisionMode = "purchase" | "recurring" | "compare";
export type DecisionJournal = { outcome: "bought" | "skipped" | "postponed" | "undecided"; reason: string; reflection: string };
export type SavedDecision = {
  journal?: DecisionJournal;
  calculationVersion?: 2;
  id: string;
  mode: DecisionMode;
  goalName: string;
  goalPrice: number;
  amountSaved: number;
  weeklySavings: number;
  purchases: { name: string; price: number; extraWeeks: number }[];
  savedAt: string;
};

export const STORAGE_KEY = "decisionlab.saved-decisions.v1";
type DecisionStorage = Pick<Storage, "getItem" | "setItem">;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isName(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= 80;
}

function isMoney(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1_000_000_000
    && Math.abs(value * 100 - Math.round(value * 100)) <= 0.0001;
}

function isDecision(value: unknown): value is SavedDecision {
  if (!isRecord(value)) return false;
  return isName(value.id) && typeof value.mode === "string" && ["purchase", "recurring", "compare"].includes(value.mode)
    && isName(value.goalName) && isMoney(value.goalPrice) && isMoney(value.amountSaved)
    && isMoney(value.weeklySavings) && value.weeklySavings > 0
    && (value.calculationVersion === undefined || value.calculationVersion === 2)
    && (value.journal === undefined || isJournal(value.journal))
    && typeof value.savedAt === "string" && Number.isFinite(Date.parse(value.savedAt))
    && Array.isArray(value.purchases) && value.purchases.length === (value.mode === "compare" ? 2 : 1)
    && value.purchases.every((purchase: unknown) => isRecord(purchase)
      && isName(purchase.name) && isMoney(purchase.price)
      && typeof purchase.extraWeeks === "number" && Number.isSafeInteger(purchase.extraWeeks) && purchase.extraWeeks >= 0);
}

export function parseDecisions(raw: string | null): SavedDecision[] {
  if (raw === null) return [];
  const value: unknown = JSON.parse(raw);
  if (!Array.isArray(value) || !value.every(isDecision) || new Set(value.map(item => item.id)).size !== value.length) {
    throw new Error("Saved data is not a valid DecisionLab comparison list.");
  }
  return value;
}

// Read before each write so saving from another tab does not use an old UI snapshot.
export function storeDecision(storage: DecisionStorage, decision: SavedDecision) {
  if (!isDecision(decision)) throw new Error("The comparison is incomplete.");
  const decisions = parseDecisions(storage.getItem(STORAGE_KEY));
  if (decisions.some(item => item.id === decision.id)) throw new Error("This comparison is already saved.");
  storage.setItem(STORAGE_KEY, JSON.stringify([decision, ...decisions]));
}

export function deleteDecision(storage: DecisionStorage, id: string) {
  const decisions = parseDecisions(storage.getItem(STORAGE_KEY));
  storage.setItem(STORAGE_KEY, JSON.stringify(decisions.filter((decision) => decision.id !== id)));
}

function isJournal(value: unknown): value is DecisionJournal {
  return isRecord(value) && typeof value.outcome === "string" && ["bought", "skipped", "postponed", "undecided"].includes(value.outcome)
    && typeof value.reason === "string" && value.reason.length <= 500
    && typeof value.reflection === "string" && value.reflection.length <= 1000;
}

export function updateJournal(storage: DecisionStorage, id: string, journal: DecisionJournal) {
  if (!isJournal(journal)) throw new Error("Please check your journal fields.");
  const decisions = parseDecisions(storage.getItem(STORAGE_KEY));
  if (!decisions.some(item => item.id === id)) throw new Error("This comparison was deleted. Refresh your journal.");
  storage.setItem(STORAGE_KEY, JSON.stringify(decisions.map(item => item.id === id ? { ...item, journal } : item)));
}
