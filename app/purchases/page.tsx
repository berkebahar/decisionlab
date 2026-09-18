import type { Metadata } from "next";
import PageHeading from "../components/page-heading";
import PurchaseLibrary from "../products/purchase-library";

export const metadata: Metadata = { title: "Purchases", description: "Record actual use, ownership costs, and satisfaction. Compare experience with the original estimate." };
export default function Page() { return <><div className="container product-page"><PageHeading page="Purchases" eyebrow="After you buy" title="From expectations to experience.">Record what you spent, how much you used it, and whether it met your expectations.</PageHeading><PurchaseLibrary /></div></>; }
