package com.smarthealthcare.notification_service.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.notification")
public record NotificationProperties(
        String fromEmail,
        String replyToEmail,
        String subjectPrefix) {
}