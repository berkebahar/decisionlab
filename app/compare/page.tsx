import type { Metadata } from "next";
import WorkspaceEntrance from "../components/workspace-entrance";
import CompareWorkspace from "../products/compare-workspace";
import { Suspense } from "react";
import Skeleton from "../components/skeleton";

export const metadata: Metadata = { title: "Compare Products", description: "Compare up to three products by ownership cost, expected use, condition, and personal priorities." };
export default function Page() { return <div className="decision-studio compare-studio"><WorkspaceEntrance page="Compare" words="COMPARE · TRUE COST · VALUE" title="Different products. Clearer trade-offs.">Compare up to three products by true cost, use, and resale. Your priorities decide what matters.</WorkspaceEntrance><div className="container product-page studio-workspace"><div className="studio-paper"><Suspense fallback={<Skeleton label="Preparing your comparison" />}><CompareWorkspace /></Suspense></div></div></div>; }
