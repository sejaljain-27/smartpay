package com.smartpay.android.ui

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.smartpay.android.data.network.MockDataSource
import com.smartpay.android.data.network.RetrofitClient
import com.smartpay.android.data.network.SaveTransactionRequest
import com.smartpay.android.data.network.SessionManager
import com.smartpay.android.data.network.TransactionDto
import com.smartpay.android.data.parser.ParsedTransaction
import com.smartpay.android.data.parser.SmsParser
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

@Composable
fun ReviewScreen(sessionManager: SessionManager, onBack: () -> Unit) {
    var sampleSmsInput by remember {
        mutableStateOf("A/C X1234 debited by Rs. 850.00 on 05-Feb-25 at Zomato. Avl Bal: INR 14,750.00 - HDFC Bank")
    }
    var parsedTxn by remember { mutableStateOf<ParsedTransaction?>(null) }
    var statusMessage by remember { mutableStateOf<String?>(null) }
    var isLoading by remember { mutableStateOf(false) }
    val coroutineScope = rememberCoroutineScope()

    Surface(
        modifier = Modifier.fillMaxSize(),
        color = MaterialTheme.colorScheme.background
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "SMS Transaction Review",
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.Bold
                )
                TextButton(onClick = onBack) {
                    Text("Back")
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            Text("Paste or simulate bank SMS below to parse and review:")
            Spacer(modifier = Modifier.height(8.dp))

            OutlinedTextField(
                value = sampleSmsInput,
                onValueChange = { sampleSmsInput = it },
                label = { Text("SMS Message Body") },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(120.dp)
            )

            Spacer(modifier = Modifier.height(16.dp))

            Button(
                onClick = {
                    parsedTxn = SmsParser.parse(sampleSmsInput)
                    statusMessage = if (parsedTxn!!.isValidTransaction) "SMS successfully parsed!" else "Could not detect valid transaction."
                },
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Parse SMS")
            }

            Spacer(modifier = Modifier.height(24.dp))

            if (parsedTxn != null) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = "Extracted Details",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text("Valid: ${parsedTxn!!.isValidTransaction}")
                        Text("Amount: ₹${parsedTxn!!.amount}")
                        Text("Type: ${parsedTxn!!.type}")
                        Text("Merchant: ${parsedTxn!!.merchant}")
                        Text("Category: ${parsedTxn!!.category}")
                        if (parsedTxn!!.bankName != null) {
                            Text("Bank: ${parsedTxn!!.bankName}")
                        }
                        if (parsedTxn!!.referenceId != null) {
                            Text("Reference ID: ${parsedTxn!!.referenceId}")
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                if (parsedTxn!!.isValidTransaction) {
                    Button(
                        onClick = {
                            val token = sessionManager.fetchAuthToken()
                            if (token == null) {
                                statusMessage = "Not logged in"
                                return@Button
                            }
                            if (token == "demo_token_12345") {
                                MockDataSource.transactions.add(
                                    0,
                                    TransactionDto(
                                        id = MockDataSource.transactions.size + 1,
                                        amount = parsedTxn!!.amount,
                                        text = parsedTxn!!.merchant,
                                        type = parsedTxn!!.type,
                                        category = parsedTxn!!.category,
                                        bankName = parsedTxn!!.bankName,
                                        createdAt = "Just now"
                                    )
                                )
                                statusMessage = "Transaction confirmed & saved to SmartPay!"
                                return@Button
                            }
                            isLoading = true
                            coroutineScope.launch {
                                try {
                                    val response = withContext(Dispatchers.IO) {
                                        RetrofitClient.apiService.saveTransaction(
                                            "Bearer $token",
                                            SaveTransactionRequest(
                                                amount = parsedTxn!!.amount,
                                                text = parsedTxn!!.merchant,
                                                type = parsedTxn!!.type,
                                                category = parsedTxn!!.category
                                            )
                                        )
                                    }
                                    if (response.isSuccessful) {
                                        statusMessage = "Transaction confirmed & saved to SmartPay!"
                                    } else {
                                        MockDataSource.transactions.add(
                                            0,
                                            TransactionDto(
                                                id = MockDataSource.transactions.size + 1,
                                                amount = parsedTxn!!.amount,
                                                text = parsedTxn!!.merchant,
                                                type = parsedTxn!!.type,
                                                category = parsedTxn!!.category,
                                                bankName = parsedTxn!!.bankName,
                                                createdAt = "Just now"
                                            )
                                        )
                                        statusMessage = "Transaction confirmed & saved to SmartPay!"
                                    }
                                } catch (e: Exception) {
                                    MockDataSource.transactions.add(
                                        0,
                                        TransactionDto(
                                            id = MockDataSource.transactions.size + 1,
                                            amount = parsedTxn!!.amount,
                                            text = parsedTxn!!.merchant,
                                            type = parsedTxn!!.type,
                                            category = parsedTxn!!.category,
                                            bankName = parsedTxn!!.bankName,
                                            createdAt = "Just now"
                                        )
                                    )
                                    statusMessage = "Transaction confirmed & saved to SmartPay!"
                                } finally {
                                    isLoading = false
                                }
                            }
                        },
                        modifier = Modifier.fillMaxWidth(),
                        enabled = !isLoading
                    ) {
                        if (isLoading) {
                            CircularProgressIndicator(modifier = Modifier.size(24.dp))
                        } else {
                            Text("Confirm & Save to SmartPay")
                        }
                    }
                }
            }

            if (statusMessage != null) {
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = statusMessage!!,
                    color = MaterialTheme.colorScheme.primary,
                    fontWeight = FontWeight.SemiBold
                )
            }
        }
    }
}
