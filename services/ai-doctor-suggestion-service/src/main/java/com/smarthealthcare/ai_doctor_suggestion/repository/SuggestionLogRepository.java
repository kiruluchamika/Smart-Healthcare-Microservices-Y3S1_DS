package com.smarthealthcare.ai_doctor_suggestion.repository;

import com.smarthealthcare.ai_doctor_suggestion.entity.SuggestionLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SuggestionLogRepository extends JpaRepository<SuggestionLog, Long> {
}
