package com.smarthealthcare.appointment_service.client;

import com.smarthealthcare.appointment_service.dto.integration.NotificationEventRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class NotificationClient {

    private final RestClient restClient;

    public NotificationClient(@Value("${app.integrations.notification-base-url:http://localhost:8084}") String baseUrl) {
        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .build();
    }

    public void sendEvent(NotificationEventRequest request) {
        restClient.post()
                .uri("/api/v1/notifications/events")
                .body(request)
                .retrieve()
                .toBodilessEntity();
    }
}