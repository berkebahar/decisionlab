import { parseProducts, PRODUCTS_STORAGE_KEY } from "./products/product-storage.ts";
import { parseDecisions, STORAGE_KEY } from "./saved-decisions-storage.ts";
import { parseGoals, GOALS_STORAGE_KEY } from "./savings-goals.ts";
import { parseScenarios, SCENARIOS_STORAGE_KEY } from "./simulator/scenario-storage.ts";

export const MAX_BACKUP_BYTES = 1_000_000;
const keys = [GOALS_STORAGE_KEY, STORAGE_KEY, SCENARIOS_STORAGE_KEY, PRODUCTS_STORAGE_KEY] as const;
type LocalStore = Pick<Storage, "getItem" | "setItem" | "removeItem">;
export type Backup = { format: "decisionlab-backup"; version: 2; products: ReturnType<typeof parseProducts>; goals: ReturnType<typeof parseGoals>; decisions: ReturnType<typeof parseDecisions>; scenarios: ReturnType<typeof parseScenarios> };

export function parseBackup(raw: string): Backup {
  if (new TextEncoder().encode(raw).length > MAX_BACKUP_BYTES) throw new Error("Choose a backup smaller than 1 MB.");
  const data = JSON.parse(raw);
  if (!data || data.format !== "decisionlab-backup" || ![1, 2].includes(data.version)
    || ![data.goals, data.decisions, data.scenarios].every(list => Array.isArray(list) && list.length <= 1000)) {
    throw new Error("This is not a supported DecisionLab backup (maximum 1,000 records per category).");
  }
  return { format: "decisionlab-backup", version: 2, products: data.version === 1 ? [] : parseProducts(JSON.stringify({ version: 1, items: data.products })), goals: parseGoals(JSON.stringify(data.goals)), decisions: parseDecisions(JSON.stringify(data.decisions)), scenarios: parseScenarios(JSON.stringify(data.scenarios)) };
}

export function readBackup(storage: LocalStore): Backup {
  return { format: "decisionlab-backup", version: 2, products: parseProducts(storage.getItem(keys[3])), goals: parseGoals(storage.getItem(keys[0])), decisions: parseDecisions(storage.getItem(keys[1])), scenarios: parseScenarios(storage.getItem(keys[2])) };
}

export function previewImport(storage: LocalStore, incomingValue: unknown) {
  const incoming = parseBackup(JSON.stringify(incomingValue));
  const before = keys.map(key => storage.getItem(key));
  const current = readBackup({ ...storage, getItem: key => before[keys.indexOf(key as typeof keys[number])] ?? null }); // Parse one consistent preview snapshot.
  const merge = <T extends { id: string }>(existing: T[], added: T[]) => [...existing, ...added.filter(item => !existing.some(old => old.id === item.id))];
  const merged: Backup = { format: "decisionlab-backup", version: 2, products: merge(current.products, incoming.products), goals: merge(current.goals, incoming.goals), decisions: merge(current.decisions, incoming.decisions), scenarios: merge(current.scenarios, incoming.scenarios) };
  const additions = { products: merged.products.length - current.products.length, goals: merged.goals.length - current.goals.length, decisions: merged.decisions.length - current.decisions.length, scenarios: merged.scenarios.length - current.scenarios.length };
  return { merged, additions, before };
}

export function commitImport(storage: LocalStore, preview: ReturnType<typeof previewImport>) {
  // Revalidate even if called outside the preview UI.
  const data = parseBackup(JSON.stringify(preview.merged));
  if (keys.some((key, index) => storage.getItem(key) !== preview.before[index])) throw new Error("Records changed in another tab. Select the file again to review a fresh preview.");
  const values = [data.goals, data.decisions, data.scenarios, { version: 1, items: data.products }].map(list => JSON.stringify(list));
  const written: number[] = [];
  try {
    keys.forEach((key, index) => { storage.setItem(key, values[index]); written.push(index); });
  } catch {
    let rollbackFailed = false;
    for (const index of written.reverse()) {
      try { const old = preview.before[index]; if (old === null) storage.removeItem(keys[index]); else storage.setItem(keys[index], old); }
      catch { rollbackFailed = true; }
    }
    throw new Error(rollbackFailed ? "Storage became unavailable during import. Some additions may remain; existing entries were not replaced. Keep your backup and review your records." : "Import could not be saved. Previous records were restored. Check available browser storage.");
  }
}
