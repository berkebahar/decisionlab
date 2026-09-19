import type { ProductRecord } from "./product-model.ts";
import type { CloudCommand, ProductRepository } from "./cloud-repository.ts";

type Snapshot = { records: ProductRecord[]; loading: boolean; saving: boolean; error: string };
const initial: Snapshot = { records: [], loading: true, saving: false, error: "" };
export class CloudProductStore {
  private snapshot = initial;
  private listeners = new Set<() => void>();
  private generation = 0;
  private active = false;
  private request = 0;
  private repository: ProductRepository;
  constructor(repository: ProductRepository) { this.repository = repository; }
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  getSnapshot = () => this.snapshot;
  getServerSnapshot = () => initial;
  private publish(next: Partial<Snapshot>) {
    this.snapshot = { ...this.snapshot, ...next };
    this.listeners.forEach(listener => listener());
  }
  start() { this.active = true; void this.refresh(); }
  stop() { this.active = false; this.generation++; this.request++; }
  refresh = async () => {
    if (!this.active || this.snapshot.saving) return;
    const generation = this.generation, request = ++this.request;
    // Keep existing records and mounted editors during refresh or an outage.
    try {
      const records = await this.repository.load();
      if (this.active && generation === this.generation && request === this.request) this.publish({ records, loading: false, error: "" });
    } catch (error) {
      if (this.active && generation === this.generation && request === this.request) this.publish({ loading: false, error: error instanceof Error ? error.message : "Cloud records could not load. Refresh to retry." });
    }
  };
  mutate = async (command: CloudCommand) => {
    if (!this.active || this.snapshot.loading || this.snapshot.error) throw new Error(this.snapshot.error || "Wait for your cloud records to load before saving.");
    if (this.snapshot.saving) throw new Error("A save is already in progress. Please wait.");
    const generation = this.generation;
    this.request++; // An older refresh must not replace a successful write.
    this.publish({ saving: true });
    try {
      const record = await this.repository.mutate(command);
      if (!this.active || generation !== this.generation) throw new Error("Account changed. Check the original account before retrying.");
      const remaining = this.snapshot.records.filter(item => item.id !== command.id);
      const records = record ? [record, ...remaining].sort((a, b) => b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id)) : remaining;
      this.publish({ records, saving: false });
      return record;
    } catch (error) {
      if (this.active && generation === this.generation) this.publish({ saving: false, error: error instanceof Error ? error.message : "Cloud saving failed. Refresh to check before retrying." });
      throw error;
    }
  };
}
