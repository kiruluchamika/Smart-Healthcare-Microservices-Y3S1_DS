package com.smarthealthcare.ai_doctor_suggestion.service;

import java.util.List;

public interface EmbeddingService {

    List<Double> generateEmbedding(String text);
}
