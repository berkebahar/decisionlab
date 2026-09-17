import type { Metadata } from "next";
import PageHeading from "../components/page-heading";
import AnalyzeWorkspace from "../products/analyze-workspace";
import { Suspense } from "react";
import Skeleton from "../components/skeleton";

export const metadata: Metadata = { title: "Analyze a Product", description: "Understand purchase price, ownership expenses, use, and resale with a transparent True Cost Receipt." };
export default function Page() { return <><div className="container product-page"><PageHeading page="Analyze a Product" eyebrow="Before you buy" title="Your purchase, in perspective.">Start with a product and how you expect to use it. Leave with a True Cost Receipt.</PageHeading><Suspense fallback={<Skeleton label="Preparing your analysis" />}><AnalyzeWorkspace /></Suspense></div></>; }
