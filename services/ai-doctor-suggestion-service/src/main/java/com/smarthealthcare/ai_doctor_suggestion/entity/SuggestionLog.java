package com.smarthealthcare.ai_doctor_suggestion.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "suggestion_log")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SuggestionLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long patientId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String queryText;

    @Column(nullable = false, length = 100)
    private String recommendedSpecialty;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String explanation;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }
}
