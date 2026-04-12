package com.smarthealthcare.telemedicine_service.repository;

import com.smarthealthcare.telemedicine_service.entity.TelemedicineSession;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TelemedicineSessionRepository extends JpaRepository<TelemedicineSession, Long> {

    Optional<TelemedicineSession> findByAppointmentId(Long appointmentId);
}