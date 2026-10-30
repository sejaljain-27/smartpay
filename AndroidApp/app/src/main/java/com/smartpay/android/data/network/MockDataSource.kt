package com.smartpay.android.data.network

object MockDataSource {
    val transactions = mutableListOf(
        TransactionDto(id = 1, amount = 850.0, text = "Zomato", type = "debited", category = "Food & Dining", bankName = "HDFC Bank", createdAt = "2026-02-05"),
        TransactionDto(id = 2, amount = 2499.0, text = "Amazon India", type = "debited", category = "Shopping", bankName = "ICICI Bank", createdAt = "2026-02-04"),
        TransactionDto(id = 3, amount = 15000.0, text = "Salary Credited", type = "credited", category = "Income", bankName = "HDFC Bank", createdAt = "2026-02-01")
    )
}
