"use client";

import { useState } from "react";
import Link from "next/link";
import { calculateRecurring, calculateSavings, MAX_AMOUNT, moneyError, usd } from "./goal-lens-calculations";
import { saveComparison } from "./saved-decisions";
import type { DecisionMode } from "./saved-decisions-storage";
import type { SavingsGoal } from "./savings-goals";
import AnimatedNumber from "./components/animated-number";
import DecisionTimeline from "./components/decision-timeline";
import Icon from "./components/lab-icon";
import TermTip from "./components/term-tip";
import styles from "./goallens/goal-lens.module.css";

const defaults = {
  purchaseName: "New pair of shoes",
  purchasePrice: "120",
  secondName: "Headphones",
  secondPrice: "75",
  expenseName: "Coffee",
  costPerPurchase: "5",
  frequency: "3",
  goalName: "Laptop",
  goalPrice: "1500",
  amountSaved: "900",
  weeklySavings: "30",
};

type FieldName = keyof typeof defaults;
type FieldDefinition = { name: FieldName; label: string; numeric?: boolean };
const goalFields: FieldDefinition[] = [
  { name: "goalName", label: "Savings goal" },
  { name: "goalPrice", label: "Goal price", numeric: true },
  { name: "amountSaved", label: "Already saved", numeric: true },
  { name: "weeklySavings", label: "Weekly savings", numeric: true },
];
const modes: { value: DecisionMode; label: string }[] = [
  { value: "purchase", label: "One purchase" },
  { value: "recurring", label: "Recurring" },
  { value: "compare", label: "Compare two" },
];
const fieldHints: Partial<Record<FieldName, string>> = {
  weeklySavings: "What you can set aside each week.",
  frequency: "A whole number, from 0 to 1,000.",
};

function impactLevel(extraWeeks: number) {
  return extraWeeks <= 2 ? "low" : extraWeeks <= 8 ? "moderate" : "high";
}

function weeks(value: number) {
  return `${value} ${value === 1 ? "week" : "weeks"}`;
}

