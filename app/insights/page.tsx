import type { Metadata } from "next";
import WorkspaceEntrance from "../components/workspace-entrance";
import ProductInsights from "../products/product-insights";
import InsightsWorkspace from "./insights-workspace";

export const metadata: Metadata = {
  title: "Insights",
  description: "Separate hypothetical product analyses from recorded purchases and reviews. Evidence from your own records, kept in this browser.",
};

export default function InsightsPage() {
  return <div className="decision-studio insights-studio">
    <WorkspaceEntrance page="Insights" words="PATTERNS · USAGE · INSIGHT" title="What your choices can tell you.">A few useful observations from your own decisions and purchase reviews.</WorkspaceEntrance>
    <div className="container product-page studio-workspace"><div className="studio-paper">
    <ProductInsights />
    <details className="legacy-insights"><summary>Supporting tools: Savings Goals, GoalLens & Savings Simulator</summary><InsightsWorkspace /></details>
    </div></div>
  </div>;
}
