package com.smarthealthcare.ai_symptom_service.service;

import com.smarthealthcare.ai_symptom_service.dto.AnalyzeSymptomRequest;
import com.smarthealthcare.ai_symptom_service.dto.provider.GeminiTriageResult;
import com.smarthealthcare.ai_symptom_service.enums.UrgencyLevel;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Service;

@Service
public class SafetyRuleService {

    private static final String DEFAULT_DISCLAIMER =
            "This triage output is for informational purposes only and is not a medical diagnosis.";

    public GeminiTriageResult applySafetyRules(AnalyzeSymptomRequest request, GeminiTriageResult result) {
        String text = request.getSymptomsText().toLowerCase(Locale.ROOT);
        boolean emergencyKeyword = text.contains("chest pain")
                || text.contains("difficulty breathing")
                || text.contains("severe shortness of breath")
                || text.contains("loss of consciousness")
                || text.contains("stroke");

        if (result.getDisclaimer() == null || result.getDisclaimer().isBlank()) {
            result.setDisclaimer(DEFAULT_DISCLAIMER);
        }

        if (result.getUrgencyLevel() == null || result.getUrgencyLevel().isBlank()) {
            result.setUrgencyLevel(UrgencyLevel.MODERATE.name());
        }

        if (emergencyKeyword) {
            result.setUrgencyLevel(UrgencyLevel.EMERGENCY.name());

            List<String> redFlags = result.getRedFlagWarningSigns();
            if (redFlags == null) {
                redFlags = new ArrayList<>();
            }
            redFlags.add("Potential emergency signs detected from symptom description.");
            result.setRedFlagWarningSigns(redFlags);

            String nextStep = result.getNextStepRecommendation() == null ? "" : result.getNextStepRecommendation();
            if (!nextStep.toLowerCase(Locale.ROOT).contains("emergency")) {
                result.setNextStepRecommendation(
                        "Seek immediate emergency care or call local emergency services. " + nextStep);
            }
        }

        return result;
    }

    public GeminiTriageResult fallbackResult(AnalyzeSymptomRequest request, String model) {
        GeminiTriageResult fallback = new GeminiTriageResult();
        fallback.setSymptomSummary("Automated triage is temporarily limited. Basic safety guidance is provided.");
        fallback.setPossibleConditionCategories(List.of("General Symptom Review"));
        fallback.setUrgencyLevel(UrgencyLevel.MODERATE.name());
        fallback.setRecommendedDoctorSpecialization("General Physician");
        fallback.setRedFlagWarningSigns(List.of("If chest pain, severe breathing difficulty, or fainting occurs, seek emergency care."));
        fallback.setNextStepRecommendation("Arrange a clinical consultation soon. Seek emergency care if symptoms worsen rapidly.");
        fallback.setDisclaimer(DEFAULT_DISCLAIMER + " AI provider temporarily unavailable: " + model + ".");
        return applySafetyRules(request, fallback);
    }
}
