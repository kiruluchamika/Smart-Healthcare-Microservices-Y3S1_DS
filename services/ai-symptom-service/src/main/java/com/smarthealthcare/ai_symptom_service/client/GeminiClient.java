package com.smarthealthcare.ai_symptom_service.client;

import java.io.IOException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import com.smarthealthcare.ai_symptom_service.config.GeminiProperties;
import com.smarthealthcare.ai_symptom_service.dto.provider.GeminiTriageResult;
import com.smarthealthcare.ai_symptom_service.exception.ExternalAiException;
import com.smarthealthcare.ai_symptom_service.exception.InvalidAiResponseException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

@Component
public class GeminiClient {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final GeminiProperties geminiProperties;

    public GeminiClient(RestTemplate restTemplate, ObjectMapper objectMapper, GeminiProperties geminiProperties) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
        this.geminiProperties = geminiProperties;
    }

    public GeminiResultPayload generateTriage(String systemPrompt, String userPrompt) {
        if (!StringUtils.hasText(geminiProperties.getApiKey())) {
            throw new ExternalAiException("GEMINI_API_KEY is not configured");
        }

        String endpoint = geminiProperties.getBaseUrl() + "/models/" + geminiProperties.getModel()
                + ":generateContent?key=" + geminiProperties.getApiKey();

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("systemInstruction", Map.of("parts", List.of(Map.of("text", systemPrompt))));
        body.put("contents", List.of(Map.of("role", "user", "parts", List.of(Map.of("text", userPrompt)))));
        body.put("generationConfig", Map.of("temperature", 0.2, "responseMimeType", "application/json"));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(endpoint, new HttpEntity<>(body, headers), String.class);
            String raw = response.getBody();
            String jsonText = extractModelText(raw);
            GeminiTriageResult result = objectMapper.readValue(jsonText, GeminiTriageResult.class);
            validate(result);
            return new GeminiResultPayload(result, jsonText);
        } catch (RestClientException ex) {
            throw new ExternalAiException("Gemini API call failed", ex);
        } catch (IOException ex) {
            throw new InvalidAiResponseException("Failed to parse Gemini response", ex);
        }
    }

    private String extractModelText(String rawResponse) throws IOException {
        JsonNode root = objectMapper.readTree(rawResponse);
        JsonNode textNode = root.path("candidates").path(0).path("content").path("parts").path(0).path("text");
        if (textNode.isMissingNode() || textNode.asText().isBlank()) {
            throw new InvalidAiResponseException("Gemini response does not contain text payload");
        }
        return textNode.asText();
    }

    private void validate(GeminiTriageResult result) {
        if (!StringUtils.hasText(result.getSymptomSummary())
                || !StringUtils.hasText(result.getUrgencyLevel())
                || !StringUtils.hasText(result.getRecommendedDoctorSpecialization())
                || !StringUtils.hasText(result.getNextStepRecommendation())
                || !StringUtils.hasText(result.getDisclaimer())) {
            throw new InvalidAiResponseException("Gemini response is missing required fields");
        }

        String urgency = result.getUrgencyLevel().toUpperCase();
        if (!("LOW".equals(urgency)
                || "MODERATE".equals(urgency)
                || "HIGH".equals(urgency)
                || "EMERGENCY".equals(urgency))) {
            throw new InvalidAiResponseException("Gemini urgencyLevel must be LOW, MODERATE, HIGH or EMERGENCY");
        }
        result.setUrgencyLevel(urgency);
    }

    public record GeminiResultPayload(GeminiTriageResult triageResult, String rawTriageJson) {
    }
}
