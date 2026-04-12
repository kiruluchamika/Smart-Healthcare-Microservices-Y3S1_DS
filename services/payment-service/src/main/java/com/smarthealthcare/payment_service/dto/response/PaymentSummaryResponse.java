package com.smarthealthcare.payment_service.dto.response;

import java.math.BigDecimal;

public record PaymentSummaryResponse(
        long totalTransactions,
        long successfulTransactions,
        long failedTransactions,
        long refundedTransactions,
        long pendingTransactions,
        BigDecimal totalRevenue,
        String currency) {
}