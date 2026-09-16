export default function BrandMark({ className = "" }: { className?: string }) {
  return <svg className={`brand-symbol ${className}`} width="36" height="36" viewBox="0 0 40 40" fill="none" aria-hidden="true">
    <rect width="40" height="40" rx="12" fill="currentColor" />
    <path d="M12 10h7a10 10 0 0 1 0 20h-7V10Z" stroke="var(--mark-ink, #fff)" strokeWidth="2.4" strokeLinejoin="round" />
    <path d="M12 23h6l5-7m-5 7 5 3" stroke="var(--mark-ink, #fff)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="24" cy="15" r="2.5" fill="var(--mark-accent, #a5d1bd)" /><circle cx="24" cy="27" r="2" fill="var(--mark-ink, #fff)" />
  </svg>;
}
