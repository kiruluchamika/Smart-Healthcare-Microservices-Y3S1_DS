package com.smarthealthcare.ai_doctor_suggestion.client;

import com.smarthealthcare.ai_doctor_suggestion.config.DoctorServiceProperties;
import com.smarthealthcare.ai_doctor_suggestion.dto.DoctorServiceDoctorDto;
import com.smarthealthcare.ai_doctor_suggestion.exception.DoctorServiceUnavailableException;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Collections;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

@Component
@RequiredArgsConstructor
public class DoctorServiceClient {

    private final RestTemplate restTemplate;
    private final DoctorServiceProperties doctorServiceProperties;

    public List<DoctorServiceDoctorDto> fetchVerifiedDoctors() {
        String endpoint = doctorServiceProperties.baseUrl() + "/api/v1/doctors/search?verified=true";

        HttpHeaders headers = new HttpHeaders();
        headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));
        headers.set(HttpHeaders.AUTHORIZATION, buildBasicAuthHeader());

        try {
            ResponseEntity<List<DoctorServiceDoctorDto>> response = restTemplate.exchange(
                    endpoint,
                    HttpMethod.GET,
                    new HttpEntity<>(headers),
                    new ParameterizedTypeReference<>() {
                    });

            return response.getBody() == null ? List.of() : response.getBody();
        } catch (RestClientException ex) {
            throw new DoctorServiceUnavailableException("Doctor service is unavailable", ex);
        }
    }

    private String buildBasicAuthHeader() {
        String value = doctorServiceProperties.username() + ":" + doctorServiceProperties.password();
        String encoded = Base64.getEncoder().encodeToString(value.getBytes(StandardCharsets.UTF_8));
        return "Basic " + encoded;
    }
}
