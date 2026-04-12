package com.smarthealthcare.api_gateway.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/ai")
public class AiSuggestionGatewayController {

    private final WebClient aiSuggestionWebClient;

    public AiSuggestionGatewayController(
        WebClient.Builder webClientBuilder,
        @Value("${ai-suggestion.service.base-url}") String aiSuggestionServiceBaseUrl
    ) {
        this.aiSuggestionWebClient = webClientBuilder
            .baseUrl(aiSuggestionServiceBaseUrl)
            .build();
    }

    @PostMapping("/suggest-doctor")
    public Mono<ResponseEntity<String>> suggestDoctor(
        @RequestBody String payload,
        @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization
    ) {
        WebClient.RequestBodySpec request = aiSuggestionWebClient
            .post()
            .uri("/api/v1/ai/suggest-doctor")
            .contentType(MediaType.APPLICATION_JSON);

        if (authorization != null && !authorization.isBlank()) {
            request = request.header(HttpHeaders.AUTHORIZATION, authorization);
        }

        return request
            .bodyValue(payload)
            .exchangeToMono(response -> response.toEntity(String.class));
    }
}
