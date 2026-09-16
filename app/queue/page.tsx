import type { Metadata } from "next";
import PageHeading from "../components/page-heading";
import QueueWorkspace from "../products/queue-workspace";
import DataBackup from "../components/data-backup";

export const metadata: Metadata = { title: "Your Decision Queue", description: "Save product receipts, schedule local reconsideration dates, and record your decision." };
export default function Page() { return <><div className="container product-page"><PageHeading page="Your Decision Queue" eyebrow="Before you buy" title="A little room before you decide.">Keep receipts, revisit assumptions, and record whether you bought, skipped, postponed, or are still considering a product.</PageHeading><QueueWorkspace /></div><DataBackup /></>; }
