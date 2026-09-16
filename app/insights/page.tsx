import type { Metadata } from "next";
import PageHeading from "../components/page-heading";
import ProductInsights from "../products/product-insights";
import InsightsWorkspace from "./insights-workspace";

export const metadata: Metadata = {
  title: "Your Decision Insights",
  description: "Separate hypothetical product analyses from recorded purchases and reviews. Evidence from your own records, kept in this browser.",
};

export default function InsightsPage() {
  return <div className="container">
    <PageHeading page="Insights" eyebrow="FIND THE SIGNAL IN YOUR CHOICES" title="What your choices can tell you.">Keep possibilities separate from experience. No invented trends, automatic savings claims, or universal scores.</PageHeading>
    <ProductInsights />
    <details className="legacy-insights"><summary>Supporting insights: goals, GoalLens decisions & scenarios</summary><InsightsWorkspace /></details>
  </div>;
}
