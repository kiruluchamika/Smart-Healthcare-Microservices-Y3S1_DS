package com.smarthealthcare.patient_service.repository;

import com.smarthealthcare.patient_service.entity.MedicalHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MedicalHistoryRepository extends JpaRepository<MedicalHistory, Long> {

    List<MedicalHistory> findAllByPatientProfile_IdOrderByEventDateDesc(Long patientProfileId);

    Optional<MedicalHistory> findByIdAndPatientProfile_Id(Long historyId, Long patientProfileId);
}
