export type SavingsInputs = {
  purchasePrice: number;
  goalPrice: number;
  amountSaved: number;
  weeklySavings: number;
};

export const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export const MAX_AMOUNT = 1_000_000_000;

export function moneyError(value: number): string | undefined {
  if (!Number.isFinite(value) || value < 0 || value > MAX_AMOUNT) {
    return `Enter an amount between ${usd.format(0)} and ${usd.format(MAX_AMOUNT)}.`;
  }
  if (Math.abs(value * 100 - Math.round(value * 100)) > 0.0001) {
    return "Use no more than two decimal places for dollar amounts.";
  }
}

export function calculateSavings(inputs: SavingsInputs) {
  const values = Object.values(inputs);
  const error = values.map(moneyError).find(Boolean);
  if (error) return { error };

  // Work in cents so decimal dollars do not add an extra week through rounding errors.
  const purchase = Math.round(inputs.purchasePrice * 100);
  const goal = Math.round(inputs.goalPrice * 100);
  const saved = Math.round(inputs.amountSaved * 100);
  const weekly = Math.round(inputs.weeklySavings * 100);

  if (weekly === 0) {
    return { error: `Add a weekly savings amount greater than ${usd.format(0)} to see your timeline.` };
  }

  const withoutPurchase = Math.ceil(Math.max(0, goal - saved) / weekly);
  // The purchase uses the same budget as the goal, including future savings if needed.
  const withPurchase = goal === 0 ? 0 : Math.ceil(Math.max(0, goal - saved + purchase) / weekly);
  const extraWeeks = withPurchase - withoutPurchase;
  const progress = goal === 0 ? 100 : Math.min(100, Math.round((saved / goal) * 1000) / 10);

  return { withoutPurchase, withPurchase, extraWeeks, progress };
}

export function calculateRecurring(
  inputs: Omit<SavingsInputs, "purchasePrice"> & { costPerPurchase: number; frequency: number },
) {
  const error = moneyError(inputs.costPerPurchase);
  if (error) return { error };
  if (!Number.isInteger(inputs.frequency) || inputs.frequency < 0 || inputs.frequency > 1000) {
    return { error: "Enter a whole-number frequency from 0 to 1,000 purchases per week." };
  }
  const yearlyCost = Math.round(inputs.costPerPurchase * 100) * inputs.frequency * 52 / 100;
  if (yearlyCost > MAX_AMOUNT) {
    return { error: `Lower the cost or frequency so yearly spending stays below ${usd.format(MAX_AMOUNT)}.` };
  }
  const result = calculateSavings({ ...inputs, purchasePrice: 0 });
  if ("error" in result) return result;
  // Weekly savings is BEFORE this expense; subtract it exactly once.
  const weeklyCostCents = Math.round(inputs.costPerPurchase * 100) * inputs.frequency;
  const netCents = Math.round(inputs.weeklySavings * 100) - weeklyCostCents;
  const remainingCents = Math.max(0, Math.round(inputs.goalPrice * 100) - Math.round(inputs.amountSaved * 100));
  if (remainingCents > 0 && netCents <= 0) {
    return { error: "Goal cannot be reached under these assumptions. Recurring spending leaves no positive weekly contribution." };
  }
  const withPurchase = remainingCents === 0 ? 0 : Math.ceil(remainingCents / netCents);
  return { ...result, withPurchase, extraWeeks: withPurchase - result.withoutPurchase,
    yearlyCost, monthlyCost: yearlyCost / 12, weeklyCost: weeklyCostCents / 100, netWeeklySavings: netCents / 100 };
}
