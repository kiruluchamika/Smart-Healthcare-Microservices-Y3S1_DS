package com.smarthealthcare.patient_service.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import java.util.List;
import java.util.Map;

@Component
public class DoctorServiceClient {
    @Value("${DOCTOR_SERVICE_BASE_URL:http://localhost:8083}")
    private String doctorServiceUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    public List<Map<String, Object>> getPrescriptionsForPatient(Long patientId, String jwtToken) {
        String url = doctorServiceUrl + "/api/v1/prescriptions/by-patient/" + patientId;
        ResponseEntity<List> response = restTemplate.getForEntity(url, List.class);
        return response.getBody();
    }
}
