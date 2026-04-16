package com.smarthealthcare.payment_service.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class PaymentReminderScheduler {

    private final PaymentServiceImpl paymentService;

    @Scheduled(fixedDelayString = "${app.payment.reminder-scan-interval-ms:900000}")
    public void sendUpcomingConsultationReminders() {
        try {
            paymentService.refreshReminders();
        } catch (Exception ex) {
            log.warn("Reminder scheduler failed: {}", ex.getMessage());
        }
    }
}