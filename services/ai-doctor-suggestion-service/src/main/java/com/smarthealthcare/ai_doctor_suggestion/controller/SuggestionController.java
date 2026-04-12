package com.smarthealthcare.ai_doctor_suggestion.controller;

import com.smarthealthcare.ai_doctor_suggestion.dto.SuggestDoctorRequest;
import com.smarthealthcare.ai_doctor_suggestion.dto.SuggestDoctorResponse;
import com.smarthealthcare.ai_doctor_suggestion.service.SuggestionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
@Tag(name = "AI Doctor Suggestions", description = "Suggest doctors from symptom text")
public class SuggestionController {

    private final SuggestionService suggestionService;

    @PostMapping("/suggest-doctor")
    @Operation(summary = "Suggest doctors by symptoms")
    public ResponseEntity<SuggestDoctorResponse> suggestDoctor(@Valid @RequestBody SuggestDoctorRequest request) {
        return ResponseEntity.ok(suggestionService.suggestDoctors(request));
    }
}
