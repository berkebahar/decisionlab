"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { usd } from "./goal-lens-calculations";
import { deleteDecision, parseDecisions, STORAGE_KEY, storeDecision, type SavedDecision } from "./saved-decisions-storage";
import { notifyStorageChange, STORAGE_UNAVAILABLE, useLocalStorage } from "./use-local-storage";
import DecisionJournalEditor from "./components/decision-journal";
import BrandMark from "./components/brand-mark";
import Icon from "./components/lab-icon";
import Skeleton from "./components/skeleton";
import styles from "./saved-decisions.module.css";

export function saveComparison(decision: SavedDecision) {
  storeDecision(window.localStorage, decision);
  notifyStorageChange();
}

const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });
const modeLabels = { purchase: "Single purchase", recurring: "Recurring expense", compare: "Two purchases" };

export default function SavedDecisions() {
  const snapshot = useLocalStorage(STORAGE_KEY);
  const [message, setMessage] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  let decisions: SavedDecision[] = [];
  let error = "";
  try {
    decisions = parseDecisions(snapshot ?? null);
  } catch {
    error = snapshot === STORAGE_UNAVAILABLE
      ? "Your browser has blocked saved decisions. Allow site storage to save comparisons."
      : "We couldn’t read your saved decisions. Existing data has been kept; new comparisons won’t overwrite it.";
  }

  function remove(id: string) {
    if (!window.confirm("Delete this saved decision? This cannot be undone.")) return;
    try {
      deleteDecision(window.localStorage, id);
      notifyStorageChange();
      setMessage("Decision deleted.");
      heading.current?.focus();
    } catch {
      setMessage("We couldn’t delete this decision. Please check that your browser allows site storage and try again.");
    }
  }

  return (
    <section className="saved-section container" id="saved-decisions" aria-labelledby="saved-heading">
      <div className={styles.sectionHeader}><div className="section-intro">
        <p className="eyebrow">YOUR DECISIONS, IN PERSPECTIVE</p>
        <h2 id="saved-heading" ref={heading} tabIndex={-1}>Saved decisions {decisions.length > 0 && <span className={styles.count}>{decisions.length}</span>}</h2>
        <p>Keep hypothetical comparisons and optionally record what you chose. These records are specific to this browser and device; clearing browser data can erase them.</p>
      </div><Link href="/goallens" className={styles.newDecision}><Icon name="plus" size={17} />New comparison</Link></div>
      <p className="storage-message" role="status">{error || message}</p>
      {snapshot === undefined && <Skeleton label="Loading your decisions…" />}
      {snapshot !== undefined && !error && decisions.length === 0 && <div className={`empty-state ${styles.empty}`}><BrandMark className={styles.emptyBrand} /><span className={styles.emptyEyebrow}>YOUR DECISION JOURNAL</span><h3>A little perspective to come back to.</h3><p>No saved decisions yet. Explore a trade-off in GoalLens and select “Save comparison” to keep a snapshot here.</p><Link className="button-outline" href="/goallens">Explore GoalLens <Icon name="arrow" size={17} /></Link></div>}
      <div className={styles.grid}>
        {decisions.map((decision) => (
          <article className={`saved-card ${styles.card}`} key={decision.id}>
            <div className={styles.cardHeader}><span className={styles.mode}><Icon name={decision.mode === "purchase" ? "wallet" : decision.mode === "recurring" ? "clock" : "branch"} size={15} />{modeLabels[decision.mode]}</span><time dateTime={decision.savedAt}>{dateFormat.format(new Date(decision.savedAt))}</time></div>
            <h3><Icon name="target" size={19} />{decision.goalName}</h3>
            <p className={styles.assumptions}>{usd.format(decision.amountSaved)} of {usd.format(decision.goalPrice)} saved · {usd.format(decision.weeklySavings)}/week</p>
            <ul>
              {decision.purchases.map((purchase, index) => (
                <li className={styles.purchase} key={index}>
                  <div><strong>{purchase.name}</strong><span>{usd.format(purchase.price)}{decision.mode === "recurring" ? "/year" : ""}</span></div>
                  <div className={styles.delay} data-impact={purchase.extraWeeks <= 2 ? "low" : purchase.extraWeeks <= 8 ? "moderate" : "high"}><strong>+{purchase.extraWeeks}</strong><span>{decision.mode === "recurring" && decision.calculationVersion !== 2 ? "legacy equivalent weeks" : `extra ${purchase.extraWeeks === 1 ? "week" : "weeks"}`}</span></div>
                </li>
              ))}
            </ul>
            {decision.mode === "recurring" && decision.calculationVersion !== 2 && <p className={styles.assumptions}>Legacy annual-cost equivalent, not an ongoing completion forecast. Recalculate in GoalLens for the current model.</p>}
            <DecisionJournalEditor decision={decision} />
            <div className={styles.cardFooter}><span><Icon name="check" size={14} /> Saved snapshot</span><button className="delete-button" type="button" onClick={() => remove(decision.id)} aria-label={`Delete comparison for ${decision.purchases.map((purchase) => purchase.name).join(" and ")}`}>Delete</button></div>
          </article>
        ))}
      </div>
    </section>
  );
}
