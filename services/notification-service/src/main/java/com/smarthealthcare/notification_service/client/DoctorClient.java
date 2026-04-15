package com.smarthealthcare.notification_service.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.smarthealthcare.notification_service.config.NotificationIntegrationProperties;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.util.StringUtils;

@Component
public class DoctorClient {

    private final RestClient restClient;

    public DoctorClient(NotificationIntegrationProperties properties) {
        RestClient.Builder builder = RestClient.builder()
                .baseUrl(properties.doctorBaseUrl());

        if (StringUtils.hasText(properties.doctorUsername()) && StringUtils.hasText(properties.doctorPassword())) {
            builder.defaultHeaders(headers -> headers.setBasicAuth(properties.doctorUsername(), properties.doctorPassword()));
        }

        this.restClient = builder.build();
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