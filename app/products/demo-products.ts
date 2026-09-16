import type { ProductAnalysis } from "./product-model";
const base: ProductAnalysis = {
  name: "Fictional new laptop", model: "Example only", category: "technology", customCategory: "", condition: "new", currency: "USD",
  price: 1200, tax: 0, shipping: 0, duration: 4, durationUnit: "years", uses: 5, useFrequency: "week",
  maintenanceYearly: 30, accessories: 80, subscription: 0, subscriptionFrequency: "month", repairs: 100, resale: 250,
  purpose: "Everyday projects and work — fictional demonstration", replaces: true, importance: 4, usefulness: 4,
  alternative: null, nextBestUse: "Keep money available for another priority", goal: null,
};
export const demoGroups: { name: string; products: ProductAnalysis[] }[] = [
  { name: "New vs refurbished laptop", products: [base, { ...base, name: "Fictional refurbished laptop", condition: "refurbished", price: 700, duration: 3, maintenanceYearly: 45, repairs: 150, resale: 120 }] },
  { name: "Premium vs cheaper shoes", products: [{ ...base, name: "Fictional premium shoes", category: "clothing", price: 180, duration: 3, uses: 3, maintenanceYearly: 15, accessories: 0, repairs: 30, resale: 0, purpose: "Regular walking", replaces: false }, { ...base, name: "Fictional cheaper shoes", category: "clothing", price: 65, duration: 1, uses: 3, maintenanceYearly: 5, accessories: 0, repairs: 0, resale: 0, purpose: "Regular walking", replaces: false }] },
  { name: "Camera and ownership costs", products: [{ ...base, name: "Fictional camera body", category: "hobby", price: 900, duration: 5, uses: 4, useFrequency: "month", maintenanceYearly: 20, accessories: 400, subscription: 8, repairs: 120, resale: 350, purpose: "Personal photography", replaces: false }] },
];
