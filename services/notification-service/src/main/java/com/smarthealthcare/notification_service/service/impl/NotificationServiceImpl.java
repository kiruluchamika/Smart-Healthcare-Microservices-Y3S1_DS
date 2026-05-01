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
import com.twilio.exception.ApiException;
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
        if (!StringUtils.hasText(twilioProperties.accountSid()) || !StringUtils.hasText(twilioProperties.authToken())) {
            log.warn("Twilio credentials are not configured. SMS delivery is disabled until valid credentials are provided.");
            return;
        }

        Twilio.init(twilioProperties.accountSid(), twilioProperties.authToken());
        String normalizedSender = normalizePhone(twilioProperties.phoneNumber());
        if (!StringUtils.hasText(normalizedSender)) {
            log.warn("Twilio sender phone-number is missing or invalid. SMS delivery will fail until a Twilio-owned E.164 number is configured.");
        } else {
            log.info("Twilio SMS sender configured as {}", maskPhone(normalizedSender));
        }
    }

    @Override
    public NotificationResponse processEvent(NotificationEventRequest request) {
        log.info(
                "[PROCESS] === START === eventType={}, targetRole={}, targetUserId={}, appointmentId={}, paymentId={}",
                normalize(request.eventType()),
                normalizeRole(request.targetRole()),
                request.targetUserId(),
                request.appointmentId(),
                request.paymentId());

        RecipientContext recipient;
        try {
            recipient = resolveRecipient(request.targetRole(), request.targetUserId());
        } catch (Exception ex) {
            log.error(
                    "[PROCESS] Recipient resolution FAILED | eventType={}, targetRole={}, targetUserId={} | Exception: {} | Reason: {}",
                    normalize(request.eventType()),
                    normalizeRole(request.targetRole()),
                    request.targetUserId(),
                    ex.getClass().getSimpleName(),
                    ex.getMessage(),
                    ex);

            Notification failed = buildBaseNotification(request, normalizeRole(request.targetRole()), "User");
            failed.setChannel(NotificationChannel.EMAIL);
            failed.setStatus(NotificationStatus.FAILED);
            failed.setFailureReason(limit("Recipient resolution failed: " + ex.getMessage(), 180));
            Notification saved = notificationRepository.save(failed);
            log.error("[PROCESS] Saved notification with FAILED status | NotificationId: {} | FailureReason: {}", saved.getId(), saved.getFailureReason());
            return NotificationResponse.fromEntity(saved);
        }

        Notification notification = buildBaseNotification(request, recipient.role(), recipient.displayName());
        notification.setChannel(resolveChannel(recipient));
        notification.setRecipientEmail(recipient.email());
        notification.setRecipientPhone(normalizePhone(recipient.phone()));
        notification.setRecipientName(recipient.displayName());

        log.info("[PROCESS] Resolved recipient successfully | Name: {} | Channel: {} | Email: {} | Phone: {}", 
                recipient.displayName(), notification.getChannel(), maskEmail(recipient.email()), maskPhone(recipient.phone()));

        Notification saved = notificationRepository.save(notification);
        log.info("[PROCESS] Saved notification to database | NotificationId: {} | Status: PENDING", saved.getId());

        try {
            log.info("[PROCESS] Starting delivery attempt for NotificationId: {}", saved.getId());
            DeliveryResult deliveryResult = deliver(recipient, saved);
            saved.setStatus(NotificationStatus.SENT);
            saved.setFailureReason(deliveryResult.failures().isEmpty()
                    ? null
                    : limit(String.join(" | ", deliveryResult.failures()), 180));
            saved.setSentAt(LocalDateTime.now());
            Notification finalSaved = notificationRepository.save(saved);
            
            log.info(
                    "[PROCESS] === SUCCESS === NotificationId: {}, eventType={}, targetRole={}, targetUserId={}, status={}, channel={}, emailSent={}, smsSent={}, failures={}",
                    finalSaved.getId(),
                    finalSaved.getEventType(),
                    finalSaved.getTargetRole(),
                    finalSaved.getTargetUserId(),
                    finalSaved.getStatus(),
                    finalSaved.getChannel(),
                    deliveryResult.emailSent(),
                    deliveryResult.smsSent(),
                    deliveryResult.failures().size());
            
            return NotificationResponse.fromEntity(finalSaved);
        } catch (Exception ex) {
            saved.setStatus(NotificationStatus.FAILED);
            saved.setFailureReason(limit(ex.getMessage(), 180));
            Notification finalFailed = notificationRepository.save(saved);
            
            log.error(
                    "[PROCESS] === FAILED === NotificationId: {}, eventType={}, targetRole={}, targetUserId={}, failureReason={}",
                    finalFailed.getId(),
                    finalFailed.getEventType(),
                    finalFailed.getTargetRole(),
                    finalFailed.getTargetUserId(),
                    finalFailed.getFailureReason(),
                    ex);
            
            return NotificationResponse.fromEntity(finalFailed);
        }
    }

    private Notification buildBaseNotification(NotificationEventRequest request, String targetRole, String recipientName) {
        Notification notification = new Notification();
        notification.setEventType(normalize(request.eventType()));
        notification.setTargetRole(normalizeRole(targetRole));
        notification.setTargetUserId(request.targetUserId());
        notification.setPaymentId(request.paymentId());
        notification.setAppointmentId(request.appointmentId());
        notification.setTitle(defaultIfBlank(request.title(), buildDefaultTitle(request.eventType())));
        notification.setMessage(defaultIfBlank(
                request.message(),
                buildDefaultMessage(request.eventType(), normalizeRole(targetRole), recipientName)));
        notification.setStatus(NotificationStatus.PENDING);
        notification.setRecipientName(recipientName);
        return notification;
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
        log.info("[DELIVERY] Starting delivery process | Channel: {} | Recipient: {} | Email: {} | Phone: {}", 
                notification.getChannel(), recipient.displayName(), maskEmail(recipient.email()), maskPhone(recipient.phone()));
        
        boolean emailSent = false;
        boolean smsSent = false;
        List<String> failures = new ArrayList<>();

        if (StringUtils.hasText(recipient.email())) {
            try {
                log.info("[DELIVERY] Attempting EMAIL delivery to {}", maskEmail(recipient.email()));
                sendEmail(recipient.email(), notification.getTitle(), notification.getMessage());
                emailSent = true;
                log.info("[DELIVERY] EMAIL delivery SUCCESS");
            } catch (Exception ex) {
                failures.add("EMAIL: " + limit(ex.getMessage(), 80));
                log.error("[DELIVERY] EMAIL delivery FAILED | Exception: {} | Details: {}", 
                        ex.getClass().getSimpleName(), ex.getMessage(), ex);
            }
        } else {
            log.warn("[DELIVERY] EMAIL channel requested but no email address available");
        }

        if (StringUtils.hasText(recipient.phone())) {
            try {
                log.info("[DELIVERY] Attempting SMS delivery to {}", maskPhone(recipient.phone()));
                sendSms(recipient.phone(), notification);
                smsSent = true;
                log.info("[DELIVERY] SMS delivery SUCCESS");
            } catch (Exception ex) {
                failures.add("SMS: " + limit(ex.getMessage(), 80));
                log.error("[DELIVERY] SMS delivery FAILED | Exception: {} | Details: {}", 
                        ex.getClass().getSimpleName(), ex.getMessage(), ex);
            }
        } else {
            log.warn("[DELIVERY] SMS channel requested but no phone number available");
        }

        if (!emailSent && !smsSent) {
            if (!StringUtils.hasText(recipient.email()) && !StringUtils.hasText(recipient.phone())) {
                log.error("[DELIVERY] FINAL FAILURE - No email or phone number available for notification delivery");
                throw new IllegalStateException("No email or phone number available for notification delivery");
            }
            String reason = failures.isEmpty()
                    ? "Delivery failed for all available channels"
                    : String.join(" | ", failures);
            log.error("[DELIVERY] FINAL FAILURE - {}", reason);
            throw new IllegalStateException(reason);
        }

        log.info("[DELIVERY] Delivery attempt complete | EmailSent: {} | SMSSent: {} | Failures: {}", 
                emailSent, smsSent, failures.size());
        return new DeliveryResult(emailSent, smsSent, failures);
    }

    private void sendEmail(String recipientEmail, String subject, String message) {
        log.info("[EMAIL] Attempting to send email to {} (recipient: {})", maskEmail(recipientEmail), recipientEmail);
        
        SimpleMailMessage mailMessage = new SimpleMailMessage();
        mailMessage.setFrom(notificationProperties.fromEmail());
        mailMessage.setTo(recipientEmail);
        mailMessage.setReplyTo(notificationProperties.replyToEmail());
        mailMessage.setSubject(notificationProperties.subjectPrefix() + " - " + subject);
        mailMessage.setText(message + "\n\nWarm regards,\nSmart Healthcare Team");
        
        try {
            mailSender.send(mailMessage);
            log.info("[EMAIL] Successfully sent email to {} | Subject: '{}'", maskEmail(recipientEmail), subject);
        } catch (Exception ex) {
            log.error("[EMAIL] FAILED to send email to {} | Exception: {} | Message: {}", 
                    maskEmail(recipientEmail), ex.getClass().getSimpleName(), ex.getMessage(), ex);
            throw ex;
        }
    }

    private void sendSms(String recipientPhone, Notification notification) {
        log.info("[SMS] Attempting to send SMS to {} (recipient: {})", maskPhone(recipientPhone), recipientPhone);
        
        String normalizedPhone = normalizePhone(recipientPhone);
        if (!StringUtils.hasText(normalizedPhone)) {
            log.error("[SMS] FAILED - Recipient phone is missing or invalid for SMS delivery: {}", recipientPhone);
            throw new IllegalArgumentException("Recipient phone is missing or invalid for SMS delivery");
        }

        String normalizedSender = normalizePhone(twilioProperties.phoneNumber());
        if (!StringUtils.hasText(normalizedSender)) {
            log.error("[SMS] FAILED - Twilio sender phone-number is missing or invalid. Configure a Twilio-owned E.164 number.");
            throw new IllegalStateException("Twilio sender phone-number is missing or invalid. Use a Twilio-owned E.164 number.");
        }

        if (Objects.equals(normalizedSender, normalizedPhone)) {
            log.warn("[SMS] WARNING - Twilio sender and recipient are the same number {}. Trial restrictions may block delivery.", maskPhone(normalizedPhone));
        }

        String smsBody = buildSmsBody(notification);
        log.debug("[SMS] SMS body: {}", smsBody);
        
        try {
            Message result = Message.creator(new PhoneNumber(normalizedPhone), new PhoneNumber(normalizedSender), smsBody)
                    .create();
            log.info("[SMS] Successfully sent SMS to {} | MessageSID: {} | Status: {}", 
                    maskPhone(normalizedPhone), result.getSid(), result.getStatus());
        } catch (ApiException ex) {
            String detail = ex.getCode() != null
                    ? "Twilio error code " + ex.getCode() + ": " + ex.getMessage()
                    : ex.getMessage();
            log.error("[SMS] FAILED to send SMS to {} | TwilioError: {} | HTTPStatus: {} | Message: {}", 
                    maskPhone(normalizedPhone), ex.getCode(), ex.getStatusCode(), ex.getMessage(), ex);
            throw new IllegalStateException(detail, ex);
        } catch (Exception ex) {
            log.error("[SMS] FAILED to send SMS to {} | Exception: {} | Message: {}", 
                    maskPhone(normalizedPhone), ex.getClass().getSimpleName(), ex.getMessage(), ex);
            throw ex;
        }
    }

    private String buildSmsBody(Notification notification) {
        return String.format(Locale.ROOT, "Smart Healthcare: %s - %s", notification.getTitle(), limit(notification.getMessage(), 120));
    }

    private RecipientContext resolveRecipient(String targetRole, Long targetUserId) {
        String normalizedRole = normalizeRole(targetRole);
        log.info("[RECIPIENT] Starting resolution for role={}, userId={}", normalizedRole, targetUserId);
        
        if (Objects.equals(normalizedRole, "DOCTOR")) {
            log.info("[RECIPIENT-DOCTOR] Attempting to resolve doctor with ID: {}", targetUserId);
            try {
                DoctorClient.DoctorContactResponse doctor = doctorClient.getDoctorById(targetUserId);
                String normalizedDoctorPhone = normalizePhone(doctor.phone());
                log.info("[RECIPIENT-DOCTOR] Successfully resolved | Name: {} {} | Phone: {} | Email: {}", 
                        doctor.firstName(), doctor.lastName(), maskPhone(normalizedDoctorPhone), maskEmail(doctor.email()));
                return new RecipientContext(
                        safeName(doctor.firstName(), doctor.lastName()),
                        doctor.email(),
                        normalizedDoctorPhone,
                        "DOCTOR");
            } catch (Exception ex) {
                log.error("[RECIPIENT-DOCTOR] FAILED to resolve doctor {} | Exception: {} | Message: {}", 
                        targetUserId, ex.getClass().getSimpleName(), ex.getMessage(), ex);
                throw ex;
            }
        }

        if (Objects.equals(normalizedRole, "PATIENT")) {
            log.info("[RECIPIENT-PATIENT] Attempting to resolve patient with ID: {}", targetUserId);
            PatientClient.PatientContactResponse patient = null;
            AuthClient.AuthUserResponse user = null;

            try {
                log.debug("[RECIPIENT-PATIENT] Attempting lookup by authUserId: {}", targetUserId);
                patient = patientClient.getPatientContactByAuthUserId(targetUserId);
                if (patient != null) {
                    log.info("[RECIPIENT-PATIENT] Successfully resolved by authUserId");
                }
            } catch (Exception ex) {
                log.warn("[RECIPIENT-PATIENT] Lookup by authUserId {} failed: {} - {}", 
                        targetUserId, ex.getClass().getSimpleName(), ex.getMessage());
            }

            if (patient == null) {
                try {
                    log.debug("[RECIPIENT-PATIENT] Attempting lookup by profileId: {}", targetUserId);
                    patient = patientClient.getPatientContactByProfileId(targetUserId);
                    if (patient != null) {
                        log.info("[RECIPIENT-PATIENT] Successfully resolved by profileId");
                    }
                } catch (Exception ex) {
                    log.warn("[RECIPIENT-PATIENT] Lookup by profileId {} failed: {} - {}", 
                            targetUserId, ex.getClass().getSimpleName(), ex.getMessage());
                }
            }

            Long authUserId = patient != null && patient.authUserId() != null
                    ? patient.authUserId()
                    : targetUserId;

            try {
                log.debug("[RECIPIENT-PATIENT] Attempting to fetch auth user details for authUserId: {}", authUserId);
                user = authClient.getUserById(authUserId);
                if (user != null) {
                    log.info("[RECIPIENT-PATIENT] Successfully fetched auth user: {} {}", user.firstName(), user.lastName());
                }
            } catch (Exception ex) {
                log.warn("[RECIPIENT-PATIENT] Auth user lookup {} failed: {} - {}", 
                        authUserId, ex.getClass().getSimpleName(), ex.getMessage());
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
            
            log.info("[RECIPIENT-PATIENT] Resolved | Name: {} | AuthUserId: {} | ContactSource: {} | Phone: {} | Email: {}", 
                    safeName(user == null ? null : user.firstName(), user == null ? null : user.lastName()),
                    authUserId, source, maskPhone(normalizedPreferredPhone), maskEmail(preferredEmail));

            return new RecipientContext(
                    safeName(
                            user == null ? null : user.firstName(),
                            user == null ? null : user.lastName()),
                    preferredEmail,
                    normalizedPreferredPhone,
                    "PATIENT");
        }

        log.warn("[RECIPIENT] Unknown role: {}", normalizedRole);
        return new RecipientContext("System", null, null, normalizedRole);
    }

    private NotificationChannel resolveChannel(RecipientContext recipient) {
        boolean hasEmail = StringUtils.hasText(recipient.email());
        boolean hasPhone = StringUtils.hasText(recipient.phone());
        
        log.debug("[CHANNEL] Resolving channel | HasEmail: {} | HasPhone: {}", hasEmail, hasPhone);
        
        NotificationChannel channel;
        if (hasEmail && hasPhone) {
            channel = NotificationChannel.BOTH;
            log.info("[CHANNEL] Resolved to BOTH (Email + SMS) - both contact methods available");
        } else if (hasEmail) {
            channel = NotificationChannel.EMAIL;
            log.info("[CHANNEL] Resolved to EMAIL only - no phone number available");
        } else if (hasPhone) {
            channel = NotificationChannel.SMS;
            log.info("[CHANNEL] Resolved to SMS only - no email address available");
        } else {
            channel = NotificationChannel.EMAIL;
            log.warn("[CHANNEL] Resolved to EMAIL default - no contact methods available");
        }
        
        return channel;
    }

    private String buildDefaultTitle(String eventType) {
        return switch (normalize(eventType)) {
            case "APPOINTMENT_CONFIRMED" -> "Appointment Confirmed: You're All Set";
            case "APPOINTMENT_CONFIRMED_DOCTOR" -> "Appointment Confirmed With Patient";
            case "CONSULTATION_COMPLETED" -> "Consultation Successfully Completed";
            case "CONSULTATION_COMPLETED_DOCTOR" -> "Consultation Completion Recorded";
            case "PAYMENT_CONFIRMED" -> "Payment Confirmed: Consultation Ready";
            case "PAYMENT_CONFIRMED_DOCTOR" -> "Patient Payment Received";
            case "APPOINTMENT_REMINDER" -> "Friendly Reminder: Appointment Starts Soon";
            default -> "Smart Healthcare Update";
        };
    }

    private String buildDefaultMessage(String eventType, String role, String displayName) {
        String name = StringUtils.hasText(displayName) ? displayName : "there";
        return switch (normalize(eventType)) {
            case "APPOINTMENT_CONFIRMED" -> "Hi " + name + ", your appointment is confirmed and your care team is ready for you. Please join 5 minutes early and keep your records nearby.";
            case "APPOINTMENT_CONFIRMED_DOCTOR" -> "Hi Dr. " + name + ", this booking is confirmed. Your patient has been notified and the appointment is now active in your schedule.";
            case "CONSULTATION_COMPLETED" -> "Hi " + name + ", your consultation has been marked as completed. Thank you for trusting Smart Healthcare for your care journey.";
            case "CONSULTATION_COMPLETED_DOCTOR" -> "Hi Dr. " + name + ", the consultation completion was recorded successfully. Billing and follow-up workflow can now continue.";
            case "PAYMENT_CONFIRMED" -> "Hi " + name + ", we received your payment successfully. Your consultation access is now ready and your booking remains confirmed.";
            case "PAYMENT_CONFIRMED_DOCTOR" -> "A patient payment has been confirmed. You can proceed with consultation preparation and follow-up without payment hold.";
            case "APPOINTMENT_REMINDER" -> "Hi " + name + ", this is a friendly reminder that your appointment is starting soon. Please be available a few minutes before the scheduled time.";
            case "PAYMENT_FAILED" -> "Your payment could not be processed. Please retry using a valid card or contact support for assistance.";
            case "PAYMENT_REFUNDED" -> "Your refund has been processed successfully. Please allow your bank's standard processing time for balance reflection.";
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
