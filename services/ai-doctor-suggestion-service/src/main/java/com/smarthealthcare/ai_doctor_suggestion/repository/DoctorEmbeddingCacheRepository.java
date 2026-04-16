package com.smarthealthcare.ai_doctor_suggestion.repository;

import com.smarthealthcare.ai_doctor_suggestion.entity.DoctorEmbeddingCache;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DoctorEmbeddingCacheRepository extends JpaRepository<DoctorEmbeddingCache, Long> {

    Optional<DoctorEmbeddingCache> findByDoctorId(Long doctorId);
}
