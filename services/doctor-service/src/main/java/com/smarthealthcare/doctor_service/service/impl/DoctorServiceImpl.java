package com.smarthealthcare.doctor_service.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smarthealthcare.doctor_service.dto.DoctorCreateRequest;
import com.smarthealthcare.doctor_service.dto.DoctorDashboardSummaryResponse;
import com.smarthealthcare.doctor_service.dto.DoctorResponse;
import com.smarthealthcare.doctor_service.dto.DoctorUpdateRequest;
import com.smarthealthcare.doctor_service.dto.DoctorVerificationHistoryResponse;
import com.smarthealthcare.doctor_service.dto.DoctorVerificationStatusUpdateRequest;
import com.smarthealthcare.doctor_service.dto.PagedResponse;
import com.smarthealthcare.doctor_service.dto.ApiSuccessResponse;
import com.smarthealthcare.doctor_service.entity.Doctor;
import com.smarthealthcare.doctor_service.entity.DoctorAvailability;
import com.smarthealthcare.doctor_service.entity.DoctorVerificationHistory;
import com.smarthealthcare.doctor_service.enums.OnboardingState;
import com.smarthealthcare.doctor_service.enums.VerificationStatus;
import com.smarthealthcare.doctor_service.exception.BadRequestException;
import com.smarthealthcare.doctor_service.exception.ResourceNotFoundException;
import com.smarthealthcare.doctor_service.mapper.DoctorMapper;
import com.smarthealthcare.doctor_service.mapper.DoctorVerificationHistoryMapper;
import com.smarthealthcare.doctor_service.repository.DoctorAvailabilityRepository;
import com.smarthealthcare.doctor_service.repository.DoctorRepository;
import com.smarthealthcare.doctor_service.repository.DoctorVerificationHistoryRepository;
import com.smarthealthcare.doctor_service.service.DoctorService;
import jakarta.persistence.criteria.Predicate;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.DayOfWeek;
import java.util.Objects;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DoctorServiceImpl implements DoctorService {

    private static final String CHANGE_REQUEST_PREFIX = "PROFILE_CHANGE_REQUEST";
    private static final String CHANGE_REQUEST_VALUES_PREFIX = "RequestedValues:";
    private static final String LEGACY_CHANGE_REQUEST_DATA_PREFIX = "RequestData:";
    private static final ObjectMapper JSON_MAPPER = new ObjectMapper();
    private static final Set<String> LOCKED_CHANGE_REQUEST_FIELDS = Set.of(
            "firstName",
            "lastName",
            "email",
            "specialization",
            "qualifications",
            "experienceYears",
            "licenseNumber");

    private final DoctorRepository doctorRepository;
    private final DoctorAvailabilityRepository availabilityRepository;
    private final DoctorVerificationHistoryRepository verificationHistoryRepository;
    private final DoctorMapper doctorMapper;
    private final DoctorVerificationHistoryMapper verificationHistoryMapper;

    private final Map<String, Long> idempotencyCache = new ConcurrentHashMap<>();

    @Override
    @Transactional
    public DoctorResponse createDoctor(DoctorCreateRequest request, String idempotencyKey) {
        if (idempotencyKey != null && !idempotencyKey.isBlank() && idempotencyCache.containsKey(idempotencyKey)) {
            return getDoctorById(idempotencyCache.get(idempotencyKey));
        }

        validateUniqueDoctorFields(request.getEmail(), request.getLicenseNumber(), null);

        Doctor doctor = doctorMapper.toEntity(request);
        doctor.setProfileCompletenessScore(calculateProfileCompletenessScore(doctor));
        Doctor savedDoctor = doctorRepository.save(doctor);

        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            idempotencyCache.put(idempotencyKey, savedDoctor.getId());
        }

        return doctorMapper.toResponse(savedDoctor);
    }

    @Override
    @Transactional(readOnly = true)
    public DoctorResponse getDoctorById(Long doctorId) {
        return doctorMapper.toResponse(findDoctorOrThrow(doctorId));
    }

    @Override
    @Transactional(readOnly = true)
    public DoctorResponse getDoctorByEmail(String email) {
        Doctor doctor = doctorRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with email: " + email));
        return doctorMapper.toResponse(doctor);
    }

    @Override
    @Transactional
    public DoctorResponse updateDoctor(Long doctorId, DoctorUpdateRequest request) {
        Doctor doctor = findDoctorOrThrow(doctorId);
        validateImmutableFieldsForApprovedDoctor(doctor, request);
        validateUniqueDoctorFields(request.getEmail(), request.getLicenseNumber(), doctorId);

        doctorMapper.updateEntity(doctor, request);
        doctor.setProfileCompletenessScore(calculateProfileCompletenessScore(doctor));
        Doctor updatedDoctor = doctorRepository.save(doctor);

        return doctorMapper.toResponse(updatedDoctor);
    }

    @Override
    @Transactional
    public void deleteDoctor(Long doctorId) {
        Doctor doctor = findDoctorOrThrow(doctorId);
        availabilityRepository.deleteByDoctorId(doctorId);
        verificationHistoryRepository.deleteByDoctorId(doctorId);
        doctorRepository.delete(doctor);
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<DoctorResponse> getDoctors(int page, int size, String sortBy, String sortDir) {
        Sort sort = "desc".equalsIgnoreCase(sortDir)
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();

        Page<Doctor> doctorPage = doctorRepository.findAll(PageRequest.of(page, size, sort));
        List<DoctorResponse> doctors = doctorPage.getContent()
                .stream()
                .map(doctorMapper::toResponse)
                .toList();

        return PagedResponse.<DoctorResponse>builder()
                .content(doctors)
                .page(doctorPage.getNumber())
                .size(doctorPage.getSize())
                .totalElements(doctorPage.getTotalElements())
                .totalPages(doctorPage.getTotalPages())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<DoctorResponse> searchDoctors(
            String specialization,
            Boolean verified,
            Boolean active,
            Integer minExperience,
            DayOfWeek dayOfWeek) {
        List<Long> doctorIdsByAvailability = null;
        if (dayOfWeek != null) {
            doctorIdsByAvailability = availabilityRepository
                    .findDistinctDoctorIdsByDayOfWeekAndAvailableTrue(dayOfWeek);
            if (doctorIdsByAvailability.isEmpty()) {
                return List.of();
            }
        }

        List<Long> finalDoctorIdsByAvailability = doctorIdsByAvailability;
        Specification<Doctor> specification = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (specialization != null && !specialization.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("specialization")), "%" + specialization.toLowerCase() + "%"));
            }
            if (verified != null) {
                predicates.add(verified
                        ? cb.equal(root.get("verificationStatus"), VerificationStatus.APPROVED)
                        : cb.notEqual(root.get("verificationStatus"), VerificationStatus.APPROVED));
            }
            if (active != null) {
                predicates.add(cb.equal(root.get("active"), active));
            }
            if (minExperience != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("experienceYears"), minExperience));
            }
            if (finalDoctorIdsByAvailability != null) {
                predicates.add(root.get("id").in(finalDoctorIdsByAvailability));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return doctorRepository.findAll(specification)
                .stream()
                .sorted(
                        Comparator.comparing((Doctor d) -> d.getVerificationStatus() == VerificationStatus.APPROVED)
                                .reversed()
                                .thenComparing(Doctor::getExperienceYears, Comparator.reverseOrder())
                                .thenComparing(Doctor::getProfileCompletenessScore, Comparator.reverseOrder()))
                .map(doctorMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public DoctorResponse updateVerificationStatus(Long doctorId, DoctorVerificationStatusUpdateRequest request) {
        Doctor doctor = findDoctorOrThrow(doctorId);
        VerificationStatus previousStatus = doctor.getVerificationStatus();
        doctor.setVerificationStatus(request.getVerificationStatus());

        if (request.getVerificationStatus() == VerificationStatus.APPROVED) {
            doctor.setOnboardingState(OnboardingState.VERIFIED);
            doctor.setActive(Boolean.TRUE);
        } else if (request.getVerificationStatus() == VerificationStatus.REJECTED) {
            doctor.setOnboardingState(OnboardingState.SUSPENDED);
            doctor.setActive(Boolean.FALSE);
        } else {
            doctor.setOnboardingState(OnboardingState.SUBMITTED);
            doctor.setActive(Boolean.FALSE);
        }

        Doctor updatedDoctor = doctorRepository.save(doctor);

        DoctorVerificationHistory history = DoctorVerificationHistory.builder()
                .doctorId(doctorId)
                .previousStatus(previousStatus)
                .newStatus(request.getVerificationStatus())
                .reason(request.getReason())
                .notes(request.getNotes())
                .changedBy(request.getChangedBy() == null ? "system" : request.getChangedBy())
                .build();
        verificationHistoryRepository.save(history);

        return doctorMapper.toResponse(updatedDoctor);
    }

    @Override
    @Transactional(readOnly = true)
    public DoctorDashboardSummaryResponse getDashboardSummary(Long doctorId) {
        Doctor doctor = findDoctorOrThrow(doctorId);

        List<DoctorAvailability> slots = availabilityRepository.findByDoctorId(doctorId);
        long totalSlots = slots.size();
        long availableSlots = slots.stream().filter(DoctorAvailability::getAvailable).count();

        Map<String, Long> weeklySlots = new HashMap<>();
        for (DayOfWeek day : DayOfWeek.values()) {
            weeklySlots.put(day.name(),
                    slots.stream().filter(s -> s.getDayOfWeek() == day && Boolean.TRUE.equals(s.getAvailable()))
                            .count());
        }

        return DoctorDashboardSummaryResponse.builder()
                .doctorId(doctorId)
                .doctorName(doctor.getFirstName() + " " + doctor.getLastName())
                .specialization(doctor.getSpecialization())
                .verificationStatus(doctor.getVerificationStatus())
                .active(doctor.getActive())
                .profileCompletenessScore(doctor.getProfileCompletenessScore())
                .totalSlots(totalSlots)
                .availableSlots(availableSlots)
                .weeklySlotCount(weeklySlots)
                .profileInsight(buildProfileInsight(doctor, totalSlots, availableSlots))
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<DoctorVerificationHistoryResponse> getVerificationHistory(Long doctorId) {
        findDoctorOrThrow(doctorId);
        return verificationHistoryRepository.findByDoctorIdOrderByChangedAtDesc(doctorId)
                .stream()
                .map(verificationHistoryMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public ApiSuccessResponse submitChangeRequest(Long doctorId, Map<String, Object> requestBody, String requestedBy) {
        Doctor doctor = findDoctorOrThrow(doctorId);

        String reason = extractString(requestBody, "reason");
        String notes = extractString(requestBody, "notes");
        List<String> requestedFields = extractRequestedFields(requestBody);
        Map<String, String> requestedValues = extractRequestedValuesFromRequestBody(requestBody, requestedFields);

        if (requestedFields.isEmpty()) {
            throw new BadRequestException("At least one locked field must be selected for a change request.");
        }

        if (!hasText(reason)) {
            throw new BadRequestException("Change request reason is required.");
        }

        String normalizedReason = CHANGE_REQUEST_PREFIX + ": " + reason.trim();

        String serializedRequestedValues = serializeRequestedValues(requestedValues);

        String normalizedNotes = Stream.of(
                "Fields: " + String.join(", ", requestedFields),
                hasText(notes) ? "Notes: " + notes.trim() : null,
            CHANGE_REQUEST_VALUES_PREFIX + serializedRequestedValues)
            .filter(this::hasText)
            .collect(Collectors.joining(" | "));

        String changedBy = hasText(requestedBy) ? requestedBy.trim() : "doctor-" + doctorId;

        DoctorVerificationHistory changeRequestHistory = DoctorVerificationHistory.builder()
            .doctorId(doctorId)
            .previousStatus(doctor.getVerificationStatus())
            .newStatus(doctor.getVerificationStatus())
            .reason(truncate(normalizedReason, 500))
            .notes(truncate(normalizedNotes, 1000))
            .changedBy(truncate(changedBy, 120))
            .build();

        verificationHistoryRepository.save(changeRequestHistory);

        return ApiSuccessResponse.builder()
            .message("Change request submitted for admin review")
            .build();
    }

    @Override
    @Transactional
    public ApiSuccessResponse decideChangeRequest(Long doctorId, Long requestId, Map<String, Object> requestBody, String reviewedBy) {
        Doctor doctor = findDoctorOrThrow(doctorId);

        DoctorVerificationHistory requestEntry = verificationHistoryRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Change request not found with id: " + requestId));

        if (!Objects.equals(requestEntry.getDoctorId(), doctorId)) {
            throw new BadRequestException("Change request does not belong to this doctor.");
        }

        String reason = requestEntry.getReason() == null ? "" : requestEntry.getReason();
        if (!reason.toUpperCase().startsWith(CHANGE_REQUEST_PREFIX)) {
            throw new BadRequestException("Selected history record is not a change request.");
        }

        if (isChangeRequestResolved(requestEntry)) {
            throw new BadRequestException("This change request is already resolved.");
        }

        String action = extractString(requestBody, "action").trim().toUpperCase();
        if (!"APPROVE".equals(action) && !"REJECT".equals(action)) {
            throw new BadRequestException("Action must be APPROVE or REJECT.");
        }

        String adminNotes = extractString(requestBody, "adminNotes");
        String actor = hasText(reviewedBy) ? reviewedBy.trim() : "admin";

        if ("APPROVE".equals(action)) {
            applyRequestedFieldChanges(doctor, requestEntry);
            doctorRepository.save(doctor);
        }

        String resolutionNote = "Resolution: " + action + " by " + actor
                + (hasText(adminNotes) ? " | AdminNotes: " + adminNotes.trim() : "");

        String existingNotes = requestEntry.getNotes() == null ? "" : requestEntry.getNotes();
        requestEntry.setNotes(truncate((existingNotes + " | " + resolutionNote).trim(), 1000));
        verificationHistoryRepository.save(requestEntry);

        DoctorVerificationHistory decisionHistory = DoctorVerificationHistory.builder()
                .doctorId(doctorId)
                .previousStatus(doctor.getVerificationStatus())
                .newStatus(doctor.getVerificationStatus())
                .reason(truncate(CHANGE_REQUEST_PREFIX + "_DECISION: " + action, 500))
                .notes(truncate("RequestId: " + requestId + (hasText(adminNotes) ? " | " + adminNotes.trim() : ""), 1000))
                .changedBy(truncate(actor, 120))
                .build();
        verificationHistoryRepository.save(decisionHistory);

        return ApiSuccessResponse.builder()
                .message("APPROVE".equals(action)
                        ? "Change request approved and profile updated"
                        : "Change request rejected")
                .build();
    }

    private Doctor findDoctorOrThrow(Long doctorId) {
        return doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id: " + doctorId));
    }

    private void validateUniqueDoctorFields(String email, String licenseNumber, Long doctorId) {
        boolean emailExists = doctorId == null
                ? doctorRepository.existsByEmailIgnoreCase(email)
                : doctorRepository.existsByEmailIgnoreCaseAndIdNot(email, doctorId);
        if (emailExists) {
            throw new BadRequestException("Doctor email already exists");
        }

        boolean licenseExists = doctorId == null
                ? doctorRepository.existsByLicenseNumber(licenseNumber)
                : doctorRepository.existsByLicenseNumberAndIdNot(licenseNumber, doctorId);
        if (licenseExists) {
            throw new BadRequestException("Doctor license number already exists");
        }
    }

    private void validateImmutableFieldsForApprovedDoctor(Doctor doctor, DoctorUpdateRequest request) {
        if (doctor.getVerificationStatus() != VerificationStatus.APPROVED) {
            return;
        }

        List<String> lockedFieldChanges = new ArrayList<>();

        if (isChanged(doctor.getFirstName(), request.getFirstName())) {
            lockedFieldChanges.add("firstName");
        }
        if (isChanged(doctor.getLastName(), request.getLastName())) {
            lockedFieldChanges.add("lastName");
        }
        if (isChanged(doctor.getEmail(), request.getEmail())) {
            lockedFieldChanges.add("email");
        }
        if (isChanged(doctor.getLicenseNumber(), request.getLicenseNumber())) {
            lockedFieldChanges.add("licenseNumber");
        }
        if (isChanged(doctor.getSpecialization(), request.getSpecialization())) {
            lockedFieldChanges.add("specialization");
        }
        if (isChanged(doctor.getQualifications(), request.getQualifications())) {
            lockedFieldChanges.add("qualifications");
        }
        if (!Objects.equals(doctor.getExperienceYears(), request.getExperienceYears())) {
            lockedFieldChanges.add("experienceYears");
        }

        if (!lockedFieldChanges.isEmpty()) {
            throw new BadRequestException(
                    "Approved doctor profile has locked fields. Submit an admin review request to change: "
                            + String.join(", ", lockedFieldChanges));
        }
    }

    private boolean isChanged(String currentValue, String requestedValue) {
        String normalizedCurrent = currentValue == null ? "" : currentValue.trim();
        String normalizedRequested = requestedValue == null ? "" : requestedValue.trim();
        return !normalizedCurrent.equals(normalizedRequested);
    }

    private int calculateProfileCompletenessScore(Doctor doctor) {
        int total = 14;
        int filled = 0;

        if (hasText(doctor.getFirstName())) {
            filled++;
        }
        if (hasText(doctor.getLastName())) {
            filled++;
        }
        if (hasText(doctor.getEmail())) {
            filled++;
        }
        if (hasText(doctor.getPhone())) {
            filled++;
        }
        if (hasText(doctor.getSpecialization())) {
            filled++;
        }
        if (hasText(doctor.getQualifications())) {
            filled++;
        }
        if (doctor.getExperienceYears() != null) {
            filled++;
        }
        if (hasText(doctor.getLicenseNumber())) {
            filled++;
        }
        if (hasText(doctor.getBio())) {
            filled++;
        }
        if (hasText(doctor.getBoardCertifications())) {
            filled++;
        }
        if (hasText(doctor.getLanguagesSpoken())) {
            filled++;
        }
        if (hasText(doctor.getClinicLocations())) {
            filled++;
        }
        if (hasText(doctor.getInsuranceProviders())) {
            filled++;
        }
        if (doctor.getLicenseExpiryDate() != null) {
            filled++;
        }
        return (filled * 100) / total;
    }

    private String buildProfileInsight(Doctor doctor, long totalSlots, long availableSlots) {
        List<String> insights = new ArrayList<>();
        if (doctor.getProfileCompletenessScore() < 80) {
            insights.add("Profile details are incomplete.");
        }
        if (doctor.getVerificationStatus() != VerificationStatus.APPROVED) {
            insights.add("Verification is pending action.");
        }
        if (totalSlots == 0) {
            insights.add("No availability slots configured.");
        } else if (availableSlots == 0) {
            insights.add("All slots are currently unavailable.");
        }
        if (insights.isEmpty()) {
            return "Profile is healthy and ready for discovery.";
        }
        return String.join(" ", insights);
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private String extractString(Map<String, Object> requestBody, String key) {
        if (requestBody == null || !requestBody.containsKey(key)) {
            return "";
        }
        Object value = requestBody.get(key);
        return value == null ? "" : String.valueOf(value);
    }

    private List<String> extractRequestedFields(Map<String, Object> requestBody) {
        if (requestBody == null || !requestBody.containsKey("fields")) {
            return List.of();
        }

        Object fieldsValue = requestBody.get("fields");
        if (fieldsValue instanceof List<?> fieldsList) {
            return fieldsList.stream()
                    .filter(Objects::nonNull)
                    .map(String::valueOf)
                    .map(String::trim)
                    .filter(this::hasText)
                    .filter(LOCKED_CHANGE_REQUEST_FIELDS::contains)
                    .distinct()
                    .toList();
        }

        if (fieldsValue == null) {
            return List.of();
        }

        String value = String.valueOf(fieldsValue).trim();
        if (!hasText(value) || !LOCKED_CHANGE_REQUEST_FIELDS.contains(value)) {
            return List.of();
        }
        return List.of(value);
    }

    private Map<String, String> extractRequestedValuesFromRequestBody(Map<String, Object> requestBody, List<String> fields) {
        if (requestBody == null || fields.isEmpty()) {
            return Map.of();
        }

        Object rawValues = requestBody.get("requestedValues");
        if (!(rawValues instanceof Map<?, ?> rawMap)) {
            return Map.of();
        }

        Map<String, String> normalized = new HashMap<>();
        for (String field : fields) {
            Object value = rawMap.get(field);
            if (value == null) {
                continue;
            }
            String text = String.valueOf(value).trim();
            if (hasText(text)) {
                normalized.put(field, text);
            }
        }
        return normalized;
    }

    private void applyRequestedFieldChanges(Doctor doctor, DoctorVerificationHistory requestEntry) {
        List<String> allowedFields = LOCKED_CHANGE_REQUEST_FIELDS.stream().toList();
        Map<String, String> requestedValues = extractRequestedValuesFromHistoryNotes(requestEntry, allowedFields);

        if (requestedValues.isEmpty()) {
            requestedValues = extractRequestedValuesFromLegacyHistoryNotes(requestEntry, allowedFields);
        }

        if (requestedValues.isEmpty()) {
            throw new BadRequestException(
                    "Approved change request has no proposed values to apply. Ask doctor to submit a new request.");
        }

        if (requestedValues.containsKey("firstName")) {
            doctor.setFirstName(requestedValues.get("firstName"));
        }
        if (requestedValues.containsKey("lastName")) {
            doctor.setLastName(requestedValues.get("lastName"));
        }
        if (requestedValues.containsKey("email")) {
            String email = requestedValues.get("email");
            if (doctorRepository.existsByEmailIgnoreCaseAndIdNot(email, doctor.getId())) {
                throw new BadRequestException("Doctor email already exists");
            }
            doctor.setEmail(email);
        }
        if (requestedValues.containsKey("licenseNumber")) {
            String licenseNumber = requestedValues.get("licenseNumber");
            if (doctorRepository.existsByLicenseNumberAndIdNot(licenseNumber, doctor.getId())) {
                throw new BadRequestException("Doctor license number already exists");
            }
            doctor.setLicenseNumber(licenseNumber);
        }
        if (requestedValues.containsKey("specialization")) {
            doctor.setSpecialization(requestedValues.get("specialization"));
        }
        if (requestedValues.containsKey("qualifications")) {
            doctor.setQualifications(requestedValues.get("qualifications"));
        }
        if (requestedValues.containsKey("experienceYears")) {
            try {
                doctor.setExperienceYears(Integer.parseInt(requestedValues.get("experienceYears")));
            } catch (NumberFormatException ex) {
                throw new BadRequestException("Invalid experienceYears value in change request.");
            }
        }

        doctor.setProfileCompletenessScore(calculateProfileCompletenessScore(doctor));
    }

    private boolean isChangeRequestResolved(DoctorVerificationHistory requestEntry) {
        String notes = requestEntry.getNotes();
        if (!hasText(notes)) {
            return false;
        }
        return notes.contains("Resolution: APPROVE") || notes.contains("Resolution: REJECT");
    }

    private String serializeRequestedValues(Map<String, String> requestedValues) {
        if (requestedValues == null || requestedValues.isEmpty()) {
            return "";
        }

        return requestedValues.entrySet().stream()
                .map(entry -> urlEncode(entry.getKey()) + "=" + urlEncode(entry.getValue()))
                .collect(Collectors.joining("&"));
    }

    private Map<String, String> extractRequestedValuesFromHistoryNotes(
            DoctorVerificationHistory requestEntry,
            List<String> allowedFields) {
        String notes = requestEntry.getNotes();
        if (!hasText(notes)) {
            return Map.of();
        }

        int markerIndex = notes.indexOf(CHANGE_REQUEST_VALUES_PREFIX);
        if (markerIndex < 0) {
            return Map.of();
        }

        String serialized = notes.substring(markerIndex + CHANGE_REQUEST_VALUES_PREFIX.length()).trim();
        int resolutionIndex = serialized.indexOf(" | Resolution:");
        if (resolutionIndex >= 0) {
            serialized = serialized.substring(0, resolutionIndex).trim();
        }

        if (!hasText(serialized)) {
            return Map.of();
        }

        Map<String, String> result = new HashMap<>();
        for (String pair : serialized.split("&")) {
            if (!hasText(pair)) {
                continue;
            }

            int equalsIndex = pair.indexOf('=');
            if (equalsIndex <= 0) {
                continue;
            }

            String key = urlDecode(pair.substring(0, equalsIndex)).trim();
            if (!allowedFields.contains(key)) {
                continue;
            }

            String value = urlDecode(pair.substring(equalsIndex + 1)).trim();
            if (hasText(value)) {
                result.put(key, value);
            }
        }

        return result;
    }

    private Map<String, String> extractRequestedValuesFromLegacyHistoryNotes(
            DoctorVerificationHistory requestEntry,
            List<String> allowedFields) {
        String notes = requestEntry.getNotes();
        if (!hasText(notes)) {
            return Map.of();
        }

        int markerIndex = notes.indexOf(LEGACY_CHANGE_REQUEST_DATA_PREFIX);
        if (markerIndex < 0) {
            return Map.of();
        }

        String jsonPayload = notes.substring(markerIndex + LEGACY_CHANGE_REQUEST_DATA_PREFIX.length()).trim();
        int resolutionIndex = jsonPayload.indexOf(" | Resolution:");
        if (resolutionIndex >= 0) {
            jsonPayload = jsonPayload.substring(0, resolutionIndex).trim();
        }

        if (!hasText(jsonPayload)) {
            return Map.of();
        }

        try {
            Map<String, Object> requestData = JSON_MAPPER.readValue(jsonPayload, new TypeReference<Map<String, Object>>() {
            });
            return extractRequestedValuesFromStoredData(requestData, allowedFields);
        } catch (Exception ex) {
            return Map.of();
        }
    }

    private Map<String, String> extractRequestedValuesFromStoredData(Map<String, Object> requestData, List<String> allowedFields) {
        if (requestData == null || requestData.isEmpty()) {
            return Map.of();
        }

        Object valuesObj = requestData.get("requestedValues");
        if (!(valuesObj instanceof Map<?, ?> rawMap)) {
            return Map.of();
        }

        Map<String, String> result = new HashMap<>();
        for (String field : allowedFields) {
            Object rawValue = rawMap.get(field);
            if (rawValue == null) {
                continue;
            }
            String normalized = String.valueOf(rawValue).trim();
            if (hasText(normalized)) {
                result.put(field, normalized);
            }
        }
        return result;
    }

    private String urlEncode(String value) {
        return URLEncoder.encode(value == null ? "" : value, StandardCharsets.UTF_8);
    }

    private String urlDecode(String value) {
        return URLDecoder.decode(value == null ? "" : value, StandardCharsets.UTF_8);
    }

    private String truncate(String value, int maxLength) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        if (normalized.length() <= maxLength) {
            return normalized;
        }
        return normalized.substring(0, maxLength);
    }
}
