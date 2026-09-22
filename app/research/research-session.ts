import { broadResearchCategory, isResearchAnswer, researchResponse, type ResearchAnswer, type ResearchResponse } from "./decision-research.ts";

export type ResearchPhase = "before" | "awaiting_receipt" | "after" | "submitting" | "completed" | "unavailable" | "skipped";
export type ResearchSubmission = "completed" | "unavailable";

/** One in-memory analysis, never a visitor identity or a saved product field. */
export class ResearchSession {
  readonly id: string;
  readonly category;
  private phase: ResearchPhase = "before";
  private before: ResearchAnswer | null = null;
  private listeners = new Set<() => void>();
  private seen = new Set<"before" | "after">();

  constructor(category: unknown, randomUUID: () => string = () => crypto.randomUUID()) {
    this.id = randomUUID();
    this.category = broadResearchCategory(category);
  }
  getSnapshot = () => this.phase;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };
  private move(phase: ResearchPhase) {
    this.phase = phase;
    this.listeners.forEach(listener => listener());
  }
  promptSeen(stage: "before" | "after") {
    if (this.phase !== stage || this.seen.has(stage)) return false;
    this.seen.add(stage);
    return true;
  }
  completeBefore(answer: ResearchAnswer) {
    if (this.phase !== "before" || !isResearchAnswer(answer)) return false;
    this.before = { intent: answer.intent, confidence: answer.confidence };
    this.move("awaiting_receipt");
    return true;
  }
  receiptSeen() {
    if (this.phase === "awaiting_receipt") this.move("after");
  }
  skip() {
    if (!["before", "awaiting_receipt", "after"].includes(this.phase)) return false;
    this.before = null;
    this.move("skipped");
    return true;
  }
  async completeAfter(answer: ResearchAnswer, submit: (response: ResearchResponse) => Promise<ResearchSubmission>) {
    if (this.phase !== "after" || !this.before || !isResearchAnswer(answer)) return false;
    const response = researchResponse(this.id, this.category, this.before, answer);
    // Claim synchronously, before any promise or React update can yield.
    this.move("submitting");
    this.before = null;
    try { this.move(await submit(response)); }
    catch { this.move("unavailable"); }
    return this.getSnapshot() === "completed";
  }
}