export default function GoalLens({ initialGoal, initialMode = "purchase" }: { initialGoal?: SavingsGoal; initialMode?: DecisionMode }) {
  const [mode, setMode] = useState<DecisionMode>(initialMode);
  const [fields, setFields] = useState(() => initialGoal ? { ...defaults, goalName: initialGoal.name, goalPrice: String(initialGoal.targetAmount), amountSaved: String(initialGoal.currentAmount), weeklySavings: String(initialGoal.weeklyContribution) } : defaults);
  const [message, setMessage] = useState("");
  const [saveCount, setSaveCount] = useState(0);
  const purchaseFields: FieldDefinition[] = mode === "recurring"
    ? [
      { name: "expenseName", label: "Expense name" },
      { name: "costPerPurchase", label: "Cost per purchase", numeric: true },
      { name: "frequency", label: "Purchases per week", numeric: true },
    ]
    : [
      { name: "purchaseName", label: mode === "compare" ? "Purchase A" : "Name of purchase" },
      { name: "purchasePrice", label: "Purchase price", numeric: true },
      ...(mode === "compare" ? [
        { name: "secondName" as const, label: "Purchase B" },
        { name: "secondPrice" as const, label: "Purchase B price", numeric: true },
      ] : []),
    ];

  const errors: Partial<Record<FieldName, string>> = {};
  for (const field of [...purchaseFields, ...goalFields]) {
    const value = fields[field.name];
    if (!value.trim()) {
      errors[field.name] = `Please enter ${field.label.toLowerCase()}.`;
    } else if (field.numeric) {
      const amount = Number(value);
      if (field.name === "frequency") {
        if (!Number.isInteger(amount) || amount < 0 || amount > 1000) {
          errors.frequency = "Enter a whole number from 0 to 1,000.";
        }
      } else {
        const error = moneyError(amount);
        if (error) errors[field.name] = error;
      }
    }
  }
  if (!errors.weeklySavings && Number(fields.weeklySavings) === 0) {
    errors.weeklySavings = `Enter weekly savings greater than ${usd.format(0)} to see your timeline.`;
  }


  const inputs = {
    goalPrice: Number(fields.goalPrice),
    amountSaved: Number(fields.amountSaved),
    weeklySavings: Number(fields.weeklySavings),
  };
  const recurring = calculateRecurring({ ...inputs, costPerPurchase: Number(fields.costPerPurchase), frequency: Number(fields.frequency) });
  const first = mode === "recurring" ? recurring : calculateSavings({ ...inputs, purchasePrice: Number(fields.purchasePrice) });
  const second = calculateSavings({ ...inputs, purchasePrice: Number(fields.secondPrice) });
  const hasErrors = Object.keys(errors).length > 0;
  const calculationError = "error" in first ? first.error : mode === "compare" && "error" in second ? second.error : undefined;
  const valid = !hasErrors && !calculationError;
  const goal = fields.goalName.trim();
  const purchase = mode === "recurring" ? fields.expenseName.trim() : fields.purchaseName.trim();
  const price = mode === "recurring" && "yearlyCost" in recurring ? recurring.yearlyCost : Number(fields.purchasePrice);

  function update(name: FieldName, value: string) {
    setFields((current) => ({ ...current, [name]: value }));
    setMessage("");
  }

  function reset() {
    setFields(defaults);
    setMode("purchase");
    setMessage("Default example restored. Your saved decisions are unchanged.");
  }

  function save() {
    if (!valid || "error" in first || (mode === "compare" && "error" in second)) return;
    const purchases = [{ name: purchase, price, extraWeeks: first.extraWeeks }];
    if (mode === "compare" && !("error" in second)) {
      purchases.push({ name: fields.secondName.trim(), price: Number(fields.secondPrice), extraWeeks: second.extraWeeks });
    }
    try {
      saveComparison({
        id: crypto.randomUUID(), mode, goalName: goal, ...inputs, purchases, calculationVersion: 2,
        savedAt: new Date().toISOString(),
      });
      setMessage("Comparison saved. Find it in Savings Goals under Saved GoalLens comparisons.");
      setSaveCount((count) => count + 1);
    } catch {
      setMessage("We couldn’t save this comparison. Site storage may be blocked, full, or contain unreadable data. Your existing decisions have been kept.");
    }
  }

  function renderField({ name, label, numeric }: FieldDefinition) {
    const isFrequency = name === "frequency";
    const hint = name === "weeklySavings" ? (mode === "recurring" ? "Available each week BEFORE this recurring expense. We subtract it once." : "Available each week after regular expenses; exclude this modeled purchase.") : fieldHints[name];
    return (
      <div className={`${styles.field} ${!numeric ? styles.nameField : ""}`} key={name}>
        <label htmlFor={name}>{label}{numeric && !isFrequency ? <span className={styles.currencyLabel}> USD</span> : ""}</label>
        <div className={styles.inputWrap}>
        {numeric && !isFrequency && <span className={styles.prefix} aria-hidden="true">$</span>}
        <input
          id={name}
          type={numeric ? "number" : "text"}
          inputMode={numeric ? (isFrequency ? "numeric" : "decimal") : undefined}
          min={numeric ? 0 : undefined}
          max={numeric ? (isFrequency ? 1000 : MAX_AMOUNT) : undefined}
          step={numeric ? (isFrequency ? 1 : 0.01) : undefined}
          maxLength={numeric ? undefined : 80}
          required
          value={fields[name]}
          onChange={(event) => update(name, event.target.value)}
          aria-invalid={Boolean(errors[name])}
          aria-describedby={errors[name] ? `${name}-error` : hint ? `${name}-hint` : "calculator-hint"}
          className={numeric && !isFrequency ? styles.currencyInput : undefined}
        />
        {isFrequency && <span className={styles.suffix} aria-hidden="true">/ week</span>}
        </div>
        {errors[name] ? <span className={styles.fieldError} id={`${name}-error`}>{errors[name]}</span> : hint && <span className={styles.fieldHint} id={`${name}-hint`}>{hint}</span>}
      </div>
    );
  }

  return (
    <article className={`goal-card ${styles.workspace}`} id="goallens" aria-labelledby="calculator-heading" tabIndex={-1}>
      <div className={styles.header}>
        <div className={styles.product}><span className={styles.productIcon}><Icon name="target" size={23} /></span><div><h2 id="calculator-heading">GoalLens</h2><p>A clearer view of your next decision</p></div></div>
        <span className={styles.liveBadge}><span /> Live calculation</span>
      </div>
      <div className={styles.modes} role="group" aria-label="Calculator mode">
        <span className={styles.modeIndicator} style={{ transform: `translateX(${modes.findIndex((item) => item.value === mode) * 100}%)` }} aria-hidden="true" />
        {modes.map((item) => <button type="button" key={item.value} aria-pressed={mode === item.value} onClick={() => { setMode(item.value); setMessage(""); }}><Icon name={item.value === "purchase" ? "wallet" : item.value === "recurring" ? "clock" : "branch"} size={17} />{item.label}</button>)}
      </div>
      <div className={`calculator-body ${styles.body}`}>
      <form className={`calculator-input-panel ${styles.form}`} aria-label="Your purchase and savings goal" onSubmit={(event) => { event.preventDefault(); save(); }}>
        <p className={styles.hint} id="calculator-hint">Change any value to see the trade-off. All amounts are in USD.</p>
        <fieldset><legend><span>01</span>{mode === "recurring" ? "Your recurring expense" : mode === "compare" ? "Your two options" : "Your purchase"}</legend><div className={styles.fields}>{purchaseFields.map(renderField)}</div></fieldset>
        <fieldset><legend><span>02</span>Your savings goal</legend><div className={styles.fields}>{goalFields.map(renderField)}</div></fieldset>
        <p className={styles.inputNote}><Icon name="info" size={16} /> Start with the example, or make it your own.</p>
      </form>

      <div className={`calculator-output-panel ${styles.results}`} data-pointer-light aria-live="polite" aria-atomic="true">
        {!valid && <div className={styles.validation}><Icon name="target" size={38} /><h3>Your next insight starts here.</h3><p>{hasErrors ? "Check the highlighted fields to calculate and save your comparison." : calculationError}</p></div>}
        {valid && !("error" in first) && (
          <>
            <div className={styles.resultEyebrow}><span>Your decision, in perspective</span><Icon name="spark" size={17} /></div>
            {mode !== "compare" ? <div className={styles.headline}><p>Potential delay to your goal</p><strong>+<AnimatedNumber value={first.extraWeeks} /> <span>{first.extraWeeks === 1 ? "week" : "weeks"}</span></strong><span className={styles.impactBadge} data-impact={impactLevel(first.extraWeeks)}><span />{impactLevel(first.extraWeeks)} timeline impact</span></div> : <div className={styles.compareHeadline}><h3>Two choices.<br /><span>One bigger picture.</span></h3><p>See the time each option adds to the same goal.</p></div>}
            <div className={styles.savingsGoal}>
              <div className={styles.goalHeading}><h3><Icon name="target" size={17} />{goal}</h3><span>{first.progress}% saved</span></div>
              <div className={styles.progress} role="progressbar" aria-label={`${goal} savings`} aria-valuenow={first.progress} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${first.progress}%` }} /></div>
              <div className={styles.amounts}><span>{usd.format(inputs.amountSaved)} saved</span><span>{usd.format(inputs.goalPrice)} goal</span></div>
              {mode === "compare" && !("error" in second) ? (
                <>
                  <div className={styles.comparisonGrid}>
                    {[{ name: purchase, price, result: first }, { name: fields.secondName.trim(), price: Number(fields.secondPrice), result: second }].map((option, index) => (
                      <div className={styles.comparisonOption} key={index}>
                        <span className={styles.optionLabel}>Option {index === 0 ? "A" : "B"}</span><h4>{option.name}</h4><p>{usd.format(option.price)}</p>
                        <strong>+<AnimatedNumber value={option.result.extraWeeks} /></strong><span className={styles.optionLabel}>extra {option.result.extraWeeks === 1 ? "week" : "weeks"}</span>
                        <span className={styles.impactBadge} data-impact={impactLevel(option.result.extraWeeks)}>{impactLevel(option.result.extraWeeks)} impact</span>
                      </div>
                    ))}
                  </div>
                  <DecisionTimeline baseline={first.withoutPurchase} options={[{ name: purchase, weeks: first.withPurchase }, { name: fields.secondName.trim(), weeks: second.withPurchase }]} />
                </>
              ) : (
                <>
                  {mode === "recurring" && "yearlyCost" in recurring && <div className={styles.recurringTotals}><div><span>Monthly average</span><strong><AnimatedNumber value={recurring.monthlyCost} format="currency" /></strong></div><div><span>Yearly cost</span><strong><AnimatedNumber value={recurring.yearlyCost} format="currency" /></strong></div></div>}
                  <DecisionTimeline baseline={first.withoutPurchase} options={[{ name: mode === "recurring" ? "With recurring expense" : "With purchase", weeks: first.withPurchase }]} />
                </>
              )}
            </div>
            <div className={styles.impactNote}><Icon name="branch" size={19} /><p>
              {mode === "compare" && !("error" in second)
                ? first.extraWeeks === second.extraWeeks
                  ? `Both options add ${weeks(first.extraWeeks)} to your ${goal} goal at this savings rate.`
                  : `${first.extraWeeks < second.extraWeeks ? purchase : fields.secondName.trim()} gets you to your ${goal} goal ${weeks(Math.abs(first.extraWeeks - second.extraWeeks))} sooner than the other option.`
                : mode === "recurring"
                  ? `After this recurring expense, ${"netWeeklySavings" in recurring ? usd.format(recurring.netWeeklySavings) : "—"} goes toward your goal each week. The modeled delay is ${weeks(first.extraWeeks)}.`
                  : `Buying ${purchase} for ${usd.format(price)} could add ${weeks(first.extraWeeks)} to your ${goal} goal.`}
            </p></div>
            <p className={styles.impactKey}>Weekly deposits are counted at the end of each week, starting one week from now. These are rounded deposit counts, not continuous-time estimates. {mode !== "recurring" && "Spending beyond current savings is hypothetical future spending, not a claim of affordability or an assumption of borrowing."}</p>
            <p className={styles.impactKey}>Timeline impact: low ≤ 2 extra weeks · moderate 3–8 · high 9+. These labels describe delay, not whether a purchase is right for you.</p>
          </>
        )}
      </div>
      </div>

      <div className={`calculator-bottom ${styles.bottom}`}>
      <div className={styles.actionRow}><div className={styles.actions}><button className="button-primary" type="button" disabled={!valid} onClick={save}><Icon name="plus" size={17} />Save comparison</button><button className="button-outline" type="button" onClick={reset}>Reset example</button></div><Link className={styles.savedLink} href="/dashboard#saved-decisions">Saved GoalLens comparisons <Icon name="arrow" size={17} /></Link></div>
      <p className={`${styles.message} ${message.startsWith("Comparison saved") ? styles.success : ""}`} role="status">{message && <span key={saveCount}>{message.startsWith("Comparison saved") && <Icon name="check" size={18} />}{message}</span>}</p>
      <details className={styles.calculation}>
        <summary><span><Icon name="grid" size={17} />How the math works</span><Icon name="plus" size={17} /></summary>
        <div className={styles.formulaGrid}>
        <div>
        <p>Remaining money = max(0, goal price − already saved). Weeks without buying = remaining money ÷ weekly savings, rounded up. Weeks with buying = max(0, goal price − already saved + purchase price) ÷ weekly savings, rounded up. Savings above the target can absorb some or all of the purchase. Extra weeks = the difference between these timelines.</p>
        <p>Progress = already saved ÷ goal price × 100. A goal costing {usd.format(0)} is already complete and has no delay. Both purchase options use the same goal and weekly savings.</p>
        </div><div>
        <p>Recurring yearly cost = cost per purchase × purchases per week × 52. Monthly average = yearly cost ÷ 12. Weekly expense = cost × weekly frequency. Net contribution = weekly savings BEFORE this expense − weekly expense. Completion = remaining money ÷ net contribution, rounded up. A nonpositive net contribution cannot reach an unfinished goal. Annual spending is context, not the delay formula.</p>
        <p><TermTip term="Opportunity cost">The value of the next best alternative you give up when making a choice. Here, that alternative is progress toward your savings goal.</TermTip> is the progress you give up by spending the same money elsewhere. These estimates assume the same savings rate, with no interest or price changes.</p>
        </div></div>
      </details>
      </div>
    </article>
  );
}
