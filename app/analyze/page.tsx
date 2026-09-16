import type { Metadata } from "next";
import PageHeading from "../components/page-heading";
import AnalyzeWorkspace from "../products/analyze-workspace";
import { Suspense } from "react";
import Skeleton from "../components/skeleton";

export const metadata: Metadata = { title: "Analyze a Product", description: "Understand purchase price, ownership expenses, use, and resale with a transparent True Cost Receipt." };
export default function Page() { return <><div className="container product-page"><PageHeading page="Analyze a Product" eyebrow="Before you buy" title="Your purchase, in perspective.">Enter your assumptions. See the cost of owning and using a product, with an optional view of its impact on a goal.</PageHeading><Suspense fallback={<Skeleton label="Opening your workspace" />}><AnalyzeWorkspace /></Suspense></div></>; }
