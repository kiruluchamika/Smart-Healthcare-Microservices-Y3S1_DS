package com.smarthealthcare.doctor_service.repository;

import com.smarthealthcare.doctor_service.entity.DoctorAvailability;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DoctorAvailabilityRepository extends JpaRepository<DoctorAvailability, Long> {

    List<DoctorAvailability> findByDoctorId(Long doctorId);

    List<DoctorAvailability> findByAvailableTrue();

    long countByDoctorId(Long doctorId);

    long countByDoctorIdAndAvailableTrue(Long doctorId);

    void deleteByDoctorId(Long doctorId);
}
