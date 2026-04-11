package com.smarthealthcare.ai_doctor_suggestion.config;

import java.util.concurrent.atomic.AtomicReference;
import org.springframework.stereotype.Component;

@Component
public class OllamaRuntimeState {

    private final AtomicReference<String> activeBaseUrl = new AtomicReference<>();

    public String getActiveBaseUrl() {
        return activeBaseUrl.get();
    }

    public void setActiveBaseUrl(String baseUrl) {
        activeBaseUrl.set(baseUrl);
    }
}
