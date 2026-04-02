package com.smarthealthcare.doctor_service.service.impl;

import com.smarthealthcare.doctor_service.dto.DoctorCreateRequest;
import com.smarthealthcare.doctor_service.dto.DoctorDashboardSummaryResponse;
import com.smarthealthcare.doctor_service.dto.DoctorResponse;
import com.smarthealthcare.doctor_service.dto.DoctorUpdateRequest;
import com.smarthealthcare.doctor_service.dto.DoctorVerificationHistoryResponse;
import com.smarthealthcare.doctor_service.dto.DoctorVerificationStatusUpdateRequest;
import com.smarthealthcare.doctor_service.dto.PagedResponse;
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
import java.time.DayOfWeek;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;
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

    private Doctor findDoctorOrThrow(Long doctorId) {
        return doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id: " + doctorId));
    }

    private void validateUniqueDoctorFields(String email, String licenseNumber, Long doctorId) {
        boolean emailExists = doctorId == null
                ? doctorRepository.existsByEmail(email)
                : doctorRepository.existsByEmailAndIdNot(email, doctorId);
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

    private int calculateProfileCompletenessScore(Doctor doctor) {
        int total = 9;
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
}
