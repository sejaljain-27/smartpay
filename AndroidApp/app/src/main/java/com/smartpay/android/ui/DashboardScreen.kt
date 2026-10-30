package com.smartpay.android.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.smartpay.android.data.network.RetrofitClient
import com.smartpay.android.data.network.SessionManager
import com.smartpay.android.data.network.TransactionDto
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

@Composable
fun DashboardScreen(
    sessionManager: SessionManager,
    onNavigateToReview: () -> Unit,
    onNavigateToHistory: () -> Unit,
    onNavigateToManual: () -> Unit
) {
    var transactions by remember { mutableStateOf<List<TransactionDto>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    val coroutineScope = rememberCoroutineScope()

    fun loadData() {
        val token = sessionManager.fetchAuthToken() ?: return
        isLoading = true
        coroutineScope.launch {
            try {
                val response = withContext(Dispatchers.IO) {
                    RetrofitClient.apiService.getTransactions("Bearer $token")
                }
                if (response.isSuccessful && response.body() != null) {
                    transactions = response.body()!!
                } else {
                    errorMessage = "Failed to load transactions"
                }
            } catch (e: Exception) {
                errorMessage = "Error: ${e.localizedMessage}"
            } finally {
                isLoading = false
            }
        }
    }

    LaunchedEffect(Unit) {
        loadData()
    }

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
                    text = "SmartPay Dashboard",
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.Bold
                )
                Button(onClick = { loadData() }) {
                    Text("Refresh")
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Quick Actions Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "SMS Transaction Detector",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Detect and review financial SMS transactions or add them manually.",
                        style = MaterialTheme.typography.bodyMedium
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Button(onClick = onNavigateToReview, modifier = Modifier.weight(1f)) {
                            Text("Review SMS")
                        }
                        OutlinedButton(onClick = onNavigateToManual, modifier = Modifier.weight(1f)) {
                            Text("Manual Entry")
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            Text(
                text = "Recent Transactions",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(8.dp))

            when {
                isLoading -> {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator()
                    }
                }
                errorMessage != null -> {
                    Text(text = errorMessage!!, color = MaterialTheme.colorScheme.error)
                }
                transactions.isEmpty() -> {
                    Text(
                        text = "No transactions found. Scan SMS or add manually.",
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                else -> {
                    LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        items(transactions) { txn ->
                            TransactionItemCard(txn)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun TransactionItemCard(txn: TransactionDto) {
    val isCredit = txn.type == "credited" || txn.amount > 0
    val amountColor = if (isCredit) Color(0xFF2E7D32) else Color(0xFFC62828)
    val sign = if (isCredit) "+" else ""

    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = txn.text,
                    style = MaterialTheme.typography.bodyLarge,
                    fontWeight = FontWeight.SemiBold
                )
                Spacer(modifier = Modifier.height(4.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Badge { Text(txn.category) }
                    if (!txn.bankName.isNullOrBlank()) {
                        Badge(containerColor = MaterialTheme.colorScheme.secondaryContainer) {
                            Text(txn.bankName!!)
                        }
                    }
                }
            }
            Text(
                text = "$sign₹${String.format("%.2f", kotlin.math.abs(txn.amount))}",
                style = MaterialTheme.typography.titleMedium,
                color = amountColor,
                fontWeight = FontWeight.Bold
            )
        }
    }
}
