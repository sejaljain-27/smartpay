import express from "express";
import pool from "../db.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

/**
 * Shared SMS processing logic (UNCHANGED)
 */
async function processSMS({ sms_body, user_id }) {
  // 1. Extract amount
  const amountMatch = sms_body.match(/(?:Rs\.?|INR|₹)\s?([\d,]+(\.\d{1,2})?)/i);
  if (!amountMatch) {
    throw new Error("Amount not found in SMS");
  }
  const amount = parseFloat(amountMatch[1].replace(/,/g, ""));

  // 2. Detect credit / debit
  let type = "debited";
  const lower = sms_body.toLowerCase();
  if (
    lower.includes("credited") ||
    lower.includes("received") ||
    lower.includes("refund") ||
    lower.includes("cashback")
  ) {
    type = "credited";
  }

  // 3. Detect merchant
  let merchant = "Unknown";
  if (/zomato/i.test(sms_body)) merchant = "Zomato";
  else if (/swiggy/i.test(sms_body)) merchant = "Swiggy";
  else if (/amazon/i.test(sms_body)) merchant = "Amazon";
  else if (/flipkart/i.test(sms_body)) merchant = "Flipkart";
  else if (/uber/i.test(sms_body)) merchant = "Uber";
  else if (/ola/i.test(sms_body)) merchant = "Ola";
  else if (/blinkit/i.test(sms_body)) merchant = "Blinkit";

  // 4. Categorize
  let category = "Others";
  if (["Zomato", "Swiggy", "Blinkit"].includes(merchant)) category = "Food";
  else if (["Amazon", "Flipkart"].includes(merchant)) category = "Shopping";
  else if (["Uber", "Ola"].includes(merchant)) category = "Transport";

  // 5. Final amount sign
  const finalAmount =
    type === "credited" ? Math.abs(amount) : -Math.abs(amount);

  // 6. Extract Bank Name & Available Balance (NEW)
  let bankName = null;
  let availableBalance = null;

  // Regex for Available Balance: "Avl Bal: INR 15,600.00"
  const balMatch = sms_body.match(/(?:Avl|Avbl)\s?Bal:?\s?(?:Rs\.?|INR|₹)?\s?([\d,]+(\.\d{1,2})?)/i);
  if (balMatch) {
    availableBalance = parseFloat(balMatch[1].replace(/,/g, ""));
  }

  // Regex for Bank Name: "- HDFC BANK" at end or "from HDFC Bank"
  // Try extracting from footer first: "- BANKNAME"
  // Regex for Bank Name: "- HDFC BANK" at end of string
  // Must be at the very end, to avoid matching dates like "05-Feb-2026"
  const footerMatch = sms_body.match(/-\s*([A-Za-z\s]+)$/);
  if (footerMatch) {
    const potentialName = footerMatch[1].trim();
    if (potentialName.length > 2) bankName = potentialName;
  }

  if (!bankName) {
    // Fallback: "from HDFC Bank"
    const fromMatch = sms_body.match(/from\s+([A-Za-z\s]+)\s+Bank/i);
    if (fromMatch) {
      bankName = fromMatch[1].trim();
    }
  }

  // 7. Save to DB
  await pool.query(
    `
    INSERT INTO transactions
    (user_id, amount, text, type, category, bank_name, available_balance, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    `,
    [
      user_id,
      finalAmount,
      merchant !== "Unknown" ? merchant : sms_body.slice(0, 50),
      type,
      category,
      bankName,
      availableBalance
    ]
  );

  return {
    amount,
    type,
    merchant,
    category,
    bankName,
    availableBalance
  };
}

/**
 * App / Automate SMS
 * Accepts:
 * - text/plain (raw SMS)
 * - application/json { sms_body, user_id }
 */
router.post("/ingest", authMiddleware, async (req, res) => {
  console.log("/sms/ingest HIT");
  console.log("Headers:", req.headers);
  console.log("Body:", req.body);
  try {
    // SUPPORT BOTH FORMATS
    const sms_body =
      typeof req.body === "string"
        ? req.body
        : req.body?.sms_body;

    if (!sms_body) {
      return res.status(400).json({ error: "SMS body missing" });
    }

    const userId = req.user.id;

    const result = await processSMS({
      sms_body,
      user_id: userId
    });

    console.log("SMS INGESTED:", result);

    res.json({ status: "saved", ...result });
  } catch (err) {
    console.error("SMS INGEST ERROR:", err.message);
    res.status(400).json({ error: err.message });
  }
});

/**
 *  Manual paste SMS (Add via SMS button)
 * application/json only
 */
router.post("/manual", authMiddleware, async (req, res) => {
  try {
    const { sms_text } = req.body;

    if (!sms_text) {
      return res.status(400).json({ error: "sms_text missing" });
    }

    const userId = req.user.id;

    const result = await processSMS({
      sms_body: sms_text,
      user_id: userId
    });

    res.json({ status: "saved", ...result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;