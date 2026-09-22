export const researchIntents = ["yes", "maybe", "no"] as const;
export type ResearchIntent = typeof researchIntents[number];
export const researchCategories = ["technology", "clothing", "home", "transport", "hobby", "sports", "education", "travel gear", "custom"] as const;
export type ResearchCategory = typeof researchCategories[number];
export type ResearchAnswer = { intent: ResearchIntent; confidence: number };
export type ResearchResponse = {
  session_analysis_id: string;
  category: ResearchCategory | null;
  before_intent: ResearchIntent;
  after_intent: ResearchIntent;
  before_confidence: number;
  after_confidence: number;
  intention_changed: boolean;
  confidence_change: number;
};
export type ResearchRow = ResearchResponse & { id: string; created_at: string };

export function broadResearchCategory(value: unknown): ResearchCategory | null {
  return researchCategories.includes(value as ResearchCategory) ? value as ResearchCategory : null;
}

export function isResearchAnswer(value: unknown): value is ResearchAnswer {
  if (!value || typeof value !== "object") return false;
  const answer = value as ResearchAnswer;
  return researchIntents.includes(answer.intent) && Number.isInteger(answer.confidence)
    && answer.confidence >= 1 && answer.confidence <= 5;
}

export function researchResponse(id: string, category: unknown, before: ResearchAnswer, after: ResearchAnswer): ResearchResponse {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
    || !isResearchAnswer(before) || !isResearchAnswer(after)) throw new Error("Incomplete research response.");
  // Explicit allowlist: never spread an analysis, record, or caller-supplied object.
  return {
    session_analysis_id: id, category: broadResearchCategory(category),
    before_intent: before.intent, after_intent: after.intent,
    before_confidence: before.confidence, after_confidence: after.confidence,
    intention_changed: before.intent !== after.intent,
    confidence_change: after.confidence - before.confidence,
  };
}
