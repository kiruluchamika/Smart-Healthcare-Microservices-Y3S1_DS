package com.smarthealthcare.payment_service.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "payment_transactions")
public class PaymentTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Long appointmentId;

    @Column(nullable = false)
    private Long patientId;

    @Column(nullable = false)
    private Long doctorId;

    @Column(nullable = false)
    private LocalDate appointmentDate;

    @Column(nullable = false)
    private LocalTime startTime;

    @Column(nullable = false)
    private LocalTime endTime;

    @Column(nullable = false, length = 32)
    private String appointmentType;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false, length = 8)
    private String currency;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private PaymentStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private PaymentProvider provider;

    @Column(length = 255)
    private String stripeCheckoutSessionId;

    @Column(length = 255)
    private String stripePaymentIntentId;

    @Column(length = 255)
    private String stripeRefundId;

    @Column(length = 1024)
    private String checkoutUrl;

    @Column(length = 1024)
    private String telemedicineSessionUrl;

    @Column(length = 255)
    private String telemedicineSessionId;

    @Column(length = 1024)
    private String failureReason;

    @Column(length = 1024)
    private String refundReason;

    @Column(nullable = false)
    private boolean reminderSent;

    private LocalDateTime paidAt;
    private LocalDateTime refundedAt;
    private LocalDateTime completedAt;
    private LocalDateTime reminderSentAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;
        if (status == null) {
            status = PaymentStatus.CREATED;
        }
        if (provider == null) {
            provider = PaymentProvider.STRIPE;
        }
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}