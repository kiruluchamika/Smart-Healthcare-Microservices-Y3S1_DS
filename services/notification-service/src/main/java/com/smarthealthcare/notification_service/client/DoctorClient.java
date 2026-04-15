package com.smarthealthcare.notification_service.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.smarthealthcare.notification_service.config.NotificationIntegrationProperties;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class DoctorClient {

    private final RestClient restClient;

    public DoctorClient(NotificationIntegrationProperties properties) {
        this.restClient = RestClient.builder()
                .baseUrl(properties.doctorBaseUrl())
                .build();
    }

    public DoctorContactResponse getDoctorById(Long doctorId) {
        return restClient.get()
                .uri("/{doctorId}", doctorId)
                .retrieve()
                .body(DoctorContactResponse.class);
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record DoctorContactResponse(
            Long id,
            String firstName,
            String lastName,
            String email,
            String phone) {
    }
}