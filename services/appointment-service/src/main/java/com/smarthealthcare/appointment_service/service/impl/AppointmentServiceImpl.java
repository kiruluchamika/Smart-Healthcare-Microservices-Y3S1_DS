package com.smarthealthcare.appointment_service.service.impl;

import com.smarthealthcare.appointment_service.client.NotificationClient;
import com.smarthealthcare.appointment_service.dto.integration.AuthUserLookupResponse;
import com.smarthealthcare.appointment_service.dto.integration.DoctorAvailabilityLookupResponse;
import com.smarthealthcare.appointment_service.dto.integration.DoctorLookupResponse;
import com.smarthealthcare.appointment_service.dto.integration.NotificationEventRequest;
import com.smarthealthcare.appointment_service.dto.request.AcceptAppointmentRequest;
import com.smarthealthcare.appointment_service.dto.request.CreateAppointmentRequest;
import com.smarthealthcare.appointment_service.dto.request.RescheduleAppointmentRequest;
import com.smarthealthcare.appointment_service.dto.request.UpdateAppointmentPaymentStatusRequest;
import com.smarthealthcare.appointment_service.dto.response.ApiMessageResponse;
import com.smarthealthcare.appointment_service.dto.response.AppointmentResponse;
import com.smarthealthcare.appointment_service.dto.response.AvailabilityResponse;
import com.smarthealthcare.appointment_service.dto.response.CalendarAvailabilityResponse;
import com.smarthealthcare.appointment_service.entity.Appointment;
import com.smarthealthcare.appointment_service.enums.AppointmentStatus;
import com.smarthealthcare.appointment_service.exception.BusinessValidationException;
import com.smarthealthcare.appointment_service.exception.ExternalServiceException;
import com.smarthealthcare.appointment_service.exception.ResourceNotFoundException;
import com.smarthealthcare.appointment_service.repository.AppointmentRepository;
import com.smarthealthcare.appointment_service.service.AppointmentService;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Service
@Transactional
public class AppointmentServiceImpl implements AppointmentService {

    private static final Logger log = LoggerFactory.getLogger(AppointmentServiceImpl.class);

    private static final BigDecimal VIDEO_FIXED_FEE = new BigDecimal("15.00");
    private static final BigDecimal PHYSICAL_FIXED_FEE = new BigDecimal("20.00");
    private static final BigDecimal EXTRA_FEE_CAP_MULTIPLIER = new BigDecimal("2.00");
    private static final String DEFAULT_CURRENCY = "usd";
    private static final String PATIENT_ROLE = "PATIENT";
    private static final String APPROVED_STATUS = "APPROVED";
    private static final String UNPAID_STATUS = "UNPAID";
    private static final int DEFAULT_SLOT_DURATION_MINUTES = 30;
    private static final int PENDING_EXPIRY_HOURS = 2;
    private static final int MAX_CALENDAR_RANGE_DAYS = 62;
    private static final String SLOT_STATE_AVAILABLE = "AVAILABLE";
    private static final String SLOT_STATE_PENDING = "PENDING";
    private static final String SLOT_STATE_CONFIRMED = "CONFIRMED";

    private static final List<AppointmentStatus> ACTIVE_STATUSES =
            List.of(AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED);

    private static final Set<AppointmentStatus> DOCTOR_REPORT_ACCESS_STATUSES =
            Set.of(AppointmentStatus.CONFIRMED, AppointmentStatus.COMPLETED);

    private static final ParameterizedTypeReference<List<DoctorAvailabilityLookupResponse>>
            DOCTOR_AVAILABILITY_LIST_TYPE = new ParameterizedTypeReference<>() {};

    private final AppointmentRepository appointmentRepository;
    private final RestClient authServiceClient;
    private final RestClient doctorServiceClient;
    private final NotificationClient notificationClient;

