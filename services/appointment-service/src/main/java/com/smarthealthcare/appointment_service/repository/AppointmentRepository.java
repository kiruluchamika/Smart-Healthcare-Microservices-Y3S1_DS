package com.smarthealthcare.appointment_service.repository;

import com.smarthealthcare.appointment_service.entity.Appointment;
import com.smarthealthcare.appointment_service.enums.AppointmentStatus;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    List<Appointment> findByPatientIdOrderByAppointmentDateDescStartTimeDesc(Long patientId);

    List<Appointment> findByDoctorIdOrderByAppointmentDateDescStartTimeDesc(Long doctorId);

    List<Appointment> findByDoctorIdAndAppointmentDateOrderByStartTimeAsc(Long doctorId, LocalDate appointmentDate);

    List<Appointment> findByDoctorIdAndAppointmentDateAndStatusInOrderByStartTimeAsc(
            Long doctorId, LocalDate appointmentDate, Collection<AppointmentStatus> statuses);

    List<Appointment> findByPatientIdAndStatusOrderByAppointmentDateDescStartTimeDesc(
            Long patientId, AppointmentStatus status);

    Optional<Appointment> findByIdAndPatientId(Long id, Long patientId);

    Optional<Appointment> findByIdAndDoctorId(Long id, Long doctorId);

        boolean existsByDoctorIdAndPatientIdAndStatusIn(Long doctorId, Long patientId, Collection<AppointmentStatus> statuses);

    boolean existsByDoctorIdAndAppointmentDateAndStartTimeLessThanAndEndTimeGreaterThanAndStatusIn(
            Long doctorId,
            LocalDate appointmentDate,
            LocalTime endTime,
            LocalTime startTime,
            Collection<AppointmentStatus> statuses);

    boolean existsByDoctorIdAndAppointmentDateAndStartTimeLessThanAndEndTimeGreaterThanAndStatusInAndIdNot(
            Long doctorId,
            LocalDate appointmentDate,
            LocalTime endTime,
            LocalTime startTime,
            Collection<AppointmentStatus> statuses,
            Long id);
}
