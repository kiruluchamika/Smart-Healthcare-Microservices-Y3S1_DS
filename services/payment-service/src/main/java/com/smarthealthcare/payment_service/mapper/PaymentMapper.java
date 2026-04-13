package com.smarthealthcare.payment_service.mapper;

import com.smarthealthcare.payment_service.dto.response.CheckoutSessionResponse;
import com.smarthealthcare.payment_service.dto.response.PaymentResponse;
import com.smarthealthcare.payment_service.dto.response.PaymentSummaryResponse;
import com.smarthealthcare.payment_service.entity.PaymentStatus;
import com.smarthealthcare.payment_service.entity.PaymentTransaction;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

public final class PaymentMapper {

    private PaymentMapper() {
    }

    public static PaymentResponse toResponse(PaymentTransaction transaction) {
        return new PaymentResponse(
                transaction.getId(),
                transaction.getAppointmentId(),
                transaction.getPatientId(),
                transaction.getDoctorId(),
                transaction.getAppointmentDate(),
                transaction.getStartTime(),
                transaction.getEndTime(),
                transaction.getAppointmentType(),
                transaction.getAmount(),
                transaction.getCurrency(),
                transaction.getStatus(),
                transaction.getProvider(),
                transaction.getStripeCheckoutSessionId(),
                transaction.getStripePaymentIntentId(),
                transaction.getStripeRefundId(),
                transaction.getCheckoutUrl(),
                transaction.getTelemedicineSessionId(),
                transaction.getTelemedicineSessionUrl(),
                transaction.getFailureReason(),
                transaction.getRefundReason(),
                transaction.isReminderSent(),
                transaction.getPaidAt(),
                transaction.getRefundedAt(),
                transaction.getCompletedAt(),
                transaction.getReminderSentAt(),
                transaction.getCreatedAt(),
                transaction.getUpdatedAt());
    }

    public static CheckoutSessionResponse toCheckoutResponse(PaymentTransaction transaction) {
        return new CheckoutSessionResponse(
                transaction.getId(),
                transaction.getAppointmentId(),
                transaction.getPatientId(),
                transaction.getDoctorId(),
                transaction.getAmount(),
                transaction.getCurrency(),
                transaction.getStatus(),
                transaction.getStripeCheckoutSessionId(),
                transaction.getCheckoutUrl(),
                transaction.getTelemedicineSessionUrl(),
                transaction.getCreatedAt(),
                transaction.getUpdatedAt());
    }

    public static PaymentSummaryResponse toSummary(List<PaymentTransaction> transactions, String currency) {
        long total = transactions.size();
        long successful = transactions.stream().filter(tx -> tx.getStatus() == PaymentStatus.PAID || tx.getStatus() == PaymentStatus.COMPLETED).count();
        long failed = transactions.stream().filter(tx -> tx.getStatus() == PaymentStatus.FAILED).count();
        long refunded = transactions.stream().filter(tx -> tx.getStatus() == PaymentStatus.REFUNDED).count();
        long pending = transactions.stream().filter(tx -> tx.getStatus() == PaymentStatus.CREATED || tx.getStatus() == PaymentStatus.CHECKOUT_CREATED || tx.getStatus() == PaymentStatus.REFUND_PENDING).count();
        BigDecimal revenue = transactions.stream()
                .filter(tx -> tx.getStatus() == PaymentStatus.PAID || tx.getStatus() == PaymentStatus.COMPLETED)
                .map(PaymentTransaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);

        return new PaymentSummaryResponse(total, successful, failed, refunded, pending, revenue, currency);
    }
}