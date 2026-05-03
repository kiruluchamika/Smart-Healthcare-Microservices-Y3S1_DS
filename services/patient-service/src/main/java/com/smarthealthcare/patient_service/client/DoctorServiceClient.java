package com.smarthealthcare.patient_service.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;
import java.util.Map;

@Component
public class DoctorServiceClient {
    @Value("${DOCTOR_SERVICE_BASE_URL:http://localhost:8083}")
    private String doctorServiceUrl;

    @Value("${DOCTOR_SERVICE_USERNAME:doctor}")
    private String doctorServiceUsername;

    @Value("${DOCTOR_SERVICE_PASSWORD:doctor123}")
    private String doctorServicePassword;

    private final RestTemplate restTemplate = new RestTemplate();

    public List<Map<String, Object>> getPrescriptionsForPatient(Long patientId, String jwtToken) {
        String url = doctorServiceUrl + "/api/v1/prescriptions/by-patient/" + patientId;

        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.AUTHORIZATION, buildBasicAuthHeader());
        headers.set("X-Patient-Id", String.valueOf(patientId));

        ResponseEntity<List> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                new HttpEntity<>(headers),
                List.class);

        return response.getBody();
    }

    private String buildBasicAuthHeader() {
        String credentials = doctorServiceUsername + ":" + doctorServicePassword;
        String encoded = Base64.getEncoder().encodeToString(credentials.getBytes(StandardCharsets.UTF_8));
        return "Basic " + encoded;
    }
}
