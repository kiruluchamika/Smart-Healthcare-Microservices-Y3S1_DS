package com.smarthealthcare.patient_service.repository;

import com.smarthealthcare.patient_service.entity.MedicalReport;
import com.smarthealthcare.patient_service.entity.ReportType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MedicalReportRepository extends JpaRepository<MedicalReport, Long> {

    List<MedicalReport> findAllByPatientProfile_IdOrderByUploadedAtDesc(Long patientProfileId);

    List<MedicalReport> findAllByPatientProfile_IdAndReportTypeOrderByUploadedAtDesc(
            Long patientProfileId, ReportType reportType);

    Optional<MedicalReport> findByIdAndPatientProfile_Id(Long reportId, Long patientProfileId);
}
