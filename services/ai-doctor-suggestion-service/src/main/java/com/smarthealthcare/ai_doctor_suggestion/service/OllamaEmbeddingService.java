package com.smarthealthcare.ai_doctor_suggestion.service;

import com.smarthealthcare.ai_doctor_suggestion.client.OllamaEmbeddingClient;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class OllamaEmbeddingService implements EmbeddingService {

    private final OllamaEmbeddingClient ollamaEmbeddingClient;

    @Override
    public List<Double> generateEmbedding(String text) {
        return ollamaEmbeddingClient.generateEmbedding(text);
    }
}
