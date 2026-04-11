package com.smarthealthcare.ai_doctor_suggestion.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "doctor.service")
public record DoctorServiceProperties(
        String baseUrl,
        String username,
        String password) {
}
