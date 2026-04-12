package com.smarthealthcare.payment_service.entity;

public enum PaymentStatus {
    CREATED,
    CHECKOUT_CREATED,
    PAID,
    FAILED,
    CANCELLED,
    REFUND_PENDING,
    REFUNDED,
    COMPLETED
}