package com.smarthealthcare.notification_service.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.integrations")
public record NotificationIntegrationProperties(
        String authBaseUrl,
        String doctorBaseUrl,
        String patientBaseUrl,
        String doctorUsername,
        String doctorPassword) {
}