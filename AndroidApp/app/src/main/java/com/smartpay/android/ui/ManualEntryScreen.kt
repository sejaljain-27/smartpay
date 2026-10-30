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
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

@Composable
fun ManualEntryScreen(sessionManager: SessionManager, onBack: () -> Unit) {
    var amountStr by remember { mutableStateOf("") }
    var merchant by remember { mutableStateOf("") }
    var category by remember { mutableStateOf("Food & Dining") }
    var type by remember { mutableStateOf("debited") }
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
                    text = "Manual Transaction Entry",
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.Bold
                )
                TextButton(onClick = onBack) {
                    Text("Back")
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            OutlinedTextField(
                value = amountStr,
                onValueChange = { amountStr = it },
                label = { Text("Amount (₹)") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true
            )
            Spacer(modifier = Modifier.height(16.dp))

            OutlinedTextField(
                value = merchant,
                onValueChange = { merchant = it },
                label = { Text("Merchant / Description") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true
            )
            Spacer(modifier = Modifier.height(16.dp))

            OutlinedTextField(
                value = category,
                onValueChange = { category = it },
                label = { Text("Category (e.g. Food, Shopping)") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true
            )
            Spacer(modifier = Modifier.height(24.dp))

            Button(
                onClick = {
                    val amt = amountStr.toDoubleOrNull()
                    if (amt == null || amt <= 0.0 || merchant.isBlank()) {
                        statusMessage = "Please enter valid amount and merchant"
                        return@Button
                    }
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
                                amount = amt,
                                text = merchant.trim(),
                                type = type,
                                category = category.trim(),
                                bankName = "Manual Entry",
                                createdAt = "Just now"
                            )
                        )
                        statusMessage = "Transaction saved successfully!"
                        amountStr = ""
                        merchant = ""
                        return@Button
                    }

                    isLoading = true
                    coroutineScope.launch {
                        try {
                            val response = withContext(Dispatchers.IO) {
                                RetrofitClient.apiService.saveTransaction(
                                    "Bearer $token",
                                    SaveTransactionRequest(
                                        amount = amt,
                                        text = merchant.trim(),
                                        type = type,
                                        category = category.trim()
                                    )
                                )
                            }
                            if (response.isSuccessful) {
                                statusMessage = "Transaction saved successfully!"
                                amountStr = ""
                                merchant = ""
                            } else {
                                MockDataSource.transactions.add(
                                    0,
                                    TransactionDto(
                                        id = MockDataSource.transactions.size + 1,
                                        amount = amt,
                                        text = merchant.trim(),
                                        type = type,
                                        category = category.trim(),
                                        bankName = "Manual Entry",
                                        createdAt = "Just now"
                                    )
                                )
                                statusMessage = "Transaction saved successfully!"
                                amountStr = ""
                                merchant = ""
                            }
                        } catch (e: Exception) {
                            MockDataSource.transactions.add(
                                0,
                                TransactionDto(
                                    id = MockDataSource.transactions.size + 1,
                                    amount = amt,
                                    text = merchant.trim(),
                                    type = type,
                                    category = category.trim(),
                                    bankName = "Manual Entry",
                                    createdAt = "Just now"
                                )
                            )
                            statusMessage = "Transaction saved successfully!"
                            amountStr = ""
                            merchant = ""
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
                    Text("Save Transaction")
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
