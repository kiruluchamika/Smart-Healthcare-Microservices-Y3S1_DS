package com.smarthealthcare.doctor_service.client;

import com.smarthealthcare.doctor_service.dto.integration.AppointmentLookupResponse;
import com.smarthealthcare.doctor_service.exception.BadRequestException;
import com.smarthealthcare.doctor_service.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Component
public class AppointmentServiceClient {

    private final RestClient restClient;

    public AppointmentServiceClient(
            @Value("${app.services.appointment.base-url:http://localhost:8082/appointments}") String appointmentBaseUrl) {
        this.restClient = RestClient.builder()
                .baseUrl(appointmentBaseUrl)
                .build();
    }

    public AppointmentLookupResponse getAppointmentById(Long appointmentId) {
        try {
            AppointmentLookupResponse appointment = restClient.get()
                    .uri("/{appointmentId}", appointmentId)
                    .retrieve()
                    .onStatus(HttpStatusCode::is4xxClientError, (request, response) -> {
                        if (response.getStatusCode().value() == 404) {
                            throw new ResourceNotFoundException("Appointment not found");
                        }
                        throw new BadRequestException("Unable to validate appointment");
                    })
                    .onStatus(HttpStatusCode::is5xxServerError, (request, response) -> {
                        throw new BadRequestException("Appointment service is unavailable");
                    })
                    .body(AppointmentLookupResponse.class);

            if (appointment == null) {
                throw new BadRequestException("Unable to validate appointment");
            }

            return appointment;
        } catch (ResourceNotFoundException | BadRequestException ex) {
            throw ex;
        } catch (RestClientException ex) {
            throw new BadRequestException("Appointment service is unavailable");
        }
    }
}
