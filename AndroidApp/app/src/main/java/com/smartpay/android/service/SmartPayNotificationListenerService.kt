package com.smartpay.android.service

import android.app.Notification
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log
import com.smartpay.android.data.network.MockDataSource
import com.smartpay.android.data.network.RetrofitClient
import com.smartpay.android.data.network.SaveTransactionRequest
import com.smartpay.android.data.network.SessionManager
import com.smartpay.android.data.network.TransactionDto
import com.smartpay.android.data.parser.SmsParser
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class SmartPayNotificationListenerService : NotificationListenerService() {

    private val serviceScope = CoroutineScope(Dispatchers.IO)

    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        super.onNotificationPosted(sbn)
        if (sbn == null) return

        val extras = sbn.notification.extras
        val title = extras.getCharSequence(Notification.EXTRA_TITLE)?.toString() ?: ""
        val text = extras.getCharSequence(Notification.EXTRA_TEXT)?.toString() 
            ?: extras.getCharSequence(Notification.EXTRA_BIG_TEXT)?.toString() 
            ?: ""

        val fullMessage = "$title $text"
        if (fullMessage.isBlank()) return

        // Quick pre-check for financial/transaction keywords to avoid processing every notification
        val lower = fullMessage.lowercase()
        if (!(lower.contains("rs") || lower.contains("inr") || lower.contains("₹") || 
              lower.contains("debited") || lower.contains("credited") || lower.contains("spent") || 
              lower.contains("paid") || lower.contains("received"))) {
            return
        }

        val parsed = SmsParser.parse(fullMessage)
        if (!parsed.isValidTransaction) return

        Log.d("SmartPayListener", "Detected transaction from notification: ${parsed.amount} at ${parsed.merchant}")

        val sessionManager = SessionManager(applicationContext)
        val token = sessionManager.fetchAuthToken() ?: return

        serviceScope.launch {
            if (token == "demo_token_12345") {
                withContext(Dispatchers.Main) {
                    MockDataSource.transactions.add(
                        0,
                        TransactionDto(
                            id = MockDataSource.transactions.size + 1,
                            amount = parsed.amount,
                            text = parsed.merchant,
                            type = parsed.type,
                            category = parsed.category,
                            bankName = parsed.bankName ?: "Auto SMS",
                            createdAt = "Just now"
                        )
                    )
                }
                return@launch
            }

            try {
                val response = RetrofitClient.apiService.saveTransaction(
                    "Bearer $token",
                    SaveTransactionRequest(
                        amount = parsed.amount,
                        text = parsed.merchant,
                        type = parsed.type,
                        category = parsed.category
                    )
                )
                if (response.isSuccessful) {
                    Log.d("SmartPayListener", "Successfully synced auto-detected transaction to backend.")
                } else {
                    Log.e("SmartPayListener", "Failed to sync transaction to backend: ${response.code()}")
                    // Fallback to local mock source so frontend shows it
                    withContext(Dispatchers.Main) {
                        MockDataSource.transactions.add(
                            0,
                            TransactionDto(
                                id = MockDataSource.transactions.size + 1,
                                amount = parsed.amount,
                                text = parsed.merchant,
                                type = parsed.type,
                                category = parsed.category,
                                bankName = parsed.bankName ?: "Auto SMS",
                                createdAt = "Just now"
                            )
                        )
                    }
                }
            } catch (e: Exception) {
                Log.e("SmartPayListener", "Error syncing auto-detected transaction", e)
                withContext(Dispatchers.Main) {
                    MockDataSource.transactions.add(
                        0,
                        TransactionDto(
                            id = MockDataSource.transactions.size + 1,
                            amount = parsed.amount,
                            text = parsed.merchant,
                            type = parsed.type,
                            category = parsed.category,
                            bankName = parsed.bankName ?: "Auto SMS",
                            createdAt = "Just now"
                        )
                    )
                }
            }
        }
    }
}
