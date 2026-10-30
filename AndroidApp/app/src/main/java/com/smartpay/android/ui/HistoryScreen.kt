package com.smartpay.android.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.smartpay.android.data.network.MockDataSource
import com.smartpay.android.data.network.RetrofitClient
import com.smartpay.android.data.network.SessionManager
import com.smartpay.android.data.network.TransactionDto
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

@Composable
fun HistoryScreen(sessionManager: SessionManager, onBack: () -> Unit) {
    var transactions by remember { mutableStateOf<List<TransactionDto>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    val coroutineScope = rememberCoroutineScope()

    LaunchedEffect(Unit) {
        val token = sessionManager.fetchAuthToken()
        if (token == null) {
            errorMessage = "Not logged in"
            isLoading = false
            return@LaunchedEffect
        }
        if (token == "demo_token_12345") {
            transactions = MockDataSource.transactions.toList()
            isLoading = false
            return@LaunchedEffect
        }
        coroutineScope.launch {
            try {
                val response = withContext(Dispatchers.IO) {
                    RetrofitClient.apiService.getTransactions("Bearer $token")
                }
                if (response.isSuccessful && response.body() != null) {
                    transactions = response.body()!!
                } else {
                    transactions = MockDataSource.transactions.toList()
                }
            } catch (e: Exception) {
                transactions = MockDataSource.transactions.toList()
            } finally {
                isLoading = false
            }
        }
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
                    text = "Transaction History",
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.Bold
                )
                TextButton(onClick = onBack) {
                    Text("Back")
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

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
                        text = "No saved transactions found.",
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
