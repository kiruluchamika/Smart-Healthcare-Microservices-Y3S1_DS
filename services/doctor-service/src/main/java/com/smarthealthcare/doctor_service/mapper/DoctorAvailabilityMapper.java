package com.smarthealthcare.doctor_service.mapper;

import com.smarthealthcare.doctor_service.dto.DoctorAvailabilityCreateRequest;
import com.smarthealthcare.doctor_service.dto.DoctorAvailabilityResponse;
import com.smarthealthcare.doctor_service.dto.DoctorAvailabilityUpdateRequest;
import com.smarthealthcare.doctor_service.entity.DoctorAvailability;
import org.springframework.stereotype.Component;

@Component
public class DoctorAvailabilityMapper {

    public DoctorAvailability toEntity(Long doctorId, DoctorAvailabilityCreateRequest request) {
        return DoctorAvailability.builder()
                .doctorId(doctorId)
                .dayOfWeek(request.getDayOfWeek())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .slotDuration(request.getSlotDuration())
                .available(request.getIsAvailable())
                .effectiveFrom(request.getEffectiveFrom())
                .effectiveTo(request.getEffectiveTo())
                .build();
    }

    public void updateEntity(DoctorAvailability availability, DoctorAvailabilityUpdateRequest request) {
        availability.setDayOfWeek(request.getDayOfWeek());
        availability.setStartTime(request.getStartTime());
        availability.setEndTime(request.getEndTime());
        availability.setSlotDuration(request.getSlotDuration());
        availability.setAvailable(request.getIsAvailable());
        availability.setEffectiveFrom(request.getEffectiveFrom());
        availability.setEffectiveTo(request.getEffectiveTo());
    }

    public DoctorAvailabilityResponse toResponse(DoctorAvailability availability) {
        return DoctorAvailabilityResponse.builder()
                .id(availability.getId())
                .doctorId(availability.getDoctorId())
                .dayOfWeek(availability.getDayOfWeek())
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
