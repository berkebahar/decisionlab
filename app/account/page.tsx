import type { Metadata } from "next";
import PageHeading from "../components/page-heading";
import AccountForm from "./account-form";
export const metadata: Metadata = { title: "Account", description: "Sign in to save your DecisionLab Queue and Purchases across devices.", robots: { index: false, follow: false } };
export default function AccountPage() {
  return <div className="container product-page"><PageHeading page="Account" eyebrow="YOUR DECISIONLAB" title="Keep your decisions with you.">An account is optional. Analyze anytime, or sign in to save your Queue and Purchases across devices.</PageHeading><AccountForm /></div>;
}
