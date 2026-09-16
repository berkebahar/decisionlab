import type { Metadata } from "next";
import PageHeading from "../components/page-heading";
import PurchaseLibrary from "../products/purchase-library";

export const metadata: Metadata = { title: "Your Purchase Library", description: "Record actual use, ownership costs, and satisfaction. Compare experience with the original estimate." };
export default function Page() { return <><div className="container product-page"><PageHeading page="Your Purchase Library" eyebrow="Before you buy" title="From expectations to experience.">Revisit products marked bought. Record actual costs, use, and satisfaction on your terms.</PageHeading><PurchaseLibrary /></div></>; }
