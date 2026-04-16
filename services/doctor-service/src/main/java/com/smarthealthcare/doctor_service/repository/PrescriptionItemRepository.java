package com.smarthealthcare.doctor_service.repository;

import com.smarthealthcare.doctor_service.entity.PrescriptionItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PrescriptionItemRepository extends JpaRepository<PrescriptionItem, Long> {
}
