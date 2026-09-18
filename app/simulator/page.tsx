import type { Metadata } from "next";
import PageHeading from "../components/page-heading";
import ScenarioWorkspace from "./scenario-workspace";

export const metadata: Metadata = {
  title: "Savings Simulator",
  description: "Explore two savings plans side by side. Adjust weekly contributions and spending, compare your goal timelines, and save your scenarios privately in this browser.",
};

export default function SimulatorPage() {
  return <div className="container">
    <PageHeading page="Savings Simulator" eyebrow="SUPPORTING TOOLS" title="One goal. More possibilities.">A little less spending. A little more saving. Adjust your plan and see how the path to your goal changes.</PageHeading>
    <ScenarioWorkspace />
  </div>;
}
