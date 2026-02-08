export function categorizeTransaction(text = "") {
  const t = text.toLowerCase();

  if (t.includes("swiggy") || t.includes("zomato")) return "Food";
  if (t.includes("uber") || t.includes("ola")) return "Transport";
  if (t.includes("amazon") || t.includes("flipkart")) return "Shopping";
  if (t.includes("atm")) return "Cash Withdrawal";
  if (t.includes("upi")) return "Transfer";

  return "Other";
}

