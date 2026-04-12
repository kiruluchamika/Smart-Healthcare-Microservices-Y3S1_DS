package com.smarthealthcare.payment_service.config;

import java.math.BigDecimal;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "app")
public class SmartHealthcareProperties {

    private final Security security = new Security();
    private final Payment payment = new Payment();
    private final Stripe stripe = new Stripe();
    private final Integrations integrations = new Integrations();

    @Data
    public static class Security {
        private String allowedOrigins = "http://localhost:*,http://127.0.0.1:*";
    }

    @Data
    public static class Payment {
        private String defaultCurrency = "usd";
        private BigDecimal videoConsultationFee = new BigDecimal("15.00");
        private BigDecimal physicalConsultationFee = new BigDecimal("20.00");
        private long reminderLeadHours = 24L;
        private long reminderScanIntervalMs = 900000L;
        private String checkoutSuccessUrl = "http://localhost:5173/payments/success";
        private String checkoutCancelUrl = "http://localhost:5173/payments/cancel";
    }

    @Data
    public static class Stripe {
        private String secretKey = "sk_test_change_me";
        private String webhookSecret = "whsec_change_me";
    }

    @Data
    public static class Integrations {
        private String appointmentBaseUrl = "http://localhost:8082";
        private String telemedicineBaseUrl = "http://localhost:8087";
        private String notificationBaseUrl = "http://localhost:8084";
        private String telemedicineFallbackBaseUrl = "https://meet.jit.si";
    }
}