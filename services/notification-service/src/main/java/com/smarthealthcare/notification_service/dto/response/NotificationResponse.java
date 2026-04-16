package com.smarthealthcare.notification_service.dto.response;

import com.smarthealthcare.notification_service.entity.Notification;
import com.smarthealthcare.notification_service.enums.NotificationChannel;
import com.smarthealthcare.notification_service.enums.NotificationStatus;

import java.time.LocalDateTime;

public class NotificationResponse {
    private Long id;
    private String eventType;
    private String targetRole;
    private Long targetUserId;
    private Long paymentId;
    private Long appointmentId;
    private String title;
    private String message;
    private NotificationChannel channel;
    private NotificationStatus status;
    private String recipientEmail;
    private String recipientPhone;
    private String recipientName;
    private String failureReason;
    private boolean readFlag;
    private LocalDateTime readAt;
    private LocalDateTime sentAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static NotificationResponse fromEntity(Notification notification) {
        NotificationResponse response = new NotificationResponse();
        response.setId(notification.getId());
        response.setEventType(notification.getEventType());
        response.setTargetRole(notification.getTargetRole());
        response.setTargetUserId(notification.getTargetUserId());
        response.setPaymentId(notification.getPaymentId());
        response.setAppointmentId(notification.getAppointmentId());
        response.setTitle(notification.getTitle());
        response.setMessage(notification.getMessage());
        response.setChannel(notification.getChannel());
        response.setStatus(notification.getStatus());
        response.setRecipientEmail(notification.getRecipientEmail());
        response.setRecipientPhone(notification.getRecipientPhone());
        response.setRecipientName(notification.getRecipientName());
        response.setFailureReason(notification.getFailureReason());
        response.setReadFlag(notification.isReadFlag());
        response.setReadAt(notification.getReadAt());
        response.setSentAt(notification.getSentAt());
        response.setCreatedAt(notification.getCreatedAt());
        response.setUpdatedAt(notification.getUpdatedAt());
        return response;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }
    public String getTargetRole() { return targetRole; }
    public void setTargetRole(String targetRole) { this.targetRole = targetRole; }
    public Long getTargetUserId() { return targetUserId; }
    public void setTargetUserId(Long targetUserId) { this.targetUserId = targetUserId; }
    public Long getPaymentId() { return paymentId; }
    public void setPaymentId(Long paymentId) { this.paymentId = paymentId; }
    public Long getAppointmentId() { return appointmentId; }
    public void setAppointmentId(Long appointmentId) { this.appointmentId = appointmentId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public NotificationChannel getChannel() { return channel; }
    public void setChannel(NotificationChannel channel) { this.channel = channel; }
    public NotificationStatus getStatus() { return status; }
    public void setStatus(NotificationStatus status) { this.status = status; }
    public String getRecipientEmail() { return recipientEmail; }
    public void setRecipientEmail(String recipientEmail) { this.recipientEmail = recipientEmail; }
    public String getRecipientPhone() { return recipientPhone; }
    public void setRecipientPhone(String recipientPhone) { this.recipientPhone = recipientPhone; }
    public String getRecipientName() { return recipientName; }
    public void setRecipientName(String recipientName) { this.recipientName = recipientName; }
    public String getFailureReason() { return failureReason; }
    public void setFailureReason(String failureReason) { this.failureReason = failureReason; }
    public boolean isReadFlag() { return readFlag; }
    public void setReadFlag(boolean readFlag) { this.readFlag = readFlag; }
    public LocalDateTime getReadAt() { return readAt; }
    public void setReadAt(LocalDateTime readAt) { this.readAt = readAt; }
    public LocalDateTime getSentAt() { return sentAt; }
    public void setSentAt(LocalDateTime sentAt) { this.sentAt = sentAt; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}