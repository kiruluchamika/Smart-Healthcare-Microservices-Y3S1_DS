package com.smarthealthcare.ai_doctor_suggestion.client;

import com.smarthealthcare.ai_doctor_suggestion.config.OllamaProperties;
import com.smarthealthcare.ai_doctor_suggestion.config.OllamaRuntimeState;
import com.smarthealthcare.ai_doctor_suggestion.exception.EmbeddingServiceException;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

@Component
@RequiredArgsConstructor
public class OllamaEmbeddingClient {

    private final RestTemplate restTemplate;
    private final OllamaProperties ollamaProperties;
    private final OllamaRuntimeState ollamaRuntimeState;

    public List<Double> generateEmbedding(String text) {
        String activeBaseUrl = ollamaRuntimeState.getActiveBaseUrl();
        String baseUrl = activeBaseUrl == null ? ollamaProperties.baseUrl() : activeBaseUrl;
        String endpoint = baseUrl + "/api/embeddings";

        OllamaEmbeddingRequest request = new OllamaEmbeddingRequest(
                ollamaProperties.embedding().model(),
                text);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        try {
            ResponseEntity<OllamaEmbeddingResponse> response = restTemplate.postForEntity(
                    endpoint,
                    new HttpEntity<>(request, headers),
                    OllamaEmbeddingResponse.class);

            OllamaEmbeddingResponse body = response.getBody();
            if (body == null || body.embedding() == null || body.embedding().isEmpty()) {
                throw new EmbeddingServiceException("Failed to generate embedding from Ollama");
            }
            return body.embedding();
        } catch (RestClientException ex) {
            throw new EmbeddingServiceException("Ollama embedding service is unavailable", ex);
        }
    }

    private record OllamaEmbeddingRequest(String model, String prompt) {
    }

    private record OllamaEmbeddingResponse(List<Double> embedding) {
    }
}
