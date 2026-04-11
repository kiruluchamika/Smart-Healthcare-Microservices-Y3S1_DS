package com.smarthealthcare.ai_doctor_suggestion.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "ollama")
public record OllamaProperties(
        String baseUrl,
        Embedding embedding,
        Startup startup) {
    public record Embedding(String model) {
    }

    public record Startup(
            boolean enabled,
            boolean autoStartCli,
            boolean autoPullModel,
            boolean failFastIfUnavailable,
            int readinessAttempts,
            long readinessIntervalMs,
            String fallbackPorts) {
    }
}
