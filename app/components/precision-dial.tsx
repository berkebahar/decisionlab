export default function PrecisionDial({ progress, name }: { progress: number; name: string }) {
  const value = Math.min(100, Math.max(0, progress));
  return <svg className="precision-dial" viewBox="0 0 120 120" role="img" aria-label={`${name}: ${value}% funded`}>
    <circle cx="60" cy="60" r="56" fill="none" stroke="var(--border)" />
    {Array.from({ length: 40 }, (_, index) => <line key={index} x1="60" y1="7" x2="60" y2={index % 5 === 0 ? 15 : 11} transform={`rotate(${index * 9} 60 60)`} stroke={index % 5 === 0 ? "var(--champagne)" : "var(--muted)"} strokeWidth={index % 5 === 0 ? 1.5 : .8} />)}
    <circle cx="60" cy="60" r="39" fill="none" stroke="var(--border)" strokeWidth="3" />
    <circle className="dial-arc" cx="60" cy="60" r="39" fill="none" stroke="var(--blue)" strokeWidth="3" pathLength="100" strokeDasharray={`${value} 100`} strokeLinecap="round" transform="rotate(-90 60 60)" />
    <text x="60" y="64" textAnchor="middle" fill="var(--foreground)" fontSize="21" fontFamily="var(--font-geist-sans), sans-serif">{value}%</text>
    <text x="60" y="82" textAnchor="middle" fill="var(--muted)" fontSize="14">funded</text>
  </svg>;
}
