package com.smartpay.android.data.network

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

class SessionManager(context: Context) {
    private val masterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()

    private val sharedPreferences = EncryptedSharedPreferences.create(
        context,
        "smartpay_secure_prefs",
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    fun saveAuthToken(token: String) {
        sharedPreferences.edit().putString("JWT_TOKEN", token).apply()
    }

    fun fetchAuthToken(): String? {
        return sharedPreferences.getString("JWT_TOKEN", null)
    }

    fun logout() {
        sharedPreferences.edit().remove("JWT_TOKEN").apply()
    }

    fun saveServerUrl(url: String) {
        sharedPreferences.edit().putString("SERVER_URL", url).apply()
    }

    fun fetchServerUrl(): String {
        return sharedPreferences.getString("SERVER_URL", "http://10.0.2.2:3000/") ?: "http://10.0.2.2:3000/"
    }
}
