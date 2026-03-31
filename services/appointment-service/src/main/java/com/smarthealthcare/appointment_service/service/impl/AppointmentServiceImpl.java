package com.smarthealthcare.appointment_service.service.impl;

import com.smarthealthcare.appointment_service.dto.request.CreateAppointmentRequest;
import com.smarthealthcare.appointment_service.dto.request.RescheduleAppointmentRequest;
import com.smarthealthcare.appointment_service.dto.response.ApiMessageResponse;
import com.smarthealthcare.appointment_service.dto.response.AppointmentResponse;
import com.smarthealthcare.appointment_service.dto.response.AvailabilityResponse;
import com.smarthealthcare.appointment_service.entity.Appointment;
import com.smarthealthcare.appointment_service.enums.AppointmentStatus;
import com.smarthealthcare.appointment_service.exception.BusinessValidationException;
import com.smarthealthcare.appointment_service.exception.ResourceNotFoundException;
import com.smarthealthcare.appointment_service.repository.AppointmentRepository;
import com.smarthealthcare.appointment_service.service.AppointmentService;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AppointmentServiceImpl implements AppointmentService {

    private static final List<AppointmentStatus> ACTIVE_STATUSES =
            List.of(AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED);

    private final AppointmentRepository appointmentRepository;

    public AppointmentServiceImpl(AppointmentRepository appointmentRepository) {
        this.appointmentRepository = appointmentRepository;
    }

    @Override
    public AppointmentResponse createAppointment(CreateAppointmentRequest request) {
        validateAppointmentDate(request.getAppointmentDate());
        validateTimeRange(request.getStartTime(), request.getEndTime());
        ensureDoctorIsAvailable(
                request.getDoctorId(),
                request.getAppointmentDate(),
                request.getStartTime(),
                request.getEndTime());

        Appointment appointment = new Appointment();
        appointment.setPatientId(request.getPatientId());
        appointment.setDoctorId(request.getDoctorId());
        appointment.setAppointmentDate(request.getAppointmentDate());
        appointment.setStartTime(request.getStartTime());
        appointment.setEndTime(request.getEndTime());
        appointment.setAppointmentType(request.getAppointmentType());
        appointment.setStatus(AppointmentStatus.PENDING);
        appointment.setReasonForVisit(request.getReasonForVisit().trim());

        // TODO: Validate doctor and patient existence via other services once service-to-service integration is added.
        Appointment savedAppointment = appointmentRepository.save(appointment);
        return AppointmentResponse.fromEntity(savedAppointment);
    }

    @Override
    @Transactional(readOnly = true)
    public AppointmentResponse getAppointmentById(Long appointmentId) {
        return AppointmentResponse.fromEntity(findAppointment(appointmentId));
    }

    @Override
    @Transactional(readOnly = true)
    public List<AppointmentResponse> getMyAppointments(Long patientId) {
        return appointmentRepository.findByPatientIdOrderByAppointmentDateDescStartTimeDesc(patientId)
                .stream()
                .map(AppointmentResponse::fromEntity)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AppointmentResponse> getAppointmentsByPatientId(Long patientId) {
        return appointmentRepository.findByPatientIdOrderByAppointmentDateDescStartTimeDesc(patientId)
                .stream()
                .map(AppointmentResponse::fromEntity)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AppointmentResponse> getMyDoctorAppointments(Long doctorId) {
        return appointmentRepository.findByDoctorIdOrderByAppointmentDateDescStartTimeDesc(doctorId)
                .stream()
                .map(AppointmentResponse::fromEntity)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AppointmentResponse> getAppointmentsByDoctorId(Long doctorId) {
        return appointmentRepository.findByDoctorIdOrderByAppointmentDateDescStartTimeDesc(doctorId)
                .stream()
                .map(AppointmentResponse::fromEntity)
                .toList();
    }

    @Override
    public AppointmentResponse rescheduleAppointment(
            Long appointmentId, Long patientId, RescheduleAppointmentRequest request) {
        Appointment appointment = findPatientAppointment(appointmentId, patientId);
        validateAppointmentDate(request.getAppointmentDate());
        validateTimeRange(request.getStartTime(), request.getEndTime());

        if (appointment.getStatus() == AppointmentStatus.COMPLETED) {
            throw new BusinessValidationException("Completed appointments cannot be rescheduled");
        }

        if (appointment.getStatus() == AppointmentStatus.CANCELLED) {
            throw new BusinessValidationException("Cancelled appointments cannot be rescheduled");
        }

        if (appointment.getStatus() == AppointmentStatus.REJECTED) {
            throw new BusinessValidationException("Rejected appointments cannot be rescheduled");
        }

        boolean overlapping = appointmentRepository
                .existsByDoctorIdAndAppointmentDateAndStartTimeLessThanAndEndTimeGreaterThanAndStatusInAndIdNot(
                        appointment.getDoctorId(),
                        request.getAppointmentDate(),
                        request.getEndTime(),
                        request.getStartTime(),
                        ACTIVE_STATUSES,
                        appointment.getId());

        if (overlapping) {
            throw new BusinessValidationException("Doctor already has another appointment in the selected time slot");
        }

        appointment.setAppointmentDate(request.getAppointmentDate());
        appointment.setStartTime(request.getStartTime());
        appointment.setEndTime(request.getEndTime());
        appointment.setStatus(AppointmentStatus.PENDING);

        // TODO: Add reschedule history and downstream communication in later phases.
        Appointment updatedAppointment = appointmentRepository.save(appointment);
        return AppointmentResponse.fromEntity(updatedAppointment);
    }

    @Override
    public ApiMessageResponse cancelAppointment(Long appointmentId, Long patientId) {
        Appointment appointment = findPatientAppointment(appointmentId, patientId);

        if (appointment.getStatus() == AppointmentStatus.CANCELLED) {
            throw new BusinessValidationException("Appointment is already cancelled");
        }

        if (appointment.getStatus() == AppointmentStatus.COMPLETED) {
            throw new BusinessValidationException("Completed appointments cannot be cancelled");
        }

        appointment.setStatus(AppointmentStatus.CANCELLED);
        appointmentRepository.save(appointment);
        return new ApiMessageResponse("Appointment cancelled successfully");
    }

    @Override
    public AppointmentResponse acceptAppointment(Long appointmentId, Long doctorId) {
        Appointment appointment = findDoctorAppointment(appointmentId, doctorId);

        if (appointment.getStatus() != AppointmentStatus.PENDING) {
            throw new BusinessValidationException("Only pending appointments can be accepted");
        }

        appointment.setStatus(AppointmentStatus.CONFIRMED);
        Appointment updatedAppointment = appointmentRepository.save(appointment);
        return AppointmentResponse.fromEntity(updatedAppointment);
    }

    @Override
    public AppointmentResponse rejectAppointment(Long appointmentId, Long doctorId) {
        Appointment appointment = findDoctorAppointment(appointmentId, doctorId);

        if (appointment.getStatus() != AppointmentStatus.PENDING) {
            throw new BusinessValidationException("Only pending appointments can be rejected");
        }

        appointment.setStatus(AppointmentStatus.REJECTED);
        Appointment updatedAppointment = appointmentRepository.save(appointment);
        return AppointmentResponse.fromEntity(updatedAppointment);
    }

    @Override
    public AppointmentResponse completeAppointment(Long appointmentId, Long doctorId) {
        Appointment appointment = findDoctorAppointment(appointmentId, doctorId);

        if (appointment.getStatus() != AppointmentStatus.CONFIRMED) {
            throw new BusinessValidationException("Only confirmed appointments can be marked as completed");
        }

        appointment.setStatus(AppointmentStatus.COMPLETED);
        Appointment updatedAppointment = appointmentRepository.save(appointment);
        return AppointmentResponse.fromEntity(updatedAppointment);
    }

    @Override
    @Transactional(readOnly = true)
    public AvailabilityResponse getDoctorAvailability(Long doctorId, LocalDate appointmentDate) {
        validateAppointmentDate(appointmentDate);

        List<AvailabilityResponse.BookedSlot> bookedSlots = appointmentRepository
                .findByDoctorIdAndAppointmentDateAndStatusInOrderByStartTimeAsc(
                        doctorId,
                        appointmentDate,
                        ACTIVE_STATUSES)
                .stream()
                .map(this::mapBookedSlot)
                .toList();

        AvailabilityResponse response = new AvailabilityResponse();
        response.setDoctorId(doctorId);
        response.setAppointmentDate(appointmentDate);
        response.setBookedSlots(bookedSlots);
        response.setMessage(bookedSlots.isEmpty()
                ? "No booked slots found for the selected doctor and date"
                : "Booked slots retrieved successfully");
        return response;
    }

    private Appointment findAppointment(Long appointmentId) {
        return appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with id: " + appointmentId));
    }

    private Appointment findPatientAppointment(Long appointmentId, Long patientId) {
        return appointmentRepository.findByIdAndPatientId(appointmentId, patientId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Appointment not found for patient with id: " + patientId + " and appointment id: " + appointmentId));
    }

    private Appointment findDoctorAppointment(Long appointmentId, Long doctorId) {
        return appointmentRepository.findByIdAndDoctorId(appointmentId, doctorId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Appointment not found for doctor with id: " + doctorId + " and appointment id: " + appointmentId));
    }

    private void ensureDoctorIsAvailable(
            Long doctorId, LocalDate appointmentDate, LocalTime startTime, LocalTime endTime) {
        boolean overlapping = appointmentRepository
                .existsByDoctorIdAndAppointmentDateAndStartTimeLessThanAndEndTimeGreaterThanAndStatusIn(
                        doctorId,
                        appointmentDate,
                        endTime,
                        startTime,
                        ACTIVE_STATUSES);

        if (overlapping) {
            throw new BusinessValidationException("Doctor already has another appointment in the selected time slot");
        }
    }

    private void validateTimeRange(LocalTime startTime, LocalTime endTime) {
        if (!startTime.isBefore(endTime)) {
            throw new BusinessValidationException("Start time must be before end time");
        }
    }

    private void validateAppointmentDate(LocalDate appointmentDate) {
        if (appointmentDate.isBefore(LocalDate.now())) {
            throw new BusinessValidationException("Appointment date cannot be in the past");
        }
    }

    private AvailabilityResponse.BookedSlot mapBookedSlot(Appointment appointment) {
        AvailabilityResponse.BookedSlot bookedSlot = new AvailabilityResponse.BookedSlot();
        bookedSlot.setAppointmentId(appointment.getId());
        bookedSlot.setStartTime(appointment.getStartTime());
        bookedSlot.setEndTime(appointment.getEndTime());
        bookedSlot.setStatus(appointment.getStatus());
        return bookedSlot;
    }
}
