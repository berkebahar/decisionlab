import type { Metadata } from "next";
import WorkspaceEntrance from "../components/workspace-entrance";
import QueueWorkspace from "../products/queue-workspace";
import DataBackup from "../components/data-backup";

export const metadata: Metadata = { title: "Queue", description: "Save product receipts, schedule local reconsideration dates, and record your decision." };
export default function Page() { return <><div className="decision-studio queue-studio"><WorkspaceEntrance page="Queue" title="Give the decision some space." words="CONSIDER · WAIT · DECIDE">Save it now. Reconsider it later.</WorkspaceEntrance><div className="container product-page studio-workspace"><QueueWorkspace /></div></div><DataBackup /></>; }
