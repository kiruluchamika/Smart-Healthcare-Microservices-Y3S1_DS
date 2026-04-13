package com.smarthealthcare.ai_symptom_service.mapper;

import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;
import com.smarthealthcare.ai_symptom_service.dto.AnalyzeSymptomResponse;
import com.smarthealthcare.ai_symptom_service.dto.SymptomHistoryItemResponse;
import com.smarthealthcare.ai_symptom_service.entity.SymptomAnalysisHistory;
import java.util.Collections;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class SymptomAnalysisMapper {

    private final ObjectMapper objectMapper;

    public SymptomAnalysisMapper(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public AnalyzeSymptomResponse toAnalyzeResponse(SymptomAnalysisHistory entity) {
        AnalyzeSymptomResponse response = new AnalyzeSymptomResponse();
        response.setAnalysisId(entity.getId());
        response.setPatientId(entity.getPatientId());
        response.setSymptomSummary(entity.getSymptomSummary());
        response.setPossibleConditionCategories(readList(entity.getConditionCategoriesJson()));
        response.setUrgencyLevel(entity.getUrgencyLevel());
        response.setRecommendedDoctorSpecialization(entity.getRecommendedSpecialization());
        response.setRedFlagWarningSigns(readList(entity.getRedFlagsJson()));
        response.setNextStepRecommendation(entity.getNextStepRecommendation());
        response.setDisclaimer(entity.getDisclaimer());
        response.setGeneratedAt(entity.getCreatedAt());
        response.setProvider(entity.getAiProvider());
        response.setModel(entity.getAiModel());
        response.setCorrelationId(entity.getCorrelationId());
        return response;
    }

    public SymptomHistoryItemResponse toHistoryItem(SymptomAnalysisHistory entity) {
        SymptomHistoryItemResponse item = new SymptomHistoryItemResponse();
        item.setId(entity.getId());
        item.setPatientId(entity.getPatientId());
        item.setSymptomSummary(entity.getSymptomSummary());
        item.setPossibleConditionCategories(readList(entity.getConditionCategoriesJson()));
        item.setUrgencyLevel(entity.getUrgencyLevel());
        item.setRecommendedDoctorSpecialization(entity.getRecommendedSpecialization());
        item.setRedFlagWarningSigns(readList(entity.getRedFlagsJson()));
        item.setNextStepRecommendation(entity.getNextStepRecommendation());
        item.setDisclaimer(entity.getDisclaimer());
        item.setCorrelationId(entity.getCorrelationId());
        item.setCreatedAt(entity.getCreatedAt());
        return item;
    }

    public String writeList(List<String> values) {
        return objectMapper.writeValueAsString(values == null ? Collections.emptyList() : values);
    }

    public String writeObject(Object value) {
        return objectMapper.writeValueAsString(value);
    }

    private List<String> readList(String json) {
        if (json == null || json.isBlank()) {
            return Collections.emptyList();
        }
        return objectMapper.readValue(json, new TypeReference<>() {
        });
    }
}
