package com.smarthealthcare.doctor_service.service;

import com.smarthealthcare.doctor_service.dto.ApiSuccessResponse;
import com.smarthealthcare.doctor_service.dto.DoctorCreateRequest;
import com.smarthealthcare.doctor_service.dto.DoctorDashboardSummaryResponse;
import com.smarthealthcare.doctor_service.dto.DoctorResponse;
import com.smarthealthcare.doctor_service.dto.DoctorUpdateRequest;
import com.smarthealthcare.doctor_service.dto.DoctorVerificationHistoryResponse;
import com.smarthealthcare.doctor_service.dto.DoctorVerificationStatusUpdateRequest;
import com.smarthealthcare.doctor_service.dto.PagedResponse;
import java.time.DayOfWeek;
import java.util.List;
import java.util.Map;

public interface DoctorService {

    DoctorResponse createDoctor(DoctorCreateRequest request, String idempotencyKey);

    DoctorResponse getDoctorById(Long doctorId);

    DoctorResponse getDoctorByEmail(String email);

    DoctorResponse updateDoctor(Long doctorId, DoctorUpdateRequest request);

    void deleteDoctor(Long doctorId);

    PagedResponse<DoctorResponse> getDoctors(int page, int size, String sortBy, String sortDir);

    List<DoctorResponse> searchDoctors(
            String specialization,
            Boolean verified,
            Boolean active,
            Integer minExperience,
            DayOfWeek dayOfWeek);

    DoctorResponse updateVerificationStatus(Long doctorId, DoctorVerificationStatusUpdateRequest request);

    DoctorDashboardSummaryResponse getDashboardSummary(Long doctorId);

    List<DoctorVerificationHistoryResponse> getVerificationHistory(Long doctorId);

    ApiSuccessResponse submitChangeRequest(Long doctorId, Map<String, Object> requestBody, String requestedBy);

    ApiSuccessResponse decideChangeRequest(Long doctorId, Long requestId, Map<String, Object> requestBody, String reviewedBy);
}
