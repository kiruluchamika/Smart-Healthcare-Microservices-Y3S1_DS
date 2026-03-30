package com.smarthealthcare.patient_service.repository;

import com.smarthealthcare.patient_service.entity.PatientProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PatientProfileRepository extends JpaRepository<PatientProfile, Long> {
    Optional<PatientProfile> findByAuthUserId(Long authUserId);
    boolean existsByAuthUserId(Long authUserId);
}
