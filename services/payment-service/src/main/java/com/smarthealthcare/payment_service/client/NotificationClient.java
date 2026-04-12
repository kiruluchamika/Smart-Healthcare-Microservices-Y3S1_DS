package com.smarthealthcare.payment_service.client;

import com.smarthealthcare.payment_service.config.SmartHealthcareProperties;
import com.smarthealthcare.payment_service.dto.integration.NotificationEventRequest;
import com.smarthealthcare.payment_service.exception.ExternalServiceException;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class NotificationClient {

    private final RestClient restClient;

    public NotificationClient(SmartHealthcareProperties properties) {
        this.restClient = RestClient.builder()
                .baseUrl(properties.getIntegrations().getNotificationBaseUrl())
                .build();
    }

    public void sendEvent(NotificationEventRequest request) {
        try {
            restClient.post()
                    .uri("/api/v1/notifications/payment-events")
                    .body(request)
                    .retrieve()
                    .toBodilessEntity();
        } catch (Exception ex) {
            throw new ExternalServiceException("Unable to send notification event", ex);
        }
    }
}