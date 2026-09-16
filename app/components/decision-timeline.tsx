import styles from "./decision-timeline.module.css";

type TimelineOption = { name: string; weeks: number };

/** The tracks share one scale; the striped segment is time added by spending. */
export default function DecisionTimeline({ baseline, options }: { baseline: number; options: TimelineOption[] }) {
  const maximum = Math.max(baseline, ...options.map((option) => option.weeks), 1);
  const series = [{ name: "Without spending", weeks: baseline }, ...options];

  return (
    <figure className={styles.timeline}>
      <figcaption>Your possible timelines <span>Same goal. Different paths.</span></figcaption>
      <div className={styles.rows}>
        {series.map((option, index) => (
          <div className={styles.row} key={index}>
            <div className={styles.label}><span>{option.name}</span><strong>{option.weeks} {option.weeks === 1 ? "week" : "weeks"}</strong></div>
            <div className={styles.track} aria-hidden="true">
              <span className={styles.baseline} style={{ width: `${baseline / maximum * 100}%` }} />
              {index > 0 && <span className={styles.delay} style={{ left: `${baseline / maximum * 100}%`, width: `${(option.weeks - baseline) / maximum * 100}%` }} />}
              <span className={styles.endpoint} style={{ left: `${option.weeks / maximum * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className={styles.axis} aria-hidden="true"><span>Today</span><span>{Math.max(...series.map((item) => item.weeks))} weeks</span></div>
      <p className={styles.legend}><span /> Time to goal <span /> Added time from spending</p>
    </figure>
  );
}
