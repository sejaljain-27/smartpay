package com.smartpay.android.data.parser

data class ParsedTransaction(
    val isValidTransaction: Boolean,
    val amount: Double = 0.0,
    val type: String = "debited", // "debited" or "credited"
    val merchant: String = "Unknown",
    val category: String = "Others",
    val date: String? = null,
    val referenceId: String? = null,
    val bankName: String? = null,
    val availableBalance: Double? = null,
    val rawMessage: String = ""
)

object SmsParser {

    fun parse(smsBody: String): ParsedTransaction {
        if (smsBody.isBlank()) {
            return ParsedTransaction(isValidTransaction = false, rawMessage = smsBody)
        }

        val lower = smsBody.lowercase()

        // 1. Filter out non-transactional / promotional / OTP messages
        val nonTransactionalKeywords = listOf(
            "otp", "one-time password", "code", "verification", "password is",
            "dear customer, your a/c", "alert: your password", "congratulations",
            "won", "scratch card", "click here", "loan approved", "pre-approved"
        )
        // Check if it's an OTP message explicitly
        if (lower.contains("otp") || lower.contains("verification code") || lower.contains("is your otp")) {
            return ParsedTransaction(isValidTransaction = false, rawMessage = smsBody)
        }

        // 2. Extract amount
        // Matches Rs. 100, INR 1,500.00, ₹500, etc.
        val amountRegex = Regex("(?:Rs\\.?|INR|₹)\\s?([\\d,]+(?:\\.\\d{1,2})?)", RegexOption.IGNORE_CASE)
        val amountMatch = amountRegex.find(smsBody)
        if (amountMatch == null) {
            return ParsedTransaction(isValidTransaction = false, rawMessage = smsBody)
        }

        val amountStr = amountMatch.groupValues[1].replace(",", "")
        val amount = amountStr.toDoubleOrNull() ?: 0.0
        if (amount <= 0.0) {
            return ParsedTransaction(isValidTransaction = false, rawMessage = smsBody)
        }

        // 3. Determine transaction type (debited vs credited)
        var type = "debited"
        if (lower.contains("credited") || 
            lower.contains("received") || 
            lower.contains("cashback") || 
            lower.contains("refund") || 
            lower.contains("deposit")) {
            type = "credited"
        } else if (lower.contains("debited") || 
                   lower.contains("spent") || 
                   lower.contains("paid") || 
                   lower.contains("deducted") ||
                   lower.contains("sent")) {
            type = "debited"
        }

        // 4. Extract Merchant / Counterparty
        var merchant = "Unknown"
        val knownMerchants = mapOf(
            "zomato" to "Zomato",
            "swiggy" to "Swiggy",
            "amazon" to "Amazon",
            "flipkart" to "Flipkart",
            "uber" to "Uber",
            "ola" to "Ola",
            "blinkit" to "Blinkit",
            "paytm" to "Paytm",
            "phonepe" to "PhonePe",
            "gpay" to "Google Pay",
            "google pay" to "Google Pay",
            "netflix" to "Netflix",
            "spotify" to "Spotify",
            "starbucks" to "Starbucks",
            "myntra" to "Myntra"
        )

        for ((key, name) in knownMerchants) {
            if (lower.contains(key)) {
                merchant = name
                break
            }
        }

        // 5. Categorize
        val category = when (merchant) {
            "Zomato", "Swiggy", "Blinkit", "Starbucks" -> "Food & Dining"
            "Amazon", "Flipkart", "Myntra" -> "Shopping"
            "Uber", "Ola" -> "Transport"
            "Netflix", "Spotify" -> "Entertainment"
            else -> if (type == "credited") "Income" else "Others"
        }

        // 6. Extract Reference / Transaction ID (UPI Ref, Txn ID, etc.)
        val refRegex = Regex("(?:upi ref|ref no|txn id|transaction id|utr|upi)\\s*[:\\-]?\\s*([a-zA-Z0-9]+)", RegexOption.IGNORE_CASE)
        val refMatch = refRegex.find(smsBody)
        val referenceId = refMatch?.groupValues?.get(1)

        // 7. Extract Bank Name
        var bankName: String? = null
        val footerMatch = Regex("-\\s*([A-Za-z\\s]+)$").find(smsBody) // or footer check
        // Simpler check for bank name in text
        val banks = listOf("HDFC", "ICICI", "SBI", "Axis", "Kotak", "PNB", "Bank of Baroda", "Paytm Bank")
        for (b in banks) {
            if (smsBody.contains(b, ignoreCase = true)) {
                bankName = b
                break
            }
        }

        // 8. Extract Available Balance
        val balRegex = Regex("(?:avl|avbl)\\s*bal:?\\s*(?:rs\\.?|inr|₹)?\\s*([\\d,]+(?:\\.\\d{1,2})?)", RegexOption.IGNORE_CASE)
        val balMatch = balRegex.find(smsBody)
        val availableBalance = balMatch?.groupValues?.get(1)?.replace(",", "")?.toDoubleOrNull()

        return ParsedTransaction(
            isValidTransaction = true,
            amount = amount,
            type = type,
            merchant = merchant,
            category = category,
            referenceId = referenceId,
            bankName = bankName,
            availableBalance = availableBalance,
            rawMessage = smsBody
        )
    }
}
