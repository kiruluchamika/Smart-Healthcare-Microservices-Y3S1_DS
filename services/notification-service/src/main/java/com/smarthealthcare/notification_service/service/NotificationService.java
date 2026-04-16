package com.smarthealthcare.notification_service.service;

import com.smarthealthcare.notification_service.dto.integration.NotificationEventRequest;
import com.smarthealthcare.notification_service.dto.response.NotificationResponse;
import com.smarthealthcare.notification_service.dto.response.UnreadCountResponse;

import java.util.List;

public interface NotificationService {
    NotificationResponse processEvent(NotificationEventRequest request);

    List<NotificationResponse> getInbox(String targetRole, Long targetUserId);

    UnreadCountResponse getUnreadCount(String targetRole, Long targetUserId);

    NotificationResponse markAsRead(Long notificationId);
}