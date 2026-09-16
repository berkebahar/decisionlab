export type ScenarioPlan = { weeklySavings: number; spending: number };
export type SavedScenario = {
  id: string;
  goalName: string;
  goalPrice: number;
  amountSaved: number;
  current: ScenarioPlan;
  alternative: ScenarioPlan;
  savedAt: string;
};

export const SCENARIOS_STORAGE_KEY = "decisionlab.scenarios.v1";
type ScenarioStorage = Pick<Storage, "getItem" | "setItem">;

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
function isPlan(value: unknown): value is ScenarioPlan {
  return isRecord(value) && isMoney(value.weeklySavings) && value.weeklySavings > 0 && isMoney(value.spending);
}
function isScenario(value: unknown): value is SavedScenario {
  return isRecord(value) && isName(value.id) && isName(value.goalName)
    && isMoney(value.goalPrice) && value.goalPrice > 0 && isMoney(value.amountSaved)
    && isPlan(value.current) && isPlan(value.alternative)
    && typeof value.savedAt === "string" && Number.isFinite(Date.parse(value.savedAt));
}

export function parseScenarios(raw: string | null): SavedScenario[] {
  if (raw === null) return [];
  const value: unknown = JSON.parse(raw);
  if (!Array.isArray(value) || !value.every(isScenario) || new Set(value.map((item) => item.id)).size !== value.length) {
    throw new Error("Saved scenarios could not be read. Existing data has been kept.");
  }
  return value;
}

export function storeScenario(storage: ScenarioStorage, scenario: SavedScenario) {
  if (!isScenario(scenario)) throw new Error("Please check the scenario details.");
  const scenarios = parseScenarios(storage.getItem(SCENARIOS_STORAGE_KEY));
  if (scenarios.some((item) => item.id === scenario.id)) throw new Error("This scenario is already saved.");
  storage.setItem(SCENARIOS_STORAGE_KEY, JSON.stringify([scenario, ...scenarios]));
}

export function deleteScenario(storage: ScenarioStorage, id: string) {
  const scenarios = parseScenarios(storage.getItem(SCENARIOS_STORAGE_KEY));
  storage.setItem(SCENARIOS_STORAGE_KEY, JSON.stringify(scenarios.filter((item) => item.id !== id)));
}
