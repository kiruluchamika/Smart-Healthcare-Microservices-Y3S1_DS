package com.smarthealthcare.ai_symptom_service.service;

import com.smarthealthcare.ai_symptom_service.dto.AnalyzeSymptomRequest;
import com.smarthealthcare.ai_symptom_service.dto.provider.GeminiTriageResult;
import com.smarthealthcare.ai_symptom_service.enums.UrgencyLevel;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import org.springframework.stereotype.Service;

@Service
public class SafetyRuleService {

    private static final String DEFAULT_DISCLAIMER =
            "This triage output is for informational purposes only and is not a medical diagnosis.";
    private static final List<String> EMERGENCY_KEYWORDS = List.of(
            "chest pain",
            "difficulty breathing",
            "severe shortness of breath",
            "cannot breathe",
            "loss of consciousness",
            "fainted",
            "stroke",
            "one-sided weakness",
            "slurred speech",
            "seizure",
            "coughing blood",
            "severe bleeding",
            "suicidal");

    public GeminiTriageResult applySafetyRules(AnalyzeSymptomRequest request, GeminiTriageResult result) {
        String text = request.getSymptomsText().toLowerCase(Locale.ROOT);
        boolean emergencyKeyword = containsEmergencyKeyword(text);

        if (result.getSymptomSummary() == null || result.getSymptomSummary().isBlank()) {
            result.setSymptomSummary("Symptoms were received and reviewed for triage-oriented guidance.");
        }

        if (result.getPossibleConditionCategories() == null || result.getPossibleConditionCategories().isEmpty()) {
            result.setPossibleConditionCategories(List.of("General Symptom Review"));
        }

        if (result.getDisclaimer() == null || result.getDisclaimer().isBlank()) {
            result.setDisclaimer(DEFAULT_DISCLAIMER);
        }

        if (result.getUrgencyLevel() == null || result.getUrgencyLevel().isBlank()) {
            result.setUrgencyLevel(UrgencyLevel.MODERATE.name());
        }

        if (emergencyKeyword) {
            result.setUrgencyLevel(UrgencyLevel.EMERGENCY.name());

            Set<String> redFlags = new LinkedHashSet<>();
            if (result.getRedFlagWarningSigns() != null) {
                redFlags.addAll(result.getRedFlagWarningSigns());
            }
            redFlags.add("Potential emergency signs detected from symptom description.");
            result.setRedFlagWarningSigns(new ArrayList<>(redFlags));

            String nextStep = result.getNextStepRecommendation() == null ? "" : result.getNextStepRecommendation();
            if (!nextStep.toLowerCase(Locale.ROOT).contains("emergency")) {
                result.setNextStepRecommendation(
                        "Seek immediate emergency care or call local emergency services. " + nextStep);
            }

            if (result.getRecommendedDoctorSpecialization() == null
                    || result.getRecommendedDoctorSpecialization().isBlank()) {
                result.setRecommendedDoctorSpecialization("Emergency Medicine");
            }
        } else {
            if (result.getRedFlagWarningSigns() == null || result.getRedFlagWarningSigns().isEmpty()) {
                result.setRedFlagWarningSigns(List.of("Seek medical review if symptoms worsen, persist, or new alarming signs appear."));
            }

            if (result.getRecommendedDoctorSpecialization() == null
                    || result.getRecommendedDoctorSpecialization().isBlank()) {
                result.setRecommendedDoctorSpecialization("General Physician");
            }

            if (result.getNextStepRecommendation() == null || result.getNextStepRecommendation().isBlank()) {
                result.setNextStepRecommendation("Arrange a routine consultation with a qualified clinician for assessment.");
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

    private boolean containsEmergencyKeyword(String text) {
        return EMERGENCY_KEYWORDS.stream().anyMatch(text::contains);
    }
}
