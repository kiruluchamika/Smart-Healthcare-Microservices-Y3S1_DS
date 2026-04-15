package com.smarthealthcare.notification_service.service.impl;

import com.smarthealthcare.notification_service.client.AuthClient;
import com.smarthealthcare.notification_service.client.DoctorClient;
import com.smarthealthcare.notification_service.client.PatientClient;
import com.smarthealthcare.notification_service.config.NotificationProperties;
import com.smarthealthcare.notification_service.config.TwilioProperties;
import com.smarthealthcare.notification_service.dto.integration.NotificationEventRequest;
import com.smarthealthcare.notification_service.dto.response.NotificationResponse;
import com.smarthealthcare.notification_service.dto.response.UnreadCountResponse;
import com.smarthealthcare.notification_service.entity.Notification;
import com.smarthealthcare.notification_service.enums.NotificationChannel;
import com.smarthealthcare.notification_service.enums.NotificationStatus;
import com.smarthealthcare.notification_service.repository.NotificationRepository;
import com.smarthealthcare.notification_service.service.NotificationService;
import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import jakarta.annotation.PostConstruct;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@Transactional
public class NotificationServiceImpl implements NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationServiceImpl.class);

    private final NotificationRepository notificationRepository;
    private final JavaMailSender mailSender;
    private final TwilioProperties twilioProperties;
    private final NotificationProperties notificationProperties;
    private final AuthClient authClient;
    private final DoctorClient doctorClient;
    private final PatientClient patientClient;

    public NotificationServiceImpl(
            NotificationRepository notificationRepository,
            JavaMailSender mailSender,
            TwilioProperties twilioProperties,
            NotificationProperties notificationProperties,
            AuthClient authClient,
            DoctorClient doctorClient,
            PatientClient patientClient) {
        this.notificationRepository = notificationRepository;
        this.mailSender = mailSender;
        this.twilioProperties = twilioProperties;
        this.notificationProperties = notificationProperties;
        this.authClient = authClient;
        this.doctorClient = doctorClient;
        this.patientClient = patientClient;
    }

    @PostConstruct
    void initTwilio() {
        Twilio.init(twilioProperties.accountSid(), twilioProperties.authToken());
    }

    @Override
    public NotificationResponse processEvent(NotificationEventRequest request) {
        log.info(
                "Processing notification eventType={}, targetRole={}, targetUserId={}, appointmentId={}, paymentId={}",
                normalize(request.eventType()),
                normalizeRole(request.targetRole()),
                request.targetUserId(),
                request.appointmentId(),
                request.paymentId());

        RecipientContext recipient = resolveRecipient(request.targetRole(), request.targetUserId());

        Notification notification = new Notification();
        notification.setEventType(normalize(request.eventType()));
        notification.setTargetRole(normalizeRole(request.targetRole()));
        notification.setTargetUserId(request.targetUserId());
        notification.setPaymentId(request.paymentId());
        notification.setAppointmentId(request.appointmentId());
        notification.setTitle(defaultIfBlank(request.title(), buildDefaultTitle(request.eventType())));
        notification.setMessage(defaultIfBlank(request.message(), buildDefaultMessage(request.eventType(), recipient.role(), recipient.displayName())));
        notification.setChannel(resolveChannel(recipient));
        notification.setStatus(NotificationStatus.PENDING);
        notification.setRecipientEmail(recipient.email());
        notification.setRecipientPhone(normalizePhone(recipient.phone()));
        notification.setRecipientName(recipient.displayName());

        Notification saved = notificationRepository.save(notification);

        try {
            DeliveryResult deliveryResult = deliver(recipient, saved);
            saved.setStatus(NotificationStatus.SENT);
            saved.setFailureReason(deliveryResult.failures().isEmpty()
                    ? null
                    : limit(String.join(" | ", deliveryResult.failures()), 180));
            saved.setSentAt(LocalDateTime.now());
            log.info(
                    "Notification delivery status={}, eventType={}, targetRole={}, targetUserId={}, emailSent={}, smsSent={}, failures={}",
                    saved.getStatus(),
                    saved.getEventType(),
                    saved.getTargetRole(),
                    saved.getTargetUserId(),
                    deliveryResult.emailSent(),
                    deliveryResult.smsSent(),
                    deliveryResult.failures().size());
        } catch (Exception ex) {
            saved.setStatus(NotificationStatus.FAILED);
            saved.setFailureReason(limit(ex.getMessage(), 180));
            log.warn(
                    "Notification delivery failed eventType={}, targetRole={}, targetUserId={}, reason={}",
                    saved.getEventType(),
                    saved.getTargetRole(),
                    saved.getTargetUserId(),
                    saved.getFailureReason());
        }

        return NotificationResponse.fromEntity(notificationRepository.save(saved));
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationResponse> getInbox(String targetRole, Long targetUserId) {
        return notificationRepository.findByTargetRoleAndTargetUserIdOrderByCreatedAtDesc(
                        normalizeRole(targetRole), targetUserId)
                .stream()
                .map(NotificationResponse::fromEntity)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public UnreadCountResponse getUnreadCount(String targetRole, Long targetUserId) {
        long count = notificationRepository.countByTargetRoleAndTargetUserIdAndReadFlagFalse(
                normalizeRole(targetRole), targetUserId);
        return new UnreadCountResponse(count);
    }

    @Override
    public NotificationResponse markAsRead(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found with id: " + notificationId));
        notification.setReadFlag(true);
        notification.setReadAt(LocalDateTime.now());
        return NotificationResponse.fromEntity(notificationRepository.save(notification));
    }

    private DeliveryResult deliver(RecipientContext recipient, Notification notification) {
        boolean emailSent = false;
        boolean smsSent = false;
        List<String> failures = new ArrayList<>();

        if (StringUtils.hasText(recipient.email())) {
            try {
                sendEmail(recipient.email(), notification.getTitle(), notification.getMessage());
                emailSent = true;
            } catch (Exception ex) {
                failures.add("EMAIL: " + limit(ex.getMessage(), 80));
                log.warn(
                        "Email send failed eventType={}, targetRole={}, targetUserId={}, to={}: {}",
                        notification.getEventType(),
                        notification.getTargetRole(),
                        notification.getTargetUserId(),
                        maskEmail(recipient.email()),
                        ex.getMessage());
            }
        }

        if (StringUtils.hasText(recipient.phone())) {
            try {
                sendSms(recipient.phone(), notification);
                smsSent = true;
            } catch (Exception ex) {
                failures.add("SMS: " + limit(ex.getMessage(), 80));
                log.warn(
                        "SMS send failed eventType={}, targetRole={}, targetUserId={}, to={}: {}",
                        notification.getEventType(),
                        notification.getTargetRole(),
                        notification.getTargetUserId(),
                        maskPhone(recipient.phone()),
                        ex.getMessage());
            }
        }

        if (!emailSent && !smsSent) {
            if (!StringUtils.hasText(recipient.email()) && !StringUtils.hasText(recipient.phone())) {
                throw new IllegalStateException("No email or phone number available for notification delivery");
            }
            String reason = failures.isEmpty()
                    ? "Delivery failed for all available channels"
                    : String.join(" | ", failures);
            throw new IllegalStateException(reason);
        }

        return new DeliveryResult(emailSent, smsSent, failures);
    }

    private void sendEmail(String recipientEmail, String subject, String message) {
        SimpleMailMessage mailMessage = new SimpleMailMessage();
        mailMessage.setFrom(notificationProperties.fromEmail());
        mailMessage.setTo(recipientEmail);
        mailMessage.setReplyTo(notificationProperties.replyToEmail());
        mailMessage.setSubject(notificationProperties.subjectPrefix() + " - " + subject);
        mailMessage.setText(message + "\n\nWarm regards,\nSmart Healthcare Team");
        mailSender.send(mailMessage);
    }

    private void sendSms(String recipientPhone, Notification notification) {
        String normalizedPhone = normalizePhone(recipientPhone);
        if (!StringUtils.hasText(normalizedPhone)) {
            throw new IllegalArgumentException("Recipient phone is missing or invalid for SMS delivery");
        }

        String smsBody = buildSmsBody(notification);
        Message.creator(new PhoneNumber(normalizedPhone), new PhoneNumber(twilioProperties.phoneNumber()), smsBody)
                .create();
    }

    private String buildSmsBody(Notification notification) {
        return String.format(Locale.ROOT, "Smart Healthcare: %s - %s", notification.getTitle(), limit(notification.getMessage(), 120));
    }

    private RecipientContext resolveRecipient(String targetRole, Long targetUserId) {
        String normalizedRole = normalizeRole(targetRole);
        if (Objects.equals(normalizedRole, "DOCTOR")) {
            DoctorClient.DoctorContactResponse doctor = doctorClient.getDoctorById(targetUserId);
            String normalizedDoctorPhone = normalizePhone(doctor.phone());
            log.info(
                    "Resolved doctor recipient targetUserId={}, phone={}, email={}",
                    targetUserId,
                    maskPhone(normalizedDoctorPhone),
                    maskEmail(doctor.email()));
            return new RecipientContext(
                    safeName(doctor.firstName(), doctor.lastName()),
                    doctor.email(),
                    normalizedDoctorPhone,
                    "DOCTOR");
        }

        if (Objects.equals(normalizedRole, "PATIENT")) {
            PatientClient.PatientContactResponse patient = null;
            AuthClient.AuthUserResponse user = null;

            try {
                patient = patientClient.getPatientContactByAuthUserId(targetUserId);
            } catch (Exception ex) {
                log.warn("Patient lookup by authUserId {} failed: {}", targetUserId, ex.getMessage());
            }

            if (patient == null) {
                try {
                    patient = patientClient.getPatientContactByProfileId(targetUserId);
                } catch (Exception ex) {
                    log.warn("Patient lookup by profileId {} failed: {}", targetUserId, ex.getMessage());
                }
            }

            Long authUserId = patient != null && patient.authUserId() != null
                    ? patient.authUserId()
                    : targetUserId;

            try {
                user = authClient.getUserById(authUserId);
            } catch (Exception ex) {
                log.warn("Auth user lookup {} failed for patient recipient: {}", authUserId, ex.getMessage());
            }

            String preferredEmail = firstNonBlank(
                    patient == null ? null : patient.email(),
                    user == null ? null : user.email());
            String preferredPhone = firstNonBlank(
                    patient == null ? null : patient.contactPhone(),
                    user == null ? null : user.phoneNumber());
            String normalizedPreferredPhone = normalizePhone(preferredPhone);

            String source = patient != null && StringUtils.hasText(patient.contactPhone())
                    ? "PATIENT_PROFILE_EMERGENCY"
                    : "AUTH_PHONE_FALLBACK";
            log.info(
                    "Resolved patient recipient targetUserId={}, authUserId={}, source={}, phone={}, email={}",
                    targetUserId,
                    authUserId,
                    source,
                    maskPhone(normalizedPreferredPhone),
                    maskEmail(preferredEmail));

            return new RecipientContext(
                    safeName(
                            user == null ? null : user.firstName(),
                            user == null ? null : user.lastName()),
                    preferredEmail,
                    normalizedPreferredPhone,
                    "PATIENT");
        }

        return new RecipientContext("System", null, null, normalizedRole);
    }

    private NotificationChannel resolveChannel(RecipientContext recipient) {
        boolean hasEmail = StringUtils.hasText(recipient.email());
        boolean hasPhone = StringUtils.hasText(recipient.phone());
        if (hasEmail && hasPhone) {
            return NotificationChannel.BOTH;
        }
        if (hasEmail) {
            return NotificationChannel.EMAIL;
        }
        if (hasPhone) {
            return NotificationChannel.SMS;
        }
        return NotificationChannel.EMAIL;
    }

    private String buildDefaultTitle(String eventType) {
        return switch (normalize(eventType)) {
            case "APPOINTMENT_CONFIRMED" -> "Your Appointment Is Confirmed";
            case "APPOINTMENT_CONFIRMED_DOCTOR" -> "Appointment Confirmed Successfully";
            case "CONSULTATION_COMPLETED" -> "Consultation Completed";
            case "CONSULTATION_COMPLETED_DOCTOR" -> "Consultation Closed Successfully";
            case "PAYMENT_CONFIRMED" -> "Payment Confirmed";
            case "PAYMENT_CONFIRMED_DOCTOR" -> "Patient Payment Confirmed";
            default -> "Smart Healthcare Update";
        };
    }

    private String buildDefaultMessage(String eventType, String role, String displayName) {
        String name = StringUtils.hasText(displayName) ? displayName : "there";
        return switch (normalize(eventType)) {
            case "APPOINTMENT_CONFIRMED" -> "Hi " + name + ", great news! Your appointment has been confirmed. Please be ready a few minutes before your scheduled time.";
            case "APPOINTMENT_CONFIRMED_DOCTOR" -> "Hi Dr. " + name + ", your patient appointment is now confirmed. Wishing you a successful consultation.";
            case "CONSULTATION_COMPLETED" -> "Hi " + name + ", your consultation was successfully completed. Thank you for choosing Smart Healthcare.";
            case "CONSULTATION_COMPLETED_DOCTOR" -> "Hi Dr. " + name + ", consultation completion has been recorded successfully.";
            case "PAYMENT_CONFIRMED" -> "Hi " + name + ", your payment is successful and your consultation is ready.";
            case "PAYMENT_CONFIRMED_DOCTOR" -> "A patient payment was confirmed. Consultation workflow can proceed.";
            case "PAYMENT_FAILED" -> "Your payment could not be processed. Please retry or contact support.";
            case "PAYMENT_REFUNDED" -> "Your payment refund was successfully processed.";
            default -> "You have a new notification from Smart Healthcare for role " + role + ".";
        };
    }

    private String normalize(String value) {
        return value == null ? "UNKNOWN" : value.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeRole(String value) {
        return value == null || value.isBlank() ? "SYSTEM" : value.trim().toUpperCase(Locale.ROOT);
    }

    private String defaultIfBlank(String value, String fallback) {
        return StringUtils.hasText(value) ? value.trim() : fallback;
    }

    private String safeName(String firstName, String lastName) {
        String fullName = ((firstName == null ? "" : firstName) + " " + (lastName == null ? "" : lastName)).trim();
        return StringUtils.hasText(fullName) ? fullName : "User";
    }

    private String firstNonBlank(String first, String second) {
        if (StringUtils.hasText(first)) {
            return first;
        }
        if (StringUtils.hasText(second)) {
            return second;
        }
        return null;
    }

    private String limit(String value, int maxLength) {
        if (value == null) {
            return "";
        }
        String trimmed = value.trim();
        return trimmed.length() <= maxLength ? trimmed : trimmed.substring(0, maxLength - 3) + "...";
    }

    private String normalizePhone(String phone) {
        if (!StringUtils.hasText(phone)) {
            return null;
        }

        String cleaned = phone.replaceAll("[^0-9+]", "").trim();
        if (!StringUtils.hasText(cleaned)) {
            return null;
        }

        if (cleaned.startsWith("00")) {
            cleaned = "+" + cleaned.substring(2);
        }

        if (cleaned.startsWith("0") && cleaned.length() >= 10) {
            cleaned = "+94" + cleaned.substring(1);
        }

        if (cleaned.startsWith("+") && cleaned.substring(1).matches("\\d{8,15}")) {
            return cleaned;
        }

        if (cleaned.matches("\\d{8,15}")) {
            return "+" + cleaned;
        }

        return null;
    }

    private String maskPhone(String phone) {
        if (!StringUtils.hasText(phone)) {
            return "N/A";
        }
        String trimmed = phone.trim();
        if (trimmed.length() <= 4) {
            return "****";
        }
        return "***" + trimmed.substring(trimmed.length() - 4);
    }

    private String maskEmail(String email) {
        if (!StringUtils.hasText(email)) {
            return "N/A";
        }
        String trimmed = email.trim();
        int at = trimmed.indexOf('@');
        if (at <= 1) {
            return "***";
        }
        return trimmed.substring(0, 1) + "***" + trimmed.substring(at);
    }

    private record DeliveryResult(boolean emailSent, boolean smsSent, List<String> failures) {
    }

    private record RecipientContext(String displayName, String email, String phone, String role) {
    }
}