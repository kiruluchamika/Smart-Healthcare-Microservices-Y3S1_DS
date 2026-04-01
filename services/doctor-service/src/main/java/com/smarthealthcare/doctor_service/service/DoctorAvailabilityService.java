package com.smarthealthcare.doctor_service.service;

import com.smarthealthcare.doctor_service.dto.DoctorAvailabilityCreateRequest;
import com.smarthealthcare.doctor_service.dto.DoctorAvailabilityResponse;
import com.smarthealthcare.doctor_service.dto.DoctorAvailabilityUpdateRequest;
import java.util.List;

public interface DoctorAvailabilityService {

    DoctorAvailabilityResponse createAvailability(Long doctorId, DoctorAvailabilityCreateRequest request);

    List<DoctorAvailabilityResponse> getAvailabilities(Long doctorId);

    DoctorAvailabilityResponse updateAvailability(Long doctorId, Long availabilityId,
            DoctorAvailabilityUpdateRequest request);

    void deleteAvailability(Long doctorId, Long availabilityId);
}
