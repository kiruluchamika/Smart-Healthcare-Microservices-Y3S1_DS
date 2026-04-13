package com.smarthealthcare.payment_service.client;

import com.smarthealthcare.payment_service.config.SmartHealthcareProperties;
import com.smarthealthcare.payment_service.dto.integration.TelemedicineSessionRequest;
import com.smarthealthcare.payment_service.dto.integration.TelemedicineSessionResponse;
import com.smarthealthcare.payment_service.exception.ExternalServiceException;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class TelemedicineClient {

    private final RestClient restClient;

    public TelemedicineClient(SmartHealthcareProperties properties) {
        this.restClient = RestClient.builder()
                .baseUrl(properties.getIntegrations().getTelemedicineBaseUrl())
                .build();
    }

    public TelemedicineSessionResponse createSession(TelemedicineSessionRequest request) {
        try {
            return restClient.post()
                    .uri("/api/v1/telemedicine/sessions")
                    .body(request)
                    .retrieve()
                    .body(TelemedicineSessionResponse.class);
        } catch (Exception ex) {
            throw new ExternalServiceException("Unable to create telemedicine session", ex);
        }
    }
}