package com.smartpay.android.data.network

import com.google.gson.annotations.SerializedName
import okhttp3.ResponseBody
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST
import retrofit2.http.Query

data class LoginRequest(
    @SerializedName("email") val email: String,
    @SerializedName("password") val password: String
)

data class LoginResponse(
    @SerializedName("token") val token: String,
    @SerializedName("user") val user: UserDto?
)

data class UserDto(
    @SerializedName("id") val id: Int,
    @SerializedName("email") val email: String,
    @SerializedName("name") val name: String?
)

data class TransactionDto(
    @SerializedName("id") val id: Int?,
    @SerializedName("amount") val amount: Double,
    @SerializedName("text") val text: String,
    @SerializedName("type") val type: String,
    @SerializedName("category") val category: String,
    @SerializedName("bank_name") val bankName: String?,
    @SerializedName("created_at") val createdAt: String?
)

data class SaveTransactionRequest(
    @SerializedName("amount") val amount: Double,
    @SerializedName("text") val text: String,
    @SerializedName("type") val type: String,
    @SerializedName("category") val category: String
)

interface ApiService {

    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): Response<LoginResponse>

    @GET("transactions")
    suspend fun getTransactions(@Header("Authorization") token: String): Response<List<TransactionDto>>

    @POST("transactions")
    suspend fun saveTransaction(
        @Header("Authorization") token: String,
        @Body request: SaveTransactionRequest
    ): Response<ResponseBody>

    @POST("sms/manual")
    suspend fun manualSms(
        @Header("Authorization") token: String,
        @Body body: Map<String, String>
    ): Response<ResponseBody>
}
