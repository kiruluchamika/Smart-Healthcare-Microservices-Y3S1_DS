package com.smarthealthcare.notification_service.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.smarthealthcare.notification_service.config.NotificationIntegrationProperties;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class PatientClient {

    private final RestClient restClient;

    public PatientClient(NotificationIntegrationProperties properties) {
        this.restClient = RestClient.builder()
                .baseUrl(properties.patientBaseUrl())
                .build();
    }

    public PatientContactResponse getPatientContactByAuthUserId(Long authUserId) {
        return restClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/internal/contact")
                        .queryParam("authUserId", authUserId)
                        .build())
                .retrieve()
                .body(PatientContactResponse.class);
    }

    public PatientContactResponse getPatientContactByProfileId(Long patientProfileId) {
        return restClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/internal/contact-by-profile")
                        .queryParam("patientProfileId", patientProfileId)
                        .build())
                .retrieve()
                .body(PatientContactResponse.class);
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record PatientContactResponse(
            Long authUserId,
            String firstName,
            String lastName,
            String email,
            String contactPhone) {
    }
}