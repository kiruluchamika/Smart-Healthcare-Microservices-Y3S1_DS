package com.smarthealthcare.ai_symptom_service.repository;

import com.smarthealthcare.ai_symptom_service.entity.SymptomAnalysisHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SymptomAnalysisHistoryRepository extends JpaRepository<SymptomAnalysisHistory, Long> {

    Page<SymptomAnalysisHistory> findByPatientIdOrderByCreatedAtDesc(Long patientId, Pageable pageable);
}
