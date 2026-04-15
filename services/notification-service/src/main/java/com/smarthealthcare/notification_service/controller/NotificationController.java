package com.smarthealthcare.notification_service.controller;

import com.smarthealthcare.notification_service.dto.integration.NotificationEventRequest;
import com.smarthealthcare.notification_service.dto.response.ApiMessageResponse;
import com.smarthealthcare.notification_service.dto.response.NotificationResponse;
import com.smarthealthcare.notification_service.dto.response.UnreadCountResponse;
import com.smarthealthcare.notification_service.service.NotificationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @PostMapping({"/payment-events", "/events"})
    public ResponseEntity<NotificationResponse> createNotification(@Valid @RequestBody NotificationEventRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(notificationService.processEvent(request));
    }

    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getInbox(
            @RequestParam String targetRole,
            @RequestParam Long targetUserId) {
        return ResponseEntity.ok(notificationService.getInbox(targetRole, targetUserId));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<UnreadCountResponse> getUnreadCount(
            @RequestParam String targetRole,
            @RequestParam Long targetUserId) {
        return ResponseEntity.ok(notificationService.getUnreadCount(targetRole, targetUserId));
    }

    @PatchMapping("/{notificationId}/read")
    public ResponseEntity<NotificationResponse> markAsRead(@PathVariable Long notificationId) {
        return ResponseEntity.ok(notificationService.markAsRead(notificationId));
    }

    @GetMapping("/health")
    public ResponseEntity<ApiMessageResponse> health() {
        return ResponseEntity.ok(new ApiMessageResponse("notification-service is running"));
    }
}