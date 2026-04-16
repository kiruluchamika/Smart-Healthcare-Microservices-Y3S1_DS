package com.smarthealthcare.doctor_service.mapper;

import com.smarthealthcare.doctor_service.dto.DoctorAvailabilityCreateRequest;
import com.smarthealthcare.doctor_service.dto.DoctorAvailabilityResponse;
import com.smarthealthcare.doctor_service.dto.DoctorAvailabilityUpdateRequest;
import com.smarthealthcare.doctor_service.entity.DoctorAvailability;
import com.smarthealthcare.doctor_service.util.DoctorAvailabilityDays;
import org.springframework.stereotype.Component;

@Component
public class DoctorAvailabilityMapper {

    public DoctorAvailability toEntity(Long doctorId, DoctorAvailabilityCreateRequest request) {
        var resolvedDays = DoctorAvailabilityDays.resolveRequestedDays(
                request.getDaysOfWeek(),
                request.getDayOfWeek());

        return DoctorAvailability.builder()
                .doctorId(doctorId)
                .daysOfWeek(DoctorAvailabilityDays.serialize(resolvedDays))
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .slotDuration(request.getSlotDuration())
                .available(request.getIsAvailable())
                .effectiveFrom(request.getEffectiveFrom())
                .effectiveTo(request.getEffectiveTo())
                .build();
    }

    public void updateEntity(DoctorAvailability availability, DoctorAvailabilityUpdateRequest request) {
        availability.setDaysOfWeek(DoctorAvailabilityDays.serialize(
                DoctorAvailabilityDays.resolveRequestedDays(
                        request.getDaysOfWeek(),
                        request.getDayOfWeek())));
        availability.setStartTime(request.getStartTime());
        availability.setEndTime(request.getEndTime());
        availability.setSlotDuration(request.getSlotDuration());
        availability.setAvailable(request.getIsAvailable());
        availability.setEffectiveFrom(request.getEffectiveFrom());
        availability.setEffectiveTo(request.getEffectiveTo());
    }

    public DoctorAvailabilityResponse toResponse(DoctorAvailability availability) {
        var daysOfWeek = DoctorAvailabilityDays.parse(availability.getDaysOfWeek());
        return DoctorAvailabilityResponse.builder()
                .id(availability.getId())
                .doctorId(availability.getDoctorId())
                .dayOfWeek(daysOfWeek.isEmpty() ? null : daysOfWeek.get(0))
                .daysOfWeek(daysOfWeek)
                .startTime(availability.getStartTime())
                .endTime(availability.getEndTime())
                .slotDuration(availability.getSlotDuration() == null ? 30 : availability.getSlotDuration())
                .isAvailable(availability.getAvailable())
                .effectiveFrom(availability.getEffectiveFrom())
                .effectiveTo(availability.getEffectiveTo())
                .createdAt(availability.getCreatedAt())
                .updatedAt(availability.getUpdatedAt())
                .build();
    }
}
