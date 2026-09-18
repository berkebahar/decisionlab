import type { Metadata } from "next";
import Link from "next/link";
import Icon from "../components/lab-icon";
import PageHeading from "../components/page-heading";
import SavedDecisions from "../saved-decisions";
import DataBackup from "../components/data-backup";
import GoalDashboard from "./goal-dashboard";
import styles from "./dashboard.module.css";

export const metadata: Metadata = { title: "Savings Goals", description: "See your savings at a glance. Plan weekly contributions, track goal milestones, and revisit your saved GoalLens comparisons in Savings Goals." };

export default function DashboardPage() {
  return <>
    <div className="container">
      <div className={styles.pageHeader}>
        <PageHeading page="Savings Goals" eyebrow="SUPPORTING TOOLS" title="Your future, taking shape.">A little clarity. A steady rhythm. One place to see where your savings are taking you.</PageHeading>
        <Link href="/goallens" className="button-outline"><Icon name="branch" size={18} /> Open GoalLens <Icon name="arrow" size={16} /></Link>
      </div>
      <GoalDashboard />
    </div>
    <SavedDecisions />
    <DataBackup />
  </>;
}
