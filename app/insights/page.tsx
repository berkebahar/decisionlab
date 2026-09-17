import type { Metadata } from "next";
import PageHeading from "../components/page-heading";
import ProductInsights from "../products/product-insights";
import InsightsWorkspace from "./insights-workspace";

export const metadata: Metadata = {
  title: "Your Decision Insights",
  description: "Separate hypothetical product analyses from recorded purchases and reviews. Evidence from your own records, kept in this browser.",
};

export default function InsightsPage() {
  return <div className="container product-page">
    <PageHeading page="Insights" eyebrow="Learn from experience" title="What your choices can tell you.">A few useful observations from your own decisions and purchase reviews.</PageHeading>
    <ProductInsights />
    <details className="legacy-insights"><summary>Supporting insights: goals, GoalLens decisions & scenarios</summary><InsightsWorkspace /></details>
  </div>;
}