    public AppointmentServiceImpl(
            AppointmentRepository appointmentRepository,
            NotificationClient notificationClient,
            @Value("${app.services.auth.base-url}") String authServiceBaseUrl,
            @Value("${app.services.doctor.base-url}") String doctorServiceBaseUrl,
            @Value("${app.services.doctor.username}") String doctorServiceUsername,
            @Value("${app.services.doctor.password}") String doctorServicePassword) {

        this.appointmentRepository = appointmentRepository;
        this.notificationClient = notificationClient;

        this.authServiceClient = RestClient.builder()
                .baseUrl(authServiceBaseUrl)
                .build();

        String basicToken = Base64.getEncoder()
                .encodeToString((doctorServiceUsername + ":" + doctorServicePassword)
                        .getBytes(StandardCharsets.UTF_8));

        this.doctorServiceClient = RestClient.builder()
                .baseUrl(doctorServiceBaseUrl)
                .defaultHeader("Authorization", "Basic " + basicToken)
                .build();
    }

    @Override
    public AppointmentResponse createAppointment(CreateAppointmentRequest request) {
        expireStalePendingAppointments();
        validateAppointmentDate(request.getAppointmentDate());
        validateTimeRange(request.getStartTime(), request.getEndTime());
        validatePatientExists(request.getPatientId());
        validateDoctorIsBookable(request.getDoctorId());

        AvailabilityView availabilityView = buildAvailabilityView(
                request.getDoctorId(),
                request.getAppointmentDate(),
                null);

        GeneratedSlotView selectedSlot = findAvailableSlot(
                availabilityView,
                request.getStartTime(),
                request.getEndTime());

        if (selectedSlot == null) {
            throw new BusinessValidationException(resolveSlotSelectionMessage(availabilityView));
        }

        Appointment appointment = new Appointment();
        appointment.setPatientId(request.getPatientId());
        appointment.setDoctorId(request.getDoctorId());
        appointment.setAppointmentDate(request.getAppointmentDate());
        appointment.setStartTime(selectedSlot.startTime());
        appointment.setEndTime(selectedSlot.endTime());
        appointment.setAppointmentType(request.getAppointmentType());
        appointment.setStatus(AppointmentStatus.PENDING);
        appointment.setStatusReason(null);
        appointment.setReasonForVisit(request.getReasonForVisit().trim());

        BigDecimal fixedFee = resolveFixedFee(request.getAppointmentType());
        appointment.setFixedFeeSnapshot(fixedFee);
        appointment.setDoctorExtraFee(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
        appointment.setFinalFee(fixedFee);
        appointment.setFeeCurrency(DEFAULT_CURRENCY);
        appointment.setPaymentStatusHint(UNPAID_STATUS);

        Appointment savedAppointment = appointmentRepository.save(appointment);
        return AppointmentResponse.fromEntity(savedAppointment);
    }

    @Override
    public AppointmentResponse getAppointmentById(Long appointmentId) {
        expireStalePendingAppointments();
        return AppointmentResponse.fromEntity(findAppointment(appointmentId));
    }

    @Override
    public List<AppointmentResponse> getMyAppointments(Long patientId) {
        expireStalePendingAppointments();
        return appointmentRepository.findByPatientIdOrderByAppointmentDateDescStartTimeDesc(patientId)
                .stream()
                .map(AppointmentResponse::fromEntity)
                .toList();
    }

    @Override
    public List<AppointmentResponse> getAppointmentsByPatientId(Long patientId) {
        expireStalePendingAppointments();
        return appointmentRepository.findByPatientIdOrderByAppointmentDateDescStartTimeDesc(patientId)
                .stream()
                .map(AppointmentResponse::fromEntity)
                .toList();
    }

    @Override
    public List<AppointmentResponse> getMyDoctorAppointments(Long doctorId) {
        expireStalePendingAppointments();
        return appointmentRepository.findByDoctorIdOrderByAppointmentDateDescStartTimeDesc(doctorId)
                .stream()
                .map(AppointmentResponse::fromEntity)
                .toList();
    }

    @Override
    public List<AppointmentResponse> getAppointmentsByDoctorId(Long doctorId) {
        expireStalePendingAppointments();
        return appointmentRepository.findByDoctorIdOrderByAppointmentDateDescStartTimeDesc(doctorId)
                .stream()
                .map(AppointmentResponse::fromEntity)
                .toList();
    }

    @Override
    public AppointmentResponse rescheduleAppointment(
            Long appointmentId,
            Long patientId,
            RescheduleAppointmentRequest request) {

        expireStalePendingAppointments();
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

        if (appointment.getStatus() == AppointmentStatus.EXPIRED) {
            throw new BusinessValidationException("Expired appointments cannot be rescheduled");
        }

        AvailabilityView availabilityView = buildAvailabilityView(
                appointment.getDoctorId(),
                request.getAppointmentDate(),
                appointment.getId());

        GeneratedSlotView selectedSlot = findAvailableSlot(
                availabilityView,
                request.getStartTime(),
                request.getEndTime());

        if (selectedSlot == null) {
            throw new BusinessValidationException(resolveSlotSelectionMessage(availabilityView));
        }

        appointment.setAppointmentDate(request.getAppointmentDate());
        appointment.setStartTime(selectedSlot.startTime());
        appointment.setEndTime(selectedSlot.endTime());
        appointment.setStatus(AppointmentStatus.PENDING);
        appointment.setStatusReason("Rescheduled by patient and waiting for doctor confirmation");

        resetWorkflowStateForReschedule(appointment);

        Appointment updatedAppointment = appointmentRepository.save(appointment);
        return AppointmentResponse.fromEntity(updatedAppointment);
    }

    @Override
    public ApiMessageResponse cancelAppointment(Long appointmentId, Long patientId) {
        expireStalePendingAppointments();
        Appointment appointment = findPatientAppointment(appointmentId, patientId);

        if (appointment.getStatus() == AppointmentStatus.CANCELLED) {
            throw new BusinessValidationException("Appointment is already cancelled");
        }

        if (appointment.getStatus() == AppointmentStatus.COMPLETED) {
            throw new BusinessValidationException("Completed appointments cannot be cancelled");
        }

        if (appointment.getStatus() == AppointmentStatus.REJECTED) {
            throw new BusinessValidationException("Rejected appointments cannot be cancelled");
        }

        if (appointment.getStatus() == AppointmentStatus.EXPIRED) {
            throw new BusinessValidationException("Expired appointments cannot be cancelled");
        }

        appointment.setStatus(AppointmentStatus.CANCELLED);
        appointment.setStatusReason("Cancelled by patient");
        appointmentRepository.save(appointment);

        return new ApiMessageResponse("Appointment cancelled successfully");
    }

    @Override
    public AppointmentResponse acceptAppointment(
            Long appointmentId,
            Long doctorId,
            AcceptAppointmentRequest request) {

        expireStalePendingAppointments();
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

        BigDecimal extraFeeCap = fixedFee.multiply(EXTRA_FEE_CAP_MULTIPLIER)
                .setScale(2, RoundingMode.HALF_UP);

        if (extraFee.compareTo(extraFeeCap) > 0) {
            throw new BusinessValidationException("Extra fee exceeds the maximum allowed limit");
        }

        String extraFeeReason = request != null ? request.getExtraFeeReason() : null;
        if (extraFee.compareTo(BigDecimal.ZERO) > 0
                && (extraFeeReason == null || extraFeeReason.trim().isEmpty())) {
            throw new BusinessValidationException("Reason is required when extra fee is added");
        }

        appointment.setStatus(AppointmentStatus.CONFIRMED);
        appointment.setStatusReason(null);
        appointment.setFixedFeeSnapshot(fixedFee);
        appointment.setDoctorExtraFee(extraFee);
        appointment.setFinalFee(fixedFee.add(extraFee).setScale(2, RoundingMode.HALF_UP));
        appointment.setFeeCurrency(DEFAULT_CURRENCY);
        appointment.setFeeLockedAt(LocalDateTime.now());
        appointment.setExtraFeeReason(extraFeeReason == null ? null : extraFeeReason.trim());
        appointment.setPaymentStatusHint(UNPAID_STATUS);

        Appointment updatedAppointment = appointmentRepository.save(appointment);
        publishAppointmentConfirmedNotifications(updatedAppointment);

        return AppointmentResponse.fromEntity(updatedAppointment);
    }

    @Override
    public AppointmentResponse rejectAppointment(Long appointmentId, Long doctorId) {
        expireStalePendingAppointments();
        Appointment appointment = findDoctorAppointment(appointmentId, doctorId);

        if (appointment.getStatus() != AppointmentStatus.PENDING) {
            throw new BusinessValidationException("Only pending appointments can be rejected");
        }

        appointment.setStatus(AppointmentStatus.REJECTED);
        appointment.setStatusReason("Rejected by doctor");

        Appointment updatedAppointment = appointmentRepository.save(appointment);
        return AppointmentResponse.fromEntity(updatedAppointment);
    }

    @Override
    public AppointmentResponse completeAppointment(Long appointmentId, Long doctorId) {
        expireStalePendingAppointments();
        Appointment appointment = findDoctorAppointment(appointmentId, doctorId);

        if (appointment.getStatus() != AppointmentStatus.CONFIRMED) {
            throw new BusinessValidationException("Only confirmed appointments can be marked as completed");
        }

        String paymentStatus = appointment.getPaymentStatusHint() == null
                ? UNPAID_STATUS
                : appointment.getPaymentStatusHint().toUpperCase(Locale.ROOT);

        if (!"PAID".equals(paymentStatus) && !"COMPLETED".equals(paymentStatus)) {
            throw new BusinessValidationException("Appointment cannot be completed before payment is successful");
        }

        if (appointment.getAppointmentType()
                == com.smarthealthcare.appointment_service.enums.AppointmentType.VIDEO
                && (appointment.getTelemedicineSessionUrl() == null
                || appointment.getTelemedicineSessionUrl().isBlank())) {
            appointment.setTelemedicineSessionUrl("Video link available before appointment");
        }

        appointment.setStatus(AppointmentStatus.COMPLETED);
        appointment.setStatusReason(null);
        appointment.setPaymentStatusHint("COMPLETED");

        Appointment updatedAppointment = appointmentRepository.save(appointment);
        return AppointmentResponse.fromEntity(updatedAppointment);
    }

    @Override
    public AppointmentResponse updatePaymentStatus(
            Long appointmentId,
            UpdateAppointmentPaymentStatusRequest request) {

        expireStalePendingAppointments();
        Appointment appointment = findAppointment(appointmentId);

        String normalizedStatus = request.getPaymentStatus().trim().toUpperCase(Locale.ROOT);
        appointment.setPaymentStatusHint(normalizedStatus);

        if ("PAID".equals(normalizedStatus) || "COMPLETED".equals(normalizedStatus)) {
            appointment.setPaymentPaidAt(
                    request.getPaidAt() == null ? LocalDateTime.now() : request.getPaidAt());
        }

        if (request.getTelemedicineSessionUrl() != null
                && !request.getTelemedicineSessionUrl().isBlank()) {
            appointment.setTelemedicineSessionUrl(request.getTelemedicineSessionUrl().trim());
        }

        Appointment updatedAppointment = appointmentRepository.save(appointment);
        return AppointmentResponse.fromEntity(updatedAppointment);
    }

    @Override
    public AvailabilityResponse getDoctorAvailability(Long doctorId, LocalDate appointmentDate) {
        expireStalePendingAppointments();
        validateAppointmentDate(appointmentDate);
        validateDoctorIsBookable(doctorId);

        AvailabilityView availabilityView = buildAvailabilityView(doctorId, appointmentDate, null);
        return toAvailabilityResponse(availabilityView);
    }

    @Override
    public CalendarAvailabilityResponse getDoctorAvailabilityCalendar(
            Long doctorId,
            LocalDate rangeStart,
            LocalDate rangeEnd) {

        expireStalePendingAppointments();
        validateAvailabilityRange(rangeStart, rangeEnd);
        validateDoctorIsBookable(doctorId);

        List<CalendarAvailabilityResponse.DateAvailability> dates = new ArrayList<>();
        LocalDate cursor = rangeStart;

        while (!cursor.isAfter(rangeEnd)) {
            AvailabilityView availabilityView = buildAvailabilityView(doctorId, cursor, null);
            dates.add(toCalendarDateAvailability(availabilityView));
            cursor = cursor.plusDays(1);
        }

        CalendarAvailabilityResponse response = new CalendarAvailabilityResponse();
        response.setDoctorId(doctorId);
        response.setRangeStart(rangeStart);
        response.setRangeEnd(rangeEnd);
        response.setDates(dates);

        return response;
    }

    @Override
    public boolean hasDoctorCompletedAppointmentWithPatient(Long doctorId, Long patientId) {
        expireStalePendingAppointments();
        return appointmentRepository.existsByDoctorIdAndPatientIdAndStatusIn(
                doctorId,
                patientId,
                DOCTOR_REPORT_ACCESS_STATUSES);
    }

    public void expireStalePendingAppointments() {
        LocalDateTime expiryCutoff = LocalDateTime.now().minusHours(PENDING_EXPIRY_HOURS);

        List<Appointment> staleAppointments = appointmentRepository.findByStatusAndCreatedAtBefore(
                AppointmentStatus.PENDING,
                expiryCutoff);

        if (staleAppointments.isEmpty()) {
            return;
        }

        staleAppointments.forEach(appointment -> {
            appointment.setStatus(AppointmentStatus.EXPIRED);
            appointment.setStatusReason("Pending request expired after 2 hours without doctor action");
        });

        appointmentRepository.saveAll(staleAppointments);
    }

    private Appointment findAppointment(Long appointmentId) {
        return appointmentRepository.findById(appointmentId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Appointment not found with id: " + appointmentId));
    }

    private Appointment findPatientAppointment(Long appointmentId, Long patientId) {
        return appointmentRepository.findByIdAndPatientId(appointmentId, patientId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Appointment not found for patient with id: "
                                + patientId
                                + " and appointment id: "
                                + appointmentId));
    }

    private Appointment findDoctorAppointment(Long appointmentId, Long doctorId) {
        return appointmentRepository.findByIdAndDoctorId(appointmentId, doctorId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Appointment not found for doctor with id: "
                                + doctorId
                                + " and appointment id: "
                                + appointmentId));
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

    private void validateAvailabilityRange(LocalDate rangeStart, LocalDate rangeEnd) {
        if (rangeStart.isBefore(LocalDate.now())) {
            throw new BusinessValidationException("Availability range cannot start in the past");
        }

        if (rangeEnd.isBefore(rangeStart)) {
            throw new BusinessValidationException(
                    "Availability range end must be on or after the start date");
        }

        long rangeLength = ChronoUnit.DAYS.between(rangeStart, rangeEnd);
        if (rangeLength > MAX_CALENDAR_RANGE_DAYS) {
            throw new BusinessValidationException("Availability range is too large");
        }
    }

    private void validatePatientExists(Long patientId) {
        AuthUserLookupResponse user = getAuthUserById(patientId);

        if (user == null || user.getId() == null) {
            throw new BusinessValidationException("Selected patient account does not exist");
        }

        String userRole = user.getRole() == null
                ? ""
                : user.getRole().trim().toUpperCase(Locale.ROOT);

        if (!PATIENT_ROLE.equals(userRole)) {
            throw new BusinessValidationException("Selected user is not a patient account");
        }
    }

    private void validateDoctorIsBookable(Long doctorId) {
        DoctorLookupResponse doctor = getDoctorById(doctorId);

        if (doctor == null || doctor.getId() == null) {
            throw new BusinessValidationException("Selected doctor does not exist");
        }

        if (!Boolean.TRUE.equals(doctor.getActive())) {
            throw new BusinessValidationException(
                    "Selected doctor is currently unavailable for appointments");
        }

        String verificationStatus = doctor.getVerificationStatus() == null
                ? ""
                : doctor.getVerificationStatus().trim().toUpperCase(Locale.ROOT);

        if (!APPROVED_STATUS.equals(verificationStatus)) {
            throw new BusinessValidationException(
                    "Selected doctor is not approved for appointment booking");
        }
    }

    private AuthUserLookupResponse getAuthUserById(Long patientId) {
        try {
            return authServiceClient.get()
                    .uri("/users/{userId}", patientId)
                    .retrieve()
                    .body(AuthUserLookupResponse.class);
        } catch (RestClientException ex) {
            log.error("Failed to validate patient account {}", patientId, ex);
            throw new ExternalServiceException("Unable to validate patient account right now", ex);
        }
    }

    private DoctorLookupResponse getDoctorById(Long doctorId) {
        try {
            return doctorServiceClient.get()
                    .uri("/{doctorId}", doctorId)
                    .retrieve()
                    .body(DoctorLookupResponse.class);
        } catch (RestClientException ex) {
            log.error("Failed to validate doctor profile {}", doctorId, ex);
            throw new ExternalServiceException("Unable to validate doctor profile right now", ex);
        }
    }

    private List<DoctorAvailabilityLookupResponse> getDoctorAvailabilities(Long doctorId) {
        try {
            List<DoctorAvailabilityLookupResponse> availabilities = doctorServiceClient.get()
                    .uri("/{doctorId}/availability", doctorId)
                    .retrieve()
                    .body(DOCTOR_AVAILABILITY_LIST_TYPE);

            return availabilities == null ? List.of() : availabilities;
        } catch (RestClientException ex) {
            log.error("Failed to fetch doctor availability {}", doctorId, ex);
            throw new ExternalServiceException("Unable to load doctor availability right now", ex);
        }
    }

    private void resetWorkflowStateForReschedule(Appointment appointment) {
        BigDecimal fixedFee = appointment.getFixedFeeSnapshot() != null
                ? normalizeMoney(appointment.getFixedFeeSnapshot())
                : resolveFixedFee(appointment.getAppointmentType());

        appointment.setFixedFeeSnapshot(fixedFee);
        appointment.setDoctorExtraFee(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
        appointment.setFinalFee(fixedFee);
        appointment.setFeeLockedAt(null);
        appointment.setExtraFeeReason(null);
        appointment.setPaymentStatusHint(UNPAID_STATUS);
        appointment.setPaymentPaidAt(null);
        appointment.setTelemedicineSessionUrl(null);
    }

    private AvailabilityView buildAvailabilityView(
            Long doctorId,
            LocalDate appointmentDate,
            Long excludedAppointmentId) {

        List<DoctorAvailabilityLookupResponse> availabilityWindows = getDoctorAvailabilities(doctorId)
                .stream()
                .filter(availability -> Boolean.TRUE.equals(availability.getIsAvailable()))
                .filter(availability -> matchesAppointmentDate(availability, appointmentDate))
                .filter(availability -> isWithinEffectiveRange(availability, appointmentDate))
                .sorted(Comparator.comparing(DoctorAvailabilityLookupResponse::getStartTime))
                .toList();

        List<Appointment> blockingAppointments = appointmentRepository
                .findByDoctorIdAndAppointmentDateAndStatusInOrderByStartTimeAsc(
                        doctorId,
                        appointmentDate,
                        ACTIVE_STATUSES)
                .stream()
                .filter(appointment -> excludedAppointmentId == null
                        || !appointment.getId().equals(excludedAppointmentId))
                .toList();

        List<AvailabilityResponse.BookedSlot> bookedSlots = blockingAppointments.stream()
                .map(this::mapBookedSlot)
                .toList();

        List<GeneratedSlotView> generatedSlots = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        for (DoctorAvailabilityLookupResponse availabilityWindow : availabilityWindows) {
            LocalTime cursor = availabilityWindow.getStartTime();
            int durationMinutes = resolveSlotDuration(availabilityWindow.getSlotDuration());

            while (!cursor.plusMinutes(durationMinutes).isAfter(availabilityWindow.getEndTime())) {
                LocalTime slotStart = cursor;
                LocalTime slotEnd = cursor.plusMinutes(durationMinutes);
                cursor = slotEnd;

                if (appointmentDate.equals(now.toLocalDate())
                        && !slotStart.isAfter(now.toLocalTime())) {
                    continue;
                }

                Appointment blockingAppointment =
                        findBlockingAppointment(blockingAppointments, slotStart, slotEnd);

                generatedSlots.add(toGeneratedSlotView(blockingAppointment, slotStart, slotEnd));
            }
        }

        String message;
        if (availabilityWindows.isEmpty()) {
            message = "Doctor is not available on the selected date";
        } else if (generatedSlots.isEmpty()) {
            message = "No bookable slots remain for the selected date";
        } else {
            message = "Slots retrieved successfully";
        }

        return new AvailabilityView(
                doctorId,
                appointmentDate,
                !availabilityWindows.isEmpty(),
                bookedSlots,
                generatedSlots,
                message);
    }

    private boolean isWithinEffectiveRange(
            DoctorAvailabilityLookupResponse availability,
            LocalDate appointmentDate) {

        LocalDate effectiveFrom = availability.getEffectiveFrom();
        LocalDate effectiveTo = availability.getEffectiveTo();

        boolean startsBeforeOrOnDate = effectiveFrom == null || !effectiveFrom.isAfter(appointmentDate);
        boolean endsAfterOrOnDate = effectiveTo == null || !effectiveTo.isBefore(appointmentDate);

        return startsBeforeOrOnDate && endsAfterOrOnDate;
    }

    private boolean matchesAppointmentDate(
            DoctorAvailabilityLookupResponse availability,
            LocalDate appointmentDate) {

        if (availability.getEffectiveFrom() != null && availability.getEffectiveTo() != null) {
            return true;
        }

        return availability.getDayOfWeek() == appointmentDate.getDayOfWeek();
    }

    private int resolveSlotDuration(Integer slotDuration) {
        if (slotDuration == null || slotDuration <= 0) {
            return DEFAULT_SLOT_DURATION_MINUTES;
        }
        return slotDuration;
    }

    private Appointment findBlockingAppointment(
            List<Appointment> appointments,
            LocalTime slotStart,
            LocalTime slotEnd) {

        return appointments.stream()
                .filter(appointment ->
                        appointment.getStartTime().isBefore(slotEnd)
                                && appointment.getEndTime().isAfter(slotStart))
                .findFirst()
                .orElse(null);
    }

    private GeneratedSlotView toGeneratedSlotView(
            Appointment blockingAppointment,
            LocalTime slotStart,
            LocalTime slotEnd) {

        if (blockingAppointment == null) {
            return new GeneratedSlotView(null, slotStart, slotEnd, SLOT_STATE_AVAILABLE);
        }

        String state = blockingAppointment.getStatus() == AppointmentStatus.PENDING
                ? SLOT_STATE_PENDING
                : SLOT_STATE_CONFIRMED;

        return new GeneratedSlotView(
                blockingAppointment.getId(),
                slotStart,
                slotEnd,
                state);
    }

    private AvailabilityResponse toAvailabilityResponse(AvailabilityView availabilityView) {
        AvailabilityResponse response = new AvailabilityResponse();
        response.setDoctorId(availabilityView.doctorId());
        response.setAppointmentDate(availabilityView.appointmentDate());
        response.setAvailableOnDate(availabilityView.availableOnDate());
        response.setBookedSlots(availabilityView.bookedSlots());
        response.setSlots(availabilityView.slots().stream().map(this::mapGeneratedSlot).toList());
        response.setMessage(availabilityView.message());
        return response;
    }

    private CalendarAvailabilityResponse.DateAvailability toCalendarDateAvailability(
            AvailabilityView availabilityView) {

        CalendarAvailabilityResponse.DateAvailability dateAvailability =
                new CalendarAvailabilityResponse.DateAvailability();

        dateAvailability.setAppointmentDate(availabilityView.appointmentDate());
        dateAvailability.setAvailableOnDate(availabilityView.availableOnDate());
        dateAvailability.setHasAvailableSlots(
                availabilityView.slots().stream()
                        .anyMatch(slot -> SLOT_STATE_AVAILABLE.equals(slot.state())));
        dateAvailability.setMessage(availabilityView.message());

        return dateAvailability;
    }

    private GeneratedSlotView findAvailableSlot(
            AvailabilityView availabilityView,
            LocalTime requestedStartTime,
            LocalTime requestedEndTime) {

        return availabilityView.slots().stream()
                .filter(slot -> SLOT_STATE_AVAILABLE.equals(slot.state()))
                .filter(slot -> slot.startTime().equals(requestedStartTime)
                        && slot.endTime().equals(requestedEndTime))
                .findFirst()
                .orElse(null);
    }

    private String resolveSlotSelectionMessage(AvailabilityView availabilityView) {
        if (!availabilityView.availableOnDate()) {
            return "Doctor is not available on the selected date";
        }

        return "This slot is no longer available. Please choose another time.";
    }

    private AvailabilityResponse.BookedSlot mapBookedSlot(Appointment appointment) {
        AvailabilityResponse.BookedSlot bookedSlot = new AvailabilityResponse.BookedSlot();
        bookedSlot.setAppointmentId(appointment.getId());
        bookedSlot.setStartTime(appointment.getStartTime());
        bookedSlot.setEndTime(appointment.getEndTime());
        bookedSlot.setStatus(appointment.getStatus());
        return bookedSlot;
    }

    private AvailabilityResponse.GeneratedSlot mapGeneratedSlot(GeneratedSlotView slot) {
        AvailabilityResponse.GeneratedSlot generatedSlot = new AvailabilityResponse.GeneratedSlot();
        generatedSlot.setAppointmentId(slot.appointmentId());
        generatedSlot.setStartTime(slot.startTime());
        generatedSlot.setEndTime(slot.endTime());
        generatedSlot.setState(slot.state());
        return generatedSlot;
    }

    private BigDecimal resolveFixedFee(
            com.smarthealthcare.appointment_service.enums.AppointmentType appointmentType) {

        BigDecimal fee = appointmentType
                == com.smarthealthcare.appointment_service.enums.AppointmentType.PHYSICAL
                ? PHYSICAL_FIXED_FEE
                : VIDEO_FIXED_FEE;

        return normalizeMoney(fee);
    }

    private BigDecimal normalizeMoney(BigDecimal amount) {
        return amount.setScale(2, RoundingMode.HALF_UP);
    }

    private void publishAppointmentConfirmedNotifications(Appointment appointment) {
        LocalDateTime scheduledFor =
                appointment.getAppointmentDate().atTime(appointment.getStartTime());

        publishNotification(
                "APPOINTMENT_CONFIRMED",
                "PATIENT",
                appointment.getPatientId(),
                appointment.getId(),
                null,
                null,
                scheduledFor);

        publishNotification(
                "APPOINTMENT_CONFIRMED_DOCTOR",
                "DOCTOR",
                appointment.getDoctorId(),
                appointment.getId(),
                null,
                null,
                scheduledFor);
    }

    private void publishNotification(
            String eventType,
            String targetRole,
            Long targetUserId,
            Long appointmentId,
            String title,
            String message,
            LocalDateTime scheduledFor) {

        try {
            notificationClient.sendEvent(new NotificationEventRequest(
                    eventType,
                    targetRole,
                    targetUserId,
                    null,
                    appointmentId,
                    title,
                    message,
                    scheduledFor));
        } catch (Exception ex) {
            log.warn("Notification dispatch failed for appointment {}: {}", appointmentId, ex.getMessage());
        }
    }

    private record AvailabilityView(
            Long doctorId,
            LocalDate appointmentDate,
            boolean availableOnDate,
            List<AvailabilityResponse.BookedSlot> bookedSlots,
            List<GeneratedSlotView> slots,
            String message) {
    }

    private record GeneratedSlotView(
            Long appointmentId,
            LocalTime startTime,
            LocalTime endTime,
            String state) {
    }
}