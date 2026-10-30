package com.smartpay.android

import com.smartpay.android.data.parser.SmsParser
import org.junit.Assert.*
import org.junit.Test

class SmsParserTest {

    @Test
    fun testDebitSms() {
        val sms = "A/C X1234 debited by Rs. 450.00 on 05-Feb-25 at Zomato. Avl Bal: INR 15,600.00 - HDFC Bank"
        val result = SmsParser.parse(sms)

        assertTrue(result.isValidTransaction)
        assertEquals(450.0, result.amount, 0.01)
        assertEquals("debited", result.type)
        assertEquals("Zomato", result.merchant)
        assertEquals("Food & Dining", result.category)
        assertEquals("HDFC", result.bankName)
        assertEquals(15600.0, result.availableBalance ?: 0.0, 0.01)
    }

    @Test
    fun testCreditSms() {
        val sms = "Your A/C X1234 has been credited with INR 5,000.00 on 06-Feb-25 by Salary. Ref: UPI/503629"
        val result = SmsParser.parse(sms)

        assertTrue(result.isValidTransaction)
        assertEquals(5000.0, result.amount, 0.01)
        assertEquals("credited", result.type)
        assertEquals("Income", result.category)
        assertEquals("503629", result.referenceId)
    }

    @Test
    fun testUpiTransaction() {
        val sms = "Paid Rs. 120.50 to Swiggy via UPI (UPI Ref: 5092819201). HDFC Bank"
        val result = SmsParser.parse(sms)

        assertTrue(result.isValidTransaction)
        assertEquals(120.5, result.amount, 0.01)
        assertEquals("debited", result.type)
        assertEquals("Swiggy", result.merchant)
        assertEquals("Food & Dining", result.category)
        assertEquals("5092819201", result.referenceId)
        assertEquals("HDFC", result.bankName)
    }

    @Test
    fun testNonTransactionMessageWithAmount() {
        // Contains an amount but is an OTP / promotional offer
        val sms = "Your verification code is 482910. Do not share with anyone. Get pre-approved loan up to Rs. 5,00,000 today!"
        val result = SmsParser.parse(sms)

        // Since it contains OTP keyword, should be invalid transaction
        assertFalse(result.isValidTransaction)
    }

    @Test
    fun testAmbiguousSms() {
        val sms = "Reminder: Your bill of Rs. 1,299.00 is due on 10th Feb. Click to pay."
        val result = SmsParser.parse(sms)

        // Bill reminder without actual debit/credit keyword might be flagged as debit or low confidence,
        // but let's check how parser handles it. Without spent/debited/credited, type defaults to debited or amount is extracted.
        // Even if valid transaction or not, let's verify amount extraction.
        assertEquals(1299.0, result.amount, 0.01)
    }

    @Test
    fun testMissingAmount() {
        val sms = "Your account has been debited for transaction at Amazon."
        val result = SmsParser.parse(sms)

        assertFalse(result.isValidTransaction)
    }

    @Test
    fun testMalformedSmsFormat() {
        val sms = "Hello user, welcome to SmartPay."
        val result = SmsParser.parse(sms)

        assertFalse(result.isValidTransaction)
    }
}
