package com.smarthealthcare.payment_service.client;

import com.smarthealthcare.payment_service.config.SmartHealthcareProperties;
import com.smarthealthcare.payment_service.dto.integration.DoctorSnapshot;
import com.smarthealthcare.payment_service.exception.ExternalServiceException;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class DoctorClient {

    private final RestClient restClient;

    public DoctorClient(SmartHealthcareProperties properties) {
        String username = properties.getIntegrations().getDoctorServiceUsername();
        String password = properties.getIntegrations().getDoctorServicePassword();
        String basicToken = Base64.getEncoder()
                .encodeToString((username + ":" + password).getBytes(StandardCharsets.UTF_8));

        this.restClient = RestClient.builder()
                .baseUrl(properties.getIntegrations().getDoctorBaseUrl())
                .defaultHeader("Authorization", "Basic " + basicToken)
                .build();
    }

    public DoctorSnapshot getDoctorById(Long doctorId) {
        try {
            return restClient.get()
                    .uri("/{doctorId}", doctorId)
                    .retrieve()
                    .body(DoctorSnapshot.class);
        } catch (Exception ex) {
            throw new ExternalServiceException("Unable to load doctor pricing details", ex);
        }
    }
}
