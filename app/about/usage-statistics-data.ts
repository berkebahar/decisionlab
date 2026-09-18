import "server-only";

// Fixed queries only. Never accept filters, project IDs, or event names from a request.
const metrics = [
  { id: "pageviews", label: "Page views" },
  { id: "analysis_completed", label: "Analyses completed" },
  { id: "comparison_completed", label: "Comparisons made" },
  { id: "decision_saved", label: "Decisions saved" },
  { id: "receipt_printed", label: "Receipts printed" },
  { id: "purchase_recorded", label: "Purchases recorded" },
  { id: "review_completed", label: "Reviews completed" },
] as const;

export type UsageStatistic = {
  id: typeof metrics[number]["id"];
  label: string;
  count: number;
};

function readCount(body: unknown, metric: "pageviews" | "count"): number | null {
  if (!body || typeof body !== "object" || !("data" in body)) return null;
  const data = body.data;
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  const value = (data as Record<string, unknown>)[metric];
  // Missing, null, coerced, rounded, and malformed counts are never presented as zero.
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : null;
}

export async function getUsageStatistics(): Promise<UsageStatistic[]> {
  const token = process.env.VERCEL_ANALYTICS_TOKEN?.trim();
  const projectId = process.env.VERCEL_ANALYTICS_PROJECT_ID?.trim();
  const teamId = process.env.VERCEL_ANALYTICS_TEAM_ID?.trim();
  if (!token || !projectId) return [];

  const results = await Promise.all(metrics.map(async ({ id, label }): Promise<UsageStatistic | null> => {
    const pageviews = id === "pageviews";
    // Official count endpoints return production totals since Analytics was enabled.
    const url = new URL(`https://api.vercel.com/v1/query/web-analytics/${pageviews ? "visits" : "events"}/count`);
    url.searchParams.set("projectId", projectId);
    if (teamId) url.searchParams.set("teamId", teamId);
    if (!pageviews) url.searchParams.set("filter", `eventName eq '${id}'`);
    try {
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        cache: "force-cache",
        next: { revalidate: 600 },
        signal: AbortSignal.timeout(5000),
        redirect: "error",
      });
      if (!response.ok) return null;
      const count = readCount(await response.json(), pageviews ? "pageviews" : "count");
      // Only fixed labels and validated totals leave this server-only module.
      return count === null ? null : { id, label, count };
    } catch {
      // Do not log upstream responses, credentials, or errors into the public page.
      return null;
    }
  }));
  return results.filter((result): result is UsageStatistic => result !== null);
}
