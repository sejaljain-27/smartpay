const sms_body = "INR 1,200.00 credited to A/c XXXX5678 via UPI from Paytm on 05-Feb-2026 at 19:40. Avl Bal: INR 15,600.00. - HDFC BANK";

let bankName = null;

// Regex for Bank Name: "- HDFC BANK" at end of string
// Must be at the very end, to avoid matching dates like "05-Feb-2026"
const footerMatch = sms_body.match(/-\s*([A-Za-z\s]+)$/);
console.log("Footer match:", footerMatch);

if (footerMatch) {
    const potentialName = footerMatch[1].trim();
    if (potentialName.length > 2) bankName = potentialName;
}

if (!bankName) {
    // Fallback: "from HDFC Bank"
    const fromMatch = sms_body.match(/from\s+([A-Za-z\s]+)\s+Bank/i);
    console.log("From match:", fromMatch);
    if (fromMatch) {
        bankName = fromMatch[1].trim();
    }
}

console.log("Extracted Bank Name:", bankName);
