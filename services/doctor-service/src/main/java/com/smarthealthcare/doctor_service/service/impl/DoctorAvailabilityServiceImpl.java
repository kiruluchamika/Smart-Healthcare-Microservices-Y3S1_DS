package com.smarthealthcare.doctor_service.service.impl;

import com.smarthealthcare.doctor_service.dto.DoctorAvailabilityCreateRequest;
import com.smarthealthcare.doctor_service.dto.DoctorAvailabilityResponse;
import com.smarthealthcare.doctor_service.dto.DoctorAvailabilityUpdateRequest;
import com.smarthealthcare.doctor_service.entity.DoctorAvailability;
import com.smarthealthcare.doctor_service.exception.BadRequestException;
import com.smarthealthcare.doctor_service.exception.ResourceNotFoundException;
import com.smarthealthcare.doctor_service.mapper.DoctorAvailabilityMapper;
import com.smarthealthcare.doctor_service.repository.DoctorAvailabilityRepository;
import com.smarthealthcare.doctor_service.repository.DoctorRepository;
import com.smarthealthcare.doctor_service.service.DoctorAvailabilityService;
import java.time.Duration;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DoctorAvailabilityServiceImpl implements DoctorAvailabilityService {

    private static final long MIN_SLOT_MINUTES = 15;

    private final DoctorRepository doctorRepository;
    private final DoctorAvailabilityRepository availabilityRepository;
    private final DoctorAvailabilityMapper availabilityMapper;

    @Override
    @Transactional
    public DoctorAvailabilityResponse createAvailability(Long doctorId, DoctorAvailabilityCreateRequest request) {
        ensureDoctorExists(doctorId);
        validateSlotRules(
                doctorId,
                request.getDayOfWeek(),
                request.getStartTime(),
                request.getEndTime(),
                request.getSlotDuration(),
                null);

        DoctorAvailability availability = availabilityMapper.toEntity(doctorId, request);
        DoctorAvailability saved = availabilityRepository.save(availability);
        return availabilityMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DoctorAvailabilityResponse> getAvailabilities(Long doctorId) {
        ensureDoctorExists(doctorId);
        return availabilityRepository.findByDoctorIdOrderByDayOfWeekAscStartTimeAsc(doctorId)
                .stream()
                .map(availabilityMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public DoctorAvailabilityResponse updateAvailability(Long doctorId, Long availabilityId,
            DoctorAvailabilityUpdateRequest request) {
        ensureDoctorExists(doctorId);
        DoctorAvailability availability = findAvailabilityOrThrow(doctorId, availabilityId);
        validateSlotRules(
                doctorId,
                request.getDayOfWeek(),
                request.getStartTime(),
                request.getEndTime(),
                request.getSlotDuration(),
                availabilityId);

        availabilityMapper.updateEntity(availability, request);
        DoctorAvailability updated = availabilityRepository.save(availability);
        return availabilityMapper.toResponse(updated);
    }

    @Override
    @Transactional
    public void deleteAvailability(Long doctorId, Long availabilityId) {
        ensureDoctorExists(doctorId);
        DoctorAvailability availability = findAvailabilityOrThrow(doctorId, availabilityId);
        availabilityRepository.delete(availability);
    }

    private void ensureDoctorExists(Long doctorId) {
        if (!doctorRepository.existsById(doctorId)) {
            throw new ResourceNotFoundException("Doctor not found with id: " + doctorId);
        }
    }

    private DoctorAvailability findAvailabilityOrThrow(Long doctorId, Long availabilityId) {
        DoctorAvailability availability = availabilityRepository.findById(availabilityId)
                .orElseThrow(() -> new ResourceNotFoundException("Availability not found with id: " + availabilityId));
        if (!availability.getDoctorId().equals(doctorId)) {
            throw new BadRequestException("Availability does not belong to doctor id: " + doctorId);
        }
        return availability;
    }

    private void validateSlotRules(
            Long doctorId,
            java.time.DayOfWeek dayOfWeek,
            java.time.LocalTime startTime,
            java.time.LocalTime endTime,
            Integer slotDuration,
            Long availabilityId) {
        if (!startTime.isBefore(endTime)) {
            throw new BadRequestException("Start time must be before end time");
        }

        if (slotDuration == null || (slotDuration != 15 && slotDuration != 30 && slotDuration != 45 && slotDuration != 60)) {
            throw new BadRequestException("Slot duration must be one of 15, 30, 45, or 60 minutes");
        }

        long durationMinutes = Duration.between(startTime, endTime).toMinutes();
        if (durationMinutes < MIN_SLOT_MINUTES) {
            throw new BadRequestException("Availability slot must be at least " + MIN_SLOT_MINUTES + " minutes");
        }

        if (durationMinutes < slotDuration) {
            throw new BadRequestException("Availability range must be at least as long as the selected slot duration");
        }

        boolean hasOverlap = availabilityId == null
                ? availabilityRepository.existsByDoctorIdAndDayOfWeekAndStartTimeLessThanAndEndTimeGreaterThan(
                        doctorId, dayOfWeek, endTime, startTime)
                : availabilityRepository.existsByDoctorIdAndDayOfWeekAndStartTimeLessThanAndEndTimeGreaterThanAndIdNot(
                        doctorId, dayOfWeek, endTime, startTime, availabilityId);

        if (hasOverlap) {
            throw new BadRequestException("Availability overlaps with an existing slot for the same day");
        }
    }
}
