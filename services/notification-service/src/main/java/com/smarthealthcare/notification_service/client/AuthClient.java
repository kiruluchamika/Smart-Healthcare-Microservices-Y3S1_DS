package com.smarthealthcare.notification_service.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.smarthealthcare.notification_service.config.NotificationIntegrationProperties;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class AuthClient {

    private final RestClient restClient;

    public AuthClient(NotificationIntegrationProperties properties) {
        this.restClient = RestClient.builder()
                .baseUrl(properties.authBaseUrl())
                .build();
    }

    public AuthUserResponse getUserById(Long userId) {
        return restClient.get()
                .uri("/users/{userId}", userId)
                .retrieve()
                .body(AuthUserResponse.class);
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record AuthUserResponse(
            Long id,
            String email,
            String firstName,
            String lastName,
            String phoneNumber,
            String role) {
    }
}