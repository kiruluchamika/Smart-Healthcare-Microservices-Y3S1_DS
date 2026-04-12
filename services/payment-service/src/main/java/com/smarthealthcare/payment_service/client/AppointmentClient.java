package com.smarthealthcare.payment_service.client;

import com.smarthealthcare.payment_service.config.SmartHealthcareProperties;
import com.smarthealthcare.payment_service.dto.integration.AppointmentPaymentStatusUpdateRequest;
import com.smarthealthcare.payment_service.dto.integration.AppointmentSnapshot;
import com.smarthealthcare.payment_service.exception.ExternalServiceException;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class AppointmentClient {

    private final RestClient restClient;

    public AppointmentClient(SmartHealthcareProperties properties) {
        this.restClient = RestClient.builder()
                .baseUrl(properties.getIntegrations().getAppointmentBaseUrl())
                .build();
    }

    public AppointmentSnapshot getAppointmentById(Long appointmentId) {
        try {
            return restClient.get()
                    .uri("/appointments/{appointmentId}", appointmentId)
                    .retrieve()
                    .body(AppointmentSnapshot.class);
        } catch (Exception ex) {
            throw new ExternalServiceException("Unable to load appointment details", ex);
        }
    }

    public void updateAppointmentPaymentStatus(Long appointmentId, AppointmentPaymentStatusUpdateRequest request) {
        try {
            restClient.patch()
                    .uri("/appointments/{appointmentId}/payment-status", appointmentId)
                    .body(request)
                    .retrieve()
                    .toBodilessEntity();
        } catch (Exception ex) {
            throw new ExternalServiceException("Unable to update appointment payment status", ex);
        }
    }
}