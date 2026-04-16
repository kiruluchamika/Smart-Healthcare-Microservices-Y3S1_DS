package com.smarthealthcare.ai_symptom_service.controller;

import com.smarthealthcare.ai_symptom_service.dto.AnalyzeSymptomRequest;
import com.smarthealthcare.ai_symptom_service.dto.AnalyzeSymptomResponse;
import com.smarthealthcare.ai_symptom_service.dto.PagedHistoryResponse;
import com.smarthealthcare.ai_symptom_service.dto.SymptomHistoryItemResponse;
import com.smarthealthcare.ai_symptom_service.service.HistoryService;
import com.smarthealthcare.ai_symptom_service.service.SymptomAnalysisService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Positive;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Validated
@RequestMapping("/api/v1/ai-symptoms")
public class AiSymptomController {

    private final SymptomAnalysisService symptomAnalysisService;
    private final HistoryService historyService;

    public AiSymptomController(SymptomAnalysisService symptomAnalysisService, HistoryService historyService) {
        this.symptomAnalysisService = symptomAnalysisService;
        this.historyService = historyService;
    }

    @PostMapping("/analyze")
    public ResponseEntity<AnalyzeSymptomResponse> analyze(@Valid @RequestBody AnalyzeSymptomRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(symptomAnalysisService.analyze(request));
    }

    @GetMapping("/history/{patientId}")
    public ResponseEntity<PagedHistoryResponse> getHistory(
            @PathVariable @Positive Long patientId,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) @Max(50) int size) {
        return ResponseEntity.ok(historyService.getPatientHistory(patientId, page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SymptomHistoryItemResponse> getById(@PathVariable @Positive Long id) {
        return ResponseEntity.ok(historyService.getById(id));
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "UP", "service", "ai-symptom-service"));
    }
}
