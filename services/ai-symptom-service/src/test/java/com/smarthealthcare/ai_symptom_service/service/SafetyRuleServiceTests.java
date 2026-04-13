package com.smarthealthcare.ai_symptom_service.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.smarthealthcare.ai_symptom_service.dto.AnalyzeSymptomRequest;
import com.smarthealthcare.ai_symptom_service.dto.provider.GeminiTriageResult;
import com.smarthealthcare.ai_symptom_service.enums.UrgencyLevel;
import java.util.List;
import org.junit.jupiter.api.Test;

class SafetyRuleServiceTests {

    private final SafetyRuleService safetyRuleService = new SafetyRuleService();

    @Test
    void applySafetyRulesShouldEscalateEmergencySymptoms() {
        AnalyzeSymptomRequest request = baseRequest("I have chest pain and difficulty breathing since this morning.");
        GeminiTriageResult result = new GeminiTriageResult();
        result.setSymptomSummary("Possible urgent cardiorespiratory complaint.");
        result.setPossibleConditionCategories(List.of("Cardiovascular"));
        result.setUrgencyLevel(UrgencyLevel.HIGH.name());
        result.setRecommendedDoctorSpecialization("General Physician");
        result.setRedFlagWarningSigns(List.of("Severe discomfort"));
        result.setNextStepRecommendation("Seek urgent medical review.");
        result.setDisclaimer("This is not a diagnosis.");

        GeminiTriageResult updated = safetyRuleService.applySafetyRules(request, result);

        assertEquals(UrgencyLevel.EMERGENCY.name(), updated.getUrgencyLevel());
        assertTrue(updated.getNextStepRecommendation().toLowerCase().contains("emergency"));
        assertTrue(updated.getRedFlagWarningSigns().stream()
                .anyMatch(flag -> flag.toLowerCase().contains("emergency signs detected")));
    }

    @Test
    void fallbackResultShouldReturnSafeDefaults() {
        AnalyzeSymptomRequest request = baseRequest("I have fever and body aches for one day.");

        GeminiTriageResult fallback = safetyRuleService.fallbackResult(request, "gemini-1.5-pro");

        assertEquals(UrgencyLevel.MODERATE.name(), fallback.getUrgencyLevel());
        assertEquals("General Physician", fallback.getRecommendedDoctorSpecialization());
        assertNotNull(fallback.getDisclaimer());
        assertFalse(fallback.getDisclaimer().isBlank());
        assertFalse(fallback.getRedFlagWarningSigns().isEmpty());
    }

    private AnalyzeSymptomRequest baseRequest(String symptomsText) {
        AnalyzeSymptomRequest request = new AnalyzeSymptomRequest();
        request.setPatientId(1L);
        request.setSymptomsText(symptomsText);
        request.setAge(30);
        request.setSex("MALE");
        request.setDurationHours(24);
        return request;
    }
}
