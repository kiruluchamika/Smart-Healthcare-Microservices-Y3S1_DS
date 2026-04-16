package com.smarthealthcare.notification_service.repository;

import com.smarthealthcare.notification_service.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByTargetRoleAndTargetUserIdOrderByCreatedAtDesc(String targetRole, Long targetUserId);

    long countByTargetRoleAndTargetUserIdAndReadFlagFalse(String targetRole, Long targetUserId);
}