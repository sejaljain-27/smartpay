package com.smartpay.android

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.runtime.*
import com.smartpay.android.data.network.RetrofitClient
import com.smartpay.android.data.network.SessionManager
import com.smartpay.android.ui.*

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val sessionManager = SessionManager(applicationContext)
        RetrofitClient.baseUrl = sessionManager.fetchServerUrl()

        setContent {
            var currentScreen by remember {
                mutableStateOf(if (sessionManager.fetchAuthToken() != null) "dashboard" else "login")
            }

            when (currentScreen) {
                "login" -> LoginScreen(
                    sessionManager = sessionManager,
                    onLoginSuccess = { currentScreen = "dashboard" }
                )
                "dashboard" -> DashboardScreen(
                    sessionManager = sessionManager,
                    onNavigateToReview = { currentScreen = "review" },
                    onNavigateToHistory = { currentScreen = "history" },
                    onNavigateToManual = { currentScreen = "manual" }
                )
                "review" -> ReviewScreen(
                    sessionManager = sessionManager,
                    onBack = { currentScreen = "dashboard" }
                )
                "history" -> HistoryScreen(
                    sessionManager = sessionManager,
                    onBack = { currentScreen = "dashboard" }
                )
                "manual" -> ManualEntryScreen(
                    sessionManager = sessionManager,
                    onBack = { currentScreen = "dashboard" }
                )
            }
        }
    }
}
