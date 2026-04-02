package com.smarthealthcare.doctor_service.mapper;

import com.smarthealthcare.doctor_service.dto.DoctorVerificationHistoryResponse;
import com.smarthealthcare.doctor_service.entity.DoctorVerificationHistory;
import org.springframework.stereotype.Component;

@Component
public class DoctorVerificationHistoryMapper {

    public DoctorVerificationHistoryResponse toResponse(DoctorVerificationHistory history) {
        return DoctorVerificationHistoryResponse.builder()
                .id(history.getId())
                .doctorId(history.getDoctorId())
                .previousStatus(history.getPreviousStatus())
                .newStatus(history.getNewStatus())
                .reason(history.getReason())
                .notes(history.getNotes())
                .changedBy(history.getChangedBy())
                .changedAt(history.getChangedAt())
                .build();
    }
}
