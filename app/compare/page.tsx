import type { Metadata } from "next";
import PageHeading from "../components/page-heading";
import CompareWorkspace from "../products/compare-workspace";
import { Suspense } from "react";
import Skeleton from "../components/skeleton";

export const metadata: Metadata = { title: "Compare Products", description: "Compare up to three products by ownership cost, expected use, condition, and personal priorities." };
export default function Page() { return <><div className="container product-page"><PageHeading page="Compare Products" eyebrow="Before you buy" title="Different products. Clearer trade-offs.">Compare up to three goods, including new, used, and refurbished versions. Explore measurable differences without a universal winner.</PageHeading><Suspense fallback={<Skeleton label="Opening your workspace" />}><CompareWorkspace /></Suspense></div></>; }
