import type { Metadata } from "next";
import WorkspaceEntrance from "../components/workspace-entrance";
import PurchaseLibrary from "../products/purchase-library";

export const metadata: Metadata = { title: "Purchases", description: "Record actual use, ownership costs, and satisfaction. Compare experience with the original estimate." };
export default function Page() { return <div className="decision-studio purchases-studio"><WorkspaceEntrance page="Purchases" words="OWNED · ACTUAL · REVIEW" title="From expectations to experience.">Record what you spent, how much you used it, and whether it met your expectations.</WorkspaceEntrance><div className="container product-page studio-workspace"><PurchaseLibrary /></div></div>; }
