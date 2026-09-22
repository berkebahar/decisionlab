import { researchCategories, researchIntents, type ResearchIntent, type ResearchResponse } from "./decision-research.ts";

type Distribution = Record<ResearchIntent, { count: number; percentage: number }>;
type TransitionCounts = Record<ResearchIntent, Record<ResearchIntent, number>>;
const counts = (): Record<ResearchIntent, number> => ({ yes: 0, maybe: 0, no: 0 });

/** Internal pure aggregation. No fetch, public route, raw-row output, or client UI import. */
export function summarizeResearch(rows: readonly ResearchResponse[]) {
  const totalCompletedResponses = rows.length;
  const before = counts(), after = counts();
  const transitions: TransitionCounts = { yes: counts(), maybe: counts(), no: counts() };
  let changed = 0, beforeConfidence = 0, afterConfidence = 0;
  for (const row of rows) {
    before[row.before_intent]++;
    after[row.after_intent]++;
    transitions[row.before_intent][row.after_intent]++;
    changed += Number(row.before_intent !== row.after_intent);
    beforeConfidence += row.before_confidence;
    afterConfidence += row.after_confidence;
  }
  const percentage = (n: number) => totalCompletedResponses ? n / totalCompletedResponses * 100 : 0;
  const average = (n: number) => totalCompletedResponses ? n / totalCompletedResponses : null;
  const distribution = (values: Record<ResearchIntent, number>): Distribution => Object.fromEntries(
    researchIntents.map(intent => [intent, { count: values[intent], percentage: percentage(values[intent]) }]),
  ) as Distribution;
  return {
    totalCompletedResponses,
    intentionChangedPercentage: totalCompletedResponses ? percentage(changed) : null,
    averageConfidenceBefore: average(beforeConfidence),
    averageConfidenceAfter: average(afterConfidence),
    averageConfidenceChange: average(afterConfidence - beforeConfidence),
    beforeDistribution: distribution(before), afterDistribution: distribution(after), transitions,
  };
}

export function aggregateResearch(rows: readonly ResearchResponse[]) {
  return {
    overall: summarizeResearch(rows),
    byCategory: [...researchCategories, null].map(category => ({
      category, ...summarizeResearch(rows.filter(row => row.category === category)),
    })),
  };
}
