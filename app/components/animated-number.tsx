import { usd } from "../goal-lens-calculations";

export default function AnimatedNumber({ value, format = "number", suffix = "", className = "" }: { value: number; format?: "currency" | "number"; suffix?: string; className?: string }) {
  const formatted = format === "currency" ? usd.format(value) : new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value);
  return <span className={`animated-number ${className}`}><span className="number-value" key={formatted}>{formatted}{suffix}</span></span>;
}
