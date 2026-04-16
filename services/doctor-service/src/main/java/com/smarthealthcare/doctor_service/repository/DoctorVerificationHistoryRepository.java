package com.smarthealthcare.doctor_service.repository;

import com.smarthealthcare.doctor_service.entity.DoctorVerificationHistory;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DoctorVerificationHistoryRepository extends JpaRepository<DoctorVerificationHistory, Long> {

    List<DoctorVerificationHistory> findByDoctorIdOrderByChangedAtDesc(Long doctorId);

    void deleteByDoctorId(Long doctorId);
}
