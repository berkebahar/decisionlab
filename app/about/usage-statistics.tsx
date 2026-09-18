import type { UsageStatistic } from "./usage-statistics-data";
import styles from "./usage-statistics.module.css";

export default function UsageStatistics({ statistics }: { statistics: UsageStatistic[] }) {
  return <section className={styles.section} aria-labelledby="usage-heading">
    <div className={styles.heading}>
      <div><p className="eyebrow">SMALL ACTIONS. MORE PERSPECTIVE.</p><h2 id="usage-heading">DecisionLab in use</h2></div>
      <p>Real moments of pausing, comparing, and deciding.</p>
    </div>
    {statistics.length > 0 ? <>
      <dl className={styles.totals}>
        {statistics.map(statistic => <div className={styles.statistic} key={statistic.id}>
          <dt>{statistic.label}</dt>
          <dd>{new Intl.NumberFormat("en-US").format(statistic.count)}</dd>
        </div>)}
      </dl>
      <p className={styles.note}>Recorded activity since tracking began. Page views include repeat visits, not unique visitors.</p>
      <p className={styles.note}>Aggregate counts only. Refreshed about every 10 minutes. Only available totals are shown.</p>
    </> : <p className={styles.unavailable}>Usage totals will appear here when available.</p>}
  </section>;
}
