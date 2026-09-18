import type { Metadata } from "next";
import WorkspaceEntrance from "../components/workspace-entrance";
import AnalyzeWorkspace from "../products/analyze-workspace";
import { Suspense } from "react";
import Skeleton from "../components/skeleton";

export const metadata: Metadata = { title: "Analyze a Product", description: "Understand purchase price, ownership expenses, use, and resale with a transparent True Cost Receipt." };
export default function Page() { return <div className="decision-studio analyze-studio"><WorkspaceEntrance page="Analyze" title="See what it really costs." words="TRUE COST · OWNERSHIP · USE">Start with your assumptions. Leave with a True Cost Receipt.</WorkspaceEntrance><div className="container product-page studio-workspace"><Suspense fallback={<Skeleton label="Preparing your analysis" />}><AnalyzeWorkspace /></Suspense></div></div>; }
