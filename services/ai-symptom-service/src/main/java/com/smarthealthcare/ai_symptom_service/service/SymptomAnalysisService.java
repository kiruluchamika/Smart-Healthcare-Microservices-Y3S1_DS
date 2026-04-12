package com.smarthealthcare.ai_symptom_service.service;

import com.smarthealthcare.ai_symptom_service.client.GeminiClient;
import com.smarthealthcare.ai_symptom_service.config.GeminiProperties;
import com.smarthealthcare.ai_symptom_service.dto.AnalyzeSymptomRequest;
import com.smarthealthcare.ai_symptom_service.dto.AnalyzeSymptomResponse;
import com.smarthealthcare.ai_symptom_service.dto.provider.GeminiTriageResult;
import com.smarthealthcare.ai_symptom_service.entity.SymptomAnalysisHistory;
import com.smarthealthcare.ai_symptom_service.mapper.SymptomAnalysisMapper;
import com.smarthealthcare.ai_symptom_service.repository.SymptomAnalysisHistoryRepository;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SymptomAnalysisService {

    private static final String PROVIDER = "GEMINI";

    private final GeminiClient geminiClient;
    private final PromptBuilder promptBuilder;
    private final SafetyRuleService safetyRuleService;
    private final SymptomAnalysisHistoryRepository repository;
    private final SymptomAnalysisMapper mapper;
    private final GeminiProperties geminiProperties;

    public SymptomAnalysisService(
            GeminiClient geminiClient,
            PromptBuilder promptBuilder,
            SafetyRuleService safetyRuleService,
            SymptomAnalysisHistoryRepository repository,
            SymptomAnalysisMapper mapper,
            GeminiProperties geminiProperties) {
        this.geminiClient = geminiClient;
        this.promptBuilder = promptBuilder;
        this.safetyRuleService = safetyRuleService;
        this.repository = repository;
        this.mapper = mapper;
        this.geminiProperties = geminiProperties;
    }

    @Transactional
    public AnalyzeSymptomResponse analyze(AnalyzeSymptomRequest request) {
        String correlationId = UUID.randomUUID().toString();
        GeminiTriageResult triageResult;
        String rawAiJson;
        boolean fallbackUsed = false;

        try {
            GeminiClient.GeminiResultPayload payload = geminiClient.generateTriage(
                    promptBuilder.systemPrompt(),
                    promptBuilder.userPrompt(request));
            triageResult = payload.triageResult();
            rawAiJson = payload.rawTriageJson();
        } catch (RuntimeException ex) {
            fallbackUsed = true;
            triageResult = safetyRuleService.fallbackResult(request, geminiProperties.getModel());
            rawAiJson = "{\"fallback\":true,\"reason\":\"" + ex.getMessage() + "\"}";
        }

        triageResult = safetyRuleService.applySafetyRules(request, triageResult);

        SymptomAnalysisHistory entity = new SymptomAnalysisHistory();
        entity.setPatientId(request.getPatientId());
        entity.setSymptomsText(request.getSymptomsText());
        entity.setAge(request.getAge());
        entity.setSex(request.getSex());
        entity.setDurationHours(request.getDurationHours());
        entity.setChronicConditionsJson(mapper.writeList(request.getChronicConditions()));
        entity.setMedicationsJson(mapper.writeList(request.getCurrentMedications()));
        entity.setAllergiesJson(mapper.writeList(request.getAllergies()));
        entity.setSymptomSummary(triageResult.getSymptomSummary());
        entity.setConditionCategoriesJson(mapper.writeList(triageResult.getPossibleConditionCategories()));
        entity.setUrgencyLevel(triageResult.getUrgencyLevel());
        entity.setRecommendedSpecialization(triageResult.getRecommendedDoctorSpecialization());
        entity.setRedFlagsJson(mapper.writeList(triageResult.getRedFlagWarningSigns()));
        entity.setNextStepRecommendation(triageResult.getNextStepRecommendation());
        entity.setDisclaimer(triageResult.getDisclaimer());
        entity.setAiProvider(PROVIDER);
        entity.setAiModel(geminiProperties.getModel());
        entity.setRawAiResponseJson(rawAiJson);
        entity.setCorrelationId(correlationId);

        SymptomAnalysisHistory saved = repository.save(entity);
        AnalyzeSymptomResponse response = mapper.toAnalyzeResponse(saved);
        response.setFallbackUsed(fallbackUsed);
        return response;
    }
}
