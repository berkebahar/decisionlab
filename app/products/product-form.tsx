"use client";
import { useId, useRef, useState } from "react";
import { categories, conditions, currencies, isAnalysis, type ProductAnalysis, type Currency, type Category, type Condition } from "./product-model";
import { GOALS_STORAGE_KEY, parseGoals, type SavingsGoal } from "../savings-goals";
import { useLocalStorage } from "../use-local-storage";

function initialFields(a?: ProductAnalysis) {
  return { name: a?.name ?? "", model: a?.model ?? "", category: a?.category ?? "technology", customCategory: a?.customCategory ?? "", condition: a?.condition ?? "new", currency: a?.currency ?? "USD",
    price: a ? String(a.price) : "", tax: a?.tax?.toString() ?? "", shipping: a?.shipping?.toString() ?? "",
    duration: a?.duration.toString() ?? "", durationUnit: a?.durationUnit ?? "years", uses: a?.uses.toString() ?? "", useFrequency: a?.useFrequency ?? "week",
    maintenanceYearly: a?.maintenanceYearly?.toString() ?? "", accessories: a?.accessories?.toString() ?? "", subscription: a?.subscription?.toString() ?? "", subscriptionFrequency: a?.subscriptionFrequency ?? "month", repairs: a?.repairs?.toString() ?? "", resale: a?.resale?.toString() ?? "",
    purpose: a?.purpose ?? "", replaces: a?.replaces ?? false, importance: String(a?.importance ?? 3), usefulness: String(a?.usefulness ?? 3),
    hasAlternative: !!a?.alternative, alternativeName: a?.alternative?.name ?? "", alternativePrice: a?.alternative?.price.toString() ?? "", nextBestUse: a?.nextBestUse ?? "",
    hasGoal: !!a?.goal, goalName: a?.goal?.name ?? "", goalSaved: a?.goal?.saved.toString() ?? "", goalTarget: a?.goal?.target.toString() ?? "", goalContribution: a?.goal?.contribution.toString() ?? "", goalFrequency: a?.goal?.frequency ?? "week" };
}
type Fields = ReturnType<typeof initialFields>;
type TextKey = { [K in keyof Fields]: Fields[K] extends string ? K : never }[keyof Fields];
const number = (v: string) => v.trim() ? Number(v) : NaN;
const optional = (v: string) => v.trim() ? Number(v) : null;
const steps = ["Product", "Ownership", "Purpose", "Optional goal"];
export default function ProductForm({ initial, onComplete, onCancel }: { initial?: ProductAnalysis; onComplete: (analysis: ProductAnalysis) => void; onCancel?: () => void }) {
  const [fields, setFields] = useState(() => initialFields(initial));
  const [step, setStep] = useState(0), [error, setError] = useState("");
  const [furthest, setFurthest] = useState(initial ? 3 : 0);
  const form = useRef<HTMLFormElement>(null), heading = useRef<HTMLHeadingElement>(null), prefix = useId();
  const snapshot = useLocalStorage(GOALS_STORAGE_KEY);
  let goals: SavingsGoal[] = [], goalError = "";
  try { goals = parseGoals(snapshot ?? null); } catch { goalError = "Existing goals are unavailable. You can define a goal here without changing saved goals."; }
  const update = <K extends keyof Fields>(name: K, value: Fields[K]) => {
    const currencyChanged = name === "currency" && value !== fields.currency && fields.hasGoal;
    setFields(f => ({ ...f, [name]: value, ...(currencyChanged ? { goalSaved: "", goalTarget: "", goalContribution: "" } : {}) }));
    setError(currencyChanged ? "Currency changed without conversion. Re-enter optional goal amounts in the new currency before generating a receipt." : "");
  };
  function changeStep(next: number) {
    if (next > step && !form.current?.reportValidity()) return;
    setFurthest(current => Math.max(current, next)); setStep(next); setError(""); requestAnimationFrame(() => heading.current?.focus());
  }
  function field(name: TextKey, label: string, options: { numeric?: boolean; required?: boolean; help?: string; maxLength?: number; min?: number; max?: number; integer?: boolean } = {}) {
    const id = `${prefix}-${name}`;
    return <div className="product-field" key={name}><label htmlFor={id}>{label}</label><input id={id} name={name} value={fields[name]} type={options.numeric ? "number" : "text"} inputMode={options.numeric ? "decimal" : undefined} required={options.required} min={options.numeric ? options.min ?? 0 : undefined} max={options.numeric ? options.max ?? 1_000_000_000 : undefined} step={options.numeric ? options.integer ? 1 : .01 : undefined} maxLength={options.numeric ? undefined : options.maxLength ?? 80} onChange={event => update(name, event.target.value as Fields[typeof name])} aria-describedby={options.help ? `${id}-hint` : undefined} />{options.help && <p id={`${id}-hint`} className="product-helper">{options.help}</p>}</div>;
  }
  function select(name: TextKey, label: string, values: readonly string[]) {
    const id = `${prefix}-${name}`;
    return <div className="product-field"><label htmlFor={id}>{label}</label><select id={id} name={name} value={fields[name]} onChange={event => update(name, event.target.value as Fields[typeof name])}>{values.map(value => <option key={value} value={value}>{value}</option>)}</select></div>;
  }
  function area(name: "purpose" | "nextBestUse", label: string) { const id = `${prefix}-${name}`; return <div className="product-field product-wide"><label htmlFor={id}>{label}</label><textarea id={id} name={name} rows={3} maxLength={500} value={fields[name]} onChange={event => update(name, event.target.value)} /></div>; }
  function submit() {
    const a: ProductAnalysis = { name: fields.name.trim(), model: fields.model.trim(), category: fields.category as Category, customCategory: fields.customCategory.trim(), condition: fields.condition as Condition, currency: fields.currency as Currency,
      price: number(fields.price), tax: optional(fields.tax), shipping: optional(fields.shipping), duration: number(fields.duration), durationUnit: fields.durationUnit as "months" | "years", uses: number(fields.uses), useFrequency: fields.useFrequency as "week" | "month",
      maintenanceYearly: optional(fields.maintenanceYearly), accessories: optional(fields.accessories), subscription: optional(fields.subscription), subscriptionFrequency: fields.subscriptionFrequency as "month" | "year", repairs: optional(fields.repairs), resale: optional(fields.resale),
      purpose: fields.purpose, replaces: fields.replaces, importance: number(fields.importance), usefulness: number(fields.usefulness), alternative: fields.hasAlternative ? { name: fields.alternativeName.trim(), price: number(fields.alternativePrice) } : null, nextBestUse: fields.nextBestUse,
      goal: fields.hasGoal ? { name: fields.goalName.trim(), saved: number(fields.goalSaved), target: number(fields.goalTarget), contribution: number(fields.goalContribution), frequency: fields.goalFrequency as "week" | "month" } : null };
    if (!isAnalysis(a)) { setError("Check all four steps: name, price, ownership duration, expected uses, and any selected alternative or goal. Use valid nonnegative amounts (up to 1 billion), with no more than two decimal places."); return; }
    try { onComplete(a); } catch (error) { setError(error instanceof Error ? error.message : "Could not analyze these inputs."); }
  }
  return <form ref={form} className="product-form" onSubmit={event => { event.preventDefault(); if (step < 3) changeStep(step + 1); else submit(); }}>
    <nav className="product-steps" aria-label="Analysis steps">{steps.map((name,index) => <button key={name} type="button" disabled={index > furthest + 1} aria-current={step === index ? "step" : undefined} onClick={() => changeStep(index)}><span>{index + 1}</span>{name}</button>)}</nav>
    <div className="product-form-heading"><p className="eyebrow">Step {step + 1} of 4</p><h2 ref={heading} tabIndex={-1}>{steps[step]}</h2><p>Use your own estimates. Blank optional costs remain unknown; enter 0 only when a cost does not apply. All amounts use {fields.currency}.</p></div>
    {step === 0 && <div className="product-fields">{field("name", "Product name", { required: true })}{field("model", "Brand / model (optional)", { maxLength: 120 })}{select("category", "Category", categories)}{fields.category === "custom" && field("customCategory", "Your category", { required: true })}{select("condition", "Condition", conditions)}{select("currency", "Currency (no conversion)", currencies)}{field("price", `Purchase price (${fields.currency})`, { required: true, numeric: true })}{field("tax", `Tax amount (${fields.currency}, optional)`, { numeric: true, help: "An amount, not a percentage." })}{field("shipping", `Shipping (${fields.currency}, optional)`, { numeric: true })}</div>}
    {step === 1 && <div className="product-fields">{field("duration", "Expected ownership duration", { required: true, numeric: true, min: 1, integer: true, max: fields.durationUnit === "years" ? 100 : 1200, help: "Your planned ownership, not a verified product lifespan." })}{select("durationUnit", "Duration unit", ["months", "years"])}{field("uses", "Expected number of uses", { required: true, numeric: true, max: 10000 })}{select("useFrequency", "Uses per", ["week", "month"])}{field("maintenanceYearly", "Maintenance per year (optional)", { numeric: true })}{field("accessories", "Accessories / consumables (optional)", { numeric: true, help: "Total for the entire ownership period." })}{field("subscription", "Required subscription (optional)", { numeric: true })}{select("subscriptionFrequency", "Subscription cost per", ["month", "year"])}{field("repairs", "Repair allowance (optional)", { numeric: true, help: "Total for the entire ownership period." })}{field("resale", "Expected resale at the end (optional)", { numeric: true, help: "Your estimate; not a price forecast." })}</div>}
    {step === 2 && <div className="product-fields">{area("purpose", "What problem will this product solve?")}<label className="product-check product-wide"><input type="checkbox" checked={fields.replaces} onChange={event => update("replaces", event.target.checked)} />It replaces something I already own</label>{select("importance", "Importance to you (1 low, 5 high)", ["1","2","3","4","5"])}{select("usefulness", "Expected usefulness (1 low, 5 high)", ["1","2","3","4","5"])}<p className="product-helper product-wide">These are personal assessments, not a recommendation score. Both start at the neutral midpoint; adjust them to reflect your view.</p><label className="product-check product-wide"><input type="checkbox" checked={fields.hasAlternative} onChange={event => update("hasAlternative", event.target.checked)} />I have an alternative to compare</label>{fields.hasAlternative && <>{field("alternativeName", "Alternative name", { required: true })}{field("alternativePrice", `Alternative purchase price (${fields.currency})`, { numeric: true, required: true })}</>}{area("nextBestUse", "What is the next-best use of this money?")}</div>}
    {step === 3 && <><label className="product-check"><input type="checkbox" checked={fields.hasGoal} onChange={event => update("hasGoal", event.target.checked)} />Include a savings goal (optional)</label><p className="product-helper">You can generate a complete receipt without savings information. No bank details are needed.</p>{fields.hasGoal && <>
      <div className="product-field"><label htmlFor={`${prefix}-existing`}>Start from an existing goal (USD only)</label><select id={`${prefix}-existing`} defaultValue="" disabled={fields.currency !== "USD"} onChange={event => { const goal = goals.find(g => g.id === event.target.value); if (goal) setFields(f => ({ ...f, goalName: goal.name, goalSaved: String(goal.currentAmount), goalTarget: String(goal.targetAmount), goalContribution: String(goal.weeklyContribution), goalFrequency: "week" })); }}><option value="">Define a simple goal below</option>{goals.map(goal => <option key={goal.id} value={goal.id}>{goal.name}</option>)}</select></div>
      {goalError && <p className="product-notice">{goalError}</p>}<p className="product-helper">This goal is a snapshot inside this analysis, in {fields.currency}. It does not change your Dashboard. No currency conversion is performed.</p>
      <div className="product-fields">{field("goalName", "Goal name", { required: true })}{field("goalSaved", "Currently saved", { required: true, numeric: true })}{field("goalTarget", "Goal amount", { required: true, numeric: true, min: .01 })}{field("goalContribution", "Contribution after other expenses", { required: true, numeric: true, help: "Exclude this purchase. Zero means no future deposits." })}{select("goalFrequency", "Contribution per", ["week", "month"])}</div>
    </>}</>}
    {error && <p role="alert" className="product-error">{error}</p>}
    <div className="product-actions">{step > 0 && <button className="button-outline" type="button" onClick={() => changeStep(step - 1)}>Back</button>}<button className="button-primary" type="submit">{step === 3 ? "Generate True Cost Receipt" : "Continue"}</button>{onCancel && <button type="button" className="button-quiet" onClick={onCancel}>Cancel editing</button>}</div>
  </form>;
}
