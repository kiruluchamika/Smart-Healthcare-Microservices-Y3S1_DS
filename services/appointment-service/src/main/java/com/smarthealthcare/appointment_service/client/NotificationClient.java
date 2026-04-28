package com.smarthealthcare.appointment_service.client;

import com.smarthealthcare.appointment_service.dto.integration.NotificationEventRequest;
import org.springframework.util.StringUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class NotificationClient {

    private final RestClient restClient;
    private final boolean notificationEnabled;

    public NotificationClient(
            @Value("${app.integrations.notification-enabled:true}") boolean notificationEnabled,
            @Value("${app.integrations.notification-base-url:}") String baseUrl) {
        this.notificationEnabled = notificationEnabled && StringUtils.hasText(baseUrl);
        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .build();
    }

    public void sendEvent(NotificationEventRequest request) {
        if (!notificationEnabled) {
            return;
        }

        restClient.post()
                .uri("/api/v1/notifications/events")
                .body(request)
                .retrieve()
                .toBodilessEntity();
    }
}
