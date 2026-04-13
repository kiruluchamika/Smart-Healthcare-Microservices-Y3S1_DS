package com.smarthealthcare.appointment_service.service.impl;

import com.smarthealthcare.appointment_service.dto.request.CreateAppointmentRequest;
import com.smarthealthcare.appointment_service.dto.request.RescheduleAppointmentRequest;
import com.smarthealthcare.appointment_service.dto.request.AcceptAppointmentRequest;
import com.smarthealthcare.appointment_service.dto.request.UpdateAppointmentPaymentStatusRequest;
import com.smarthealthcare.appointment_service.dto.response.ApiMessageResponse;
import com.smarthealthcare.appointment_service.dto.response.AppointmentResponse;
import com.smarthealthcare.appointment_service.dto.response.AvailabilityResponse;
import com.smarthealthcare.appointment_service.entity.Appointment;
import com.smarthealthcare.appointment_service.enums.AppointmentStatus;
import com.smarthealthcare.appointment_service.exception.BusinessValidationException;
import com.smarthealthcare.appointment_service.exception.ResourceNotFoundException;
import com.smarthealthcare.appointment_service.repository.AppointmentRepository;
import com.smarthealthcare.appointment_service.service.AppointmentService;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Locale;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AppointmentServiceImpl implements AppointmentService {

    private static final BigDecimal VIDEO_FIXED_FEE = new BigDecimal("15.00");
    private static final BigDecimal PHYSICAL_FIXED_FEE = new BigDecimal("20.00");
    private static final BigDecimal EXTRA_FEE_CAP_MULTIPLIER = new BigDecimal("2.00");
    private static final String DEFAULT_CURRENCY = "usd";
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
        BigDecimal fixedFee = resolveFixedFee(request.getAppointmentType());
        appointment.setFixedFeeSnapshot(fixedFee);
        appointment.setDoctorExtraFee(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
        appointment.setFinalFee(fixedFee);
        appointment.setFeeCurrency(DEFAULT_CURRENCY);
        appointment.setPaymentStatusHint("UNPAID");

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
    public AppointmentResponse acceptAppointment(Long appointmentId, Long doctorId, AcceptAppointmentRequest request) {
        Appointment appointment = findDoctorAppointment(appointmentId, doctorId);

        if (appointment.getStatus() != AppointmentStatus.PENDING) {
            throw new BusinessValidationException("Only pending appointments can be accepted");
        }

        BigDecimal fixedFee = appointment.getFixedFeeSnapshot() != null
                ? normalizeMoney(appointment.getFixedFeeSnapshot())
                : resolveFixedFee(appointment.getAppointmentType());

        BigDecimal extraFee = request != null && request.getExtraFee() != null
                ? normalizeMoney(request.getExtraFee())
                : BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        if (extraFee.compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessValidationException("Extra fee cannot be negative");
        }

        BigDecimal extraFeeCap = fixedFee.multiply(EXTRA_FEE_CAP_MULTIPLIER).setScale(2, RoundingMode.HALF_UP);
        if (extraFee.compareTo(extraFeeCap) > 0) {
            throw new BusinessValidationException("Extra fee exceeds the maximum allowed limit");
        }

        String extraFeeReason = request != null ? request.getExtraFeeReason() : null;
        if (extraFee.compareTo(BigDecimal.ZERO) > 0 && (extraFeeReason == null || extraFeeReason.trim().isEmpty())) {
            throw new BusinessValidationException("Reason is required when extra fee is added");
        }

        appointment.setStatus(AppointmentStatus.CONFIRMED);
        appointment.setFixedFeeSnapshot(fixedFee);
        appointment.setDoctorExtraFee(extraFee);
        appointment.setFinalFee(fixedFee.add(extraFee).setScale(2, RoundingMode.HALF_UP));
        appointment.setFeeCurrency(DEFAULT_CURRENCY);
        appointment.setFeeLockedAt(LocalDateTime.now());
        appointment.setExtraFeeReason(extraFeeReason == null ? null : extraFeeReason.trim());
        appointment.setPaymentStatusHint("UNPAID");
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

        String paymentStatus = appointment.getPaymentStatusHint() == null
                ? "UNPAID"
                : appointment.getPaymentStatusHint().toUpperCase(Locale.ROOT);
        if (!"PAID".equals(paymentStatus) && !"COMPLETED".equals(paymentStatus)) {
            throw new BusinessValidationException("Appointment cannot be completed before payment is successful");
        }

        if (appointment.getAppointmentType() == com.smarthealthcare.appointment_service.enums.AppointmentType.VIDEO
                && (appointment.getTelemedicineSessionUrl() == null || appointment.getTelemedicineSessionUrl().isBlank())) {
            appointment.setTelemedicineSessionUrl("Video link available before appointment");
        }

        appointment.setStatus(AppointmentStatus.COMPLETED);
        appointment.setPaymentStatusHint("COMPLETED");
        Appointment updatedAppointment = appointmentRepository.save(appointment);
        return AppointmentResponse.fromEntity(updatedAppointment);
    }

    @Override
    public AppointmentResponse updatePaymentStatus(Long appointmentId, UpdateAppointmentPaymentStatusRequest request) {
        Appointment appointment = findAppointment(appointmentId);
        String normalizedStatus = request.getPaymentStatus().trim().toUpperCase(Locale.ROOT);

        appointment.setPaymentStatusHint(normalizedStatus);
        if ("PAID".equals(normalizedStatus) || "COMPLETED".equals(normalizedStatus)) {
            appointment.setPaymentPaidAt(request.getPaidAt() == null ? LocalDateTime.now() : request.getPaidAt());
        }

        if (request.getTelemedicineSessionUrl() != null && !request.getTelemedicineSessionUrl().isBlank()) {
            appointment.setTelemedicineSessionUrl(request.getTelemedicineSessionUrl().trim());
        }

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

    private BigDecimal resolveFixedFee(com.smarthealthcare.appointment_service.enums.AppointmentType appointmentType) {
        BigDecimal fee = appointmentType == com.smarthealthcare.appointment_service.enums.AppointmentType.PHYSICAL
                ? PHYSICAL_FIXED_FEE
                : VIDEO_FIXED_FEE;
        return normalizeMoney(fee);
    }

    private BigDecimal normalizeMoney(BigDecimal amount) {
        return amount.setScale(2, RoundingMode.HALF_UP);
    }
}
