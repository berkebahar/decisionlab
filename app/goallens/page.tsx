import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import PageHeading from "../components/page-heading";
import Icon from "../components/lab-icon";
import Skeleton from "../components/skeleton";
import CalculatorWorkspace from "./calculator-workspace";
import styles from "./goal-lens.module.css";

export const metadata: Metadata = { title: "GoalLens", description: "Explore a purchase, recurring spending, or two options side by side. See the impact on your savings goal and save your comparison." };

export default function GoalLensPage() {
  return <div className="container calculator-page">
    <div className={styles.pageIntro}><PageHeading page="GoalLens" eyebrow="SUPPORTING TOOLS" title="See beyond the price tag.">A purchase has a price. It also has a timeline. Connect everyday spending to your bigger goals and see the trade-off, in real time.</PageHeading><Link className={styles.headerLink} href="/dashboard">Open Savings Goals <Icon name="arrow" size={17} /></Link></div>
    <div className="calculator-workspace"><Suspense fallback={<Skeleton label="Preparing GoalLens" />}><CalculatorWorkspace /></Suspense></div>
    <aside className={styles.guide} aria-label="A little pause before you purchase">
      <div><span><Icon name="branch" size={18} /></span><div><h2>Start with a decision.</h2><p>Explore one purchase, a recurring expense, or two options.</p></div></div>
      <div><span><Icon name="target" size={18} /></span><div><h2>Give it a goal.</h2><p>Add your savings, your target, and what you can put aside each week.</p></div></div>
      <div><span><Icon name="chart" size={18} /></span><div><h2>See the trade-off.</h2><p>Compare the time each choice adds. Save a snapshot to think it over.</p></div></div>
    </aside>
    <p className={styles.disclaimer}>Your choice. Your priorities. Educational estimates, not professional financial advice. <Link className="text-link" href="/about">Learn about DecisionLab.</Link></p>
  </div>;
}
