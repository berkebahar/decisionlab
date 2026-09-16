export default function Skeleton({ label = "Loading your workspace…" }: { label?: string }) {
  return <div className="skeleton-panel" role="status"><span className="sr-only">{label}</span><span className="skeleton-line short" /><span className="skeleton-line" /><div className="skeleton-grid"><span /><span /><span /></div><span className="skeleton-line medium" /></div>;
}
