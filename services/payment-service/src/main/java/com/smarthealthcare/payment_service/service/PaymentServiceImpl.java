package com.smarthealthcare.payment_service.service;

import com.smarthealthcare.payment_service.client.AppointmentClient;
import com.smarthealthcare.payment_service.client.DoctorClient;
import com.smarthealthcare.payment_service.client.NotificationClient;
import com.smarthealthcare.payment_service.client.TelemedicineClient;
import com.smarthealthcare.payment_service.config.SmartHealthcareProperties;
import com.smarthealthcare.payment_service.dto.integration.AppointmentSnapshot;
import com.smarthealthcare.payment_service.dto.integration.AppointmentPaymentStatusUpdateRequest;
import com.smarthealthcare.payment_service.dto.integration.DoctorSnapshot;
import com.smarthealthcare.payment_service.dto.integration.NotificationEventRequest;
import com.smarthealthcare.payment_service.dto.integration.TelemedicineSessionRequest;
import com.smarthealthcare.payment_service.dto.integration.TelemedicineSessionResponse;
import com.smarthealthcare.payment_service.dto.request.ConsultationCompletionRequest;
import com.smarthealthcare.payment_service.dto.request.CreateCheckoutSessionRequest;
import com.smarthealthcare.payment_service.dto.request.RefundRequest;
import com.smarthealthcare.payment_service.dto.response.CheckoutSessionResponse;
import com.smarthealthcare.payment_service.dto.response.PaymentResponse;
import com.smarthealthcare.payment_service.dto.response.PaymentSummaryResponse;
import com.smarthealthcare.payment_service.entity.PaymentProvider;
import com.smarthealthcare.payment_service.entity.PaymentStatus;
import com.smarthealthcare.payment_service.entity.PaymentTransaction;
import com.smarthealthcare.payment_service.exception.ConflictException;
import com.smarthealthcare.payment_service.exception.ResourceNotFoundException;
import com.smarthealthcare.payment_service.mapper.PaymentMapper;
import com.smarthealthcare.payment_service.repository.PaymentTransactionRepository;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.Charge;
import com.stripe.model.PaymentIntent;
import com.stripe.model.StripeObject;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import com.stripe.param.checkout.SessionCreateParams;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Slf4j
@Service
public class PaymentServiceImpl implements PaymentService {

    private final PaymentTransactionRepository repository;
    private final AppointmentClient appointmentClient;
    private final DoctorClient doctorClient;
    private final NotificationClient notificationClient;
    private final TelemedicineClient telemedicineClient;
    private final SmartHealthcareProperties properties;

    public PaymentServiceImpl(PaymentTransactionRepository repository,
                              AppointmentClient appointmentClient,
                              DoctorClient doctorClient,
                              NotificationClient notificationClient,
                              TelemedicineClient telemedicineClient,
                              SmartHealthcareProperties properties) {
        this.repository = repository;
        this.appointmentClient = appointmentClient;
        this.doctorClient = doctorClient;
        this.notificationClient = notificationClient;
        this.telemedicineClient = telemedicineClient;
        this.properties = properties;
        Stripe.apiKey = properties.getStripe().getSecretKey();
    }

    @Override
    @Transactional
    public CheckoutSessionResponse createCheckoutSession(Long patientId, CreateCheckoutSessionRequest request) {
        AppointmentSnapshot appointment = appointmentClient.getAppointmentById(request.appointmentId());
        validateAppointmentForPatient(appointment, patientId);

        PaymentTransaction existing = repository.findByAppointmentId(appointment.id()).orElse(null);
        if (existing != null) {
            if (existing.getStatus() == PaymentStatus.PAID || existing.getStatus() == PaymentStatus.COMPLETED) {
                throw new ConflictException("Appointment is already paid");
            }

            if (StringUtils.hasText(existing.getStripeCheckoutSessionId()) && existing.getStatus() == PaymentStatus.CHECKOUT_CREATED) {
                return PaymentMapper.toCheckoutResponse(existing);
            }
        }

        BigDecimal amount = resolveFee(appointment);
        String currency = StringUtils.hasText(appointment.feeCurrency())
            ? appointment.feeCurrency()
            : properties.getPayment().getDefaultCurrency();
        String successUrl = StringUtils.hasText(request.successUrl()) ? request.successUrl() : properties.getPayment().getCheckoutSuccessUrl();
        String cancelUrl = StringUtils.hasText(request.cancelUrl()) ? request.cancelUrl() : properties.getPayment().getCheckoutCancelUrl();

        PaymentTransaction transaction = existing != null ? existing : new PaymentTransaction();
        transaction.setAppointmentId(appointment.id());
        transaction.setPatientId(appointment.patientId());
        transaction.setDoctorId(appointment.doctorId());
        transaction.setAppointmentDate(appointment.appointmentDate());
        transaction.setStartTime(appointment.startTime());
        transaction.setEndTime(appointment.endTime());
        transaction.setAppointmentType(appointment.appointmentType());
        transaction.setAmount(amount);
        transaction.setCurrency(currency.toUpperCase(Locale.ROOT));
        transaction.setStatus(PaymentStatus.CHECKOUT_CREATED);
        transaction.setProvider(PaymentProvider.STRIPE);

        SessionCreateParams params = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setSuccessUrl(successUrl)
                .setCancelUrl(cancelUrl)
                .setCustomerEmail("patient-" + appointment.patientId() + "@smarthealthcare.local")
                .addLineItem(SessionCreateParams.LineItem.builder()
                        .setQuantity(1L)
                        .setPriceData(SessionCreateParams.LineItem.PriceData.builder()
                                .setCurrency(currency.toLowerCase(Locale.ROOT))
                                .setUnitAmount(resolveStripeAmount(amount))
                                .setProductData(SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                        .setName("Consultation fee for appointment #" + appointment.id())
                                        .setDescription("Doctor " + appointment.doctorId() + " consultation")
                                        .build())
                                .build())
                        .build())
                .putMetadata("appointmentId", String.valueOf(appointment.id()))
                .putMetadata("patientId", String.valueOf(appointment.patientId()))
                .putMetadata("doctorId", String.valueOf(appointment.doctorId()))
                .putMetadata("appointmentType", appointment.appointmentType())
                .putMetadata("paymentReference", UUID.randomUUID().toString())
                .build();

        try {
            Session session = Session.create(params);
            transaction.setStripeCheckoutSessionId(session.getId());
            transaction.setCheckoutUrl(session.getUrl());
            PaymentTransaction saved = repository.save(transaction);
            return PaymentMapper.toCheckoutResponse(saved);
        } catch (StripeException ex) {
            throw new ConflictException("Unable to create Stripe checkout session: " + ex.getMessage());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentResponse getPaymentById(Long paymentId) {
        return PaymentMapper.toResponse(findPayment(paymentId));
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentResponse getPaymentByAppointmentId(Long appointmentId) {
        return PaymentMapper.toResponse(repository.findByAppointmentId(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found for appointment " + appointmentId)));
    }

    @Override
    @Transactional(readOnly = true)
    public List<PaymentResponse> getPaymentsByPatientId(Long patientId) {
        return repository.findByPatientIdOrderByCreatedAtDesc(patientId).stream().map(PaymentMapper::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<PaymentResponse> getPaymentsByDoctorId(Long doctorId) {
        return repository.findByDoctorIdOrderByCreatedAtDesc(doctorId).stream().map(PaymentMapper::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<PaymentResponse> getAllPayments() {
        return repository.findAll().stream().sorted((left, right) -> right.getCreatedAt().compareTo(left.getCreatedAt())).map(PaymentMapper::toResponse).toList();
    }

    @Override
    @Transactional
    public PaymentResponse handleStripeWebhook(String payload, String signatureHeader) {
        try {
            Event event = Webhook.constructEvent(payload, signatureHeader, properties.getStripe().getWebhookSecret());
            return handleWebhookEvent(event);
        } catch (StripeException ex) {
            throw new ConflictException("Invalid Stripe webhook payload: " + ex.getMessage());
        }
    }

    @Override
    @Transactional
    public PaymentResponse syncCheckoutSession(String sessionId) {
        if (!StringUtils.hasText(sessionId)) {
            throw new ConflictException("Checkout session id is required");
        }

        try {
            Session session = Session.retrieve(sessionId);
            PaymentTransaction transaction = findByCheckoutSessionId(sessionId);

            if (transaction.getStatus() == PaymentStatus.PAID || transaction.getStatus() == PaymentStatus.COMPLETED) {
                return PaymentMapper.toResponse(transaction);
            }

            String paymentStatus = session.getPaymentStatus();
            boolean isPaid = "paid".equalsIgnoreCase(paymentStatus) || "complete".equalsIgnoreCase(paymentStatus);
            if (!isPaid) {
                throw new ConflictException("Payment has not been confirmed by Stripe yet");
            }

            if (StringUtils.hasText(session.getPaymentIntent())) {
                transaction.setStripePaymentIntentId(session.getPaymentIntent());
            }

            return handleCheckoutCompleted(session);
        } catch (StripeException ex) {
            throw new ConflictException("Unable to verify Stripe checkout session: " + ex.getMessage());
        }
    }

    @Override
    @Transactional
    public PaymentResponse requestRefund(Long paymentId, RefundRequest request) {
        throw new ConflictException("Refunds are not allowed. Channeling payments are non-refundable.");
    }

    @Override
    @Transactional
    public PaymentResponse completeConsultation(Long paymentId, ConsultationCompletionRequest request) {
        PaymentTransaction transaction = findPayment(paymentId);
        if (transaction.getStatus() != PaymentStatus.PAID && transaction.getStatus() != PaymentStatus.COMPLETED) {
            throw new ConflictException("Consultation can only be completed after payment is confirmed");
        }

        transaction.setStatus(PaymentStatus.COMPLETED);
        transaction.setCompletedAt(LocalDateTime.now());
        PaymentTransaction saved = repository.save(transaction);
        syncAppointmentPaymentStatus(saved, "COMPLETED", saved.getPaidAt(), saved.getTelemedicineSessionUrl());
        publishNotification("CONSULTATION_COMPLETED", saved, "Consultation completed successfully", saved.getPatientId());
        publishNotification("CONSULTATION_COMPLETED_DOCTOR", saved, "Consultation completion recorded", saved.getDoctorId());
        return PaymentMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentSummaryResponse getSummary() {
        return PaymentMapper.toSummary(repository.findAll(), properties.getPayment().getDefaultCurrency().toUpperCase(Locale.ROOT));
    }

    @Transactional
    public PaymentResponse handleWebhookEvent(Event event) {
        if ("checkout.session.completed".equals(event.getType())) {
            return handleCheckoutCompleted(extractStripeObject(event, Session.class));
        }

        if ("payment_intent.payment_failed".equals(event.getType())) {
            return handlePaymentFailed(extractStripeObject(event, PaymentIntent.class));
        }

        if ("charge.refunded".equals(event.getType())) {
            return handleRefundEvent(event);
        }

        return PaymentMapper.toResponse(findOrCreateWebhookPlaceholder(event.getType()));
    }

    @Transactional
    public void refreshReminders() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime reminderBoundary = now.plusHours(properties.getPayment().getReminderLeadHours());

        List<PaymentTransaction> candidates = repository.findByStatusInOrderByCreatedAtDesc(List.of(PaymentStatus.PAID));
        for (PaymentTransaction transaction : candidates) {
            if (transaction.isReminderSent()) {
                continue;
            }

            LocalDateTime consultationTime = LocalDateTime.of(transaction.getAppointmentDate(), transaction.getStartTime());
            boolean withinReminderWindow = !consultationTime.isBefore(now) && !consultationTime.isAfter(reminderBoundary);
            if (withinReminderWindow) {
                try {
                    publishNotification("APPOINTMENT_REMINDER", transaction, "Your consultation starts soon", transaction.getPatientId());
                    transaction.setReminderSent(true);
                    transaction.setReminderSentAt(LocalDateTime.now());
                    repository.save(transaction);
                } catch (Exception ex) {
                    log.warn("Unable to send reminder for payment {}: {}", transaction.getId(), ex.getMessage());
                }
            }
        }
    }

    private PaymentResponse handleCheckoutCompleted(Session session) {
        PaymentTransaction transaction = findByCheckoutSessionId(session.getId());
        if (transaction.getStatus() == PaymentStatus.PAID || transaction.getStatus() == PaymentStatus.COMPLETED) {
            return PaymentMapper.toResponse(transaction);
        }

        transaction.setStatus(PaymentStatus.PAID);
        transaction.setStripePaymentIntentId(session.getPaymentIntent());
        transaction.setPaidAt(LocalDateTime.now());

        prepareTelemedicineAccess(transaction);
        PaymentTransaction saved = repository.save(transaction);
        syncAppointmentPaymentStatus(saved, "PAID", saved.getPaidAt(), saved.getTelemedicineSessionUrl());
        publishNotification("PAYMENT_CONFIRMED", saved, "Payment confirmed and consultation ready", saved.getPatientId());
        publishNotification("PAYMENT_CONFIRMED_DOCTOR", saved, "A consultation payment has been confirmed", saved.getDoctorId());
        return PaymentMapper.toResponse(saved);
    }

    private PaymentResponse handlePaymentFailed(PaymentIntent paymentIntent) {
        PaymentTransaction transaction = findByPaymentIntentId(paymentIntent.getId());
        transaction.setStatus(PaymentStatus.FAILED);
        transaction.setFailureReason(paymentIntent.getLastPaymentError() != null
                ? paymentIntent.getLastPaymentError().getMessage()
                : "Stripe payment failed");
        PaymentTransaction saved = repository.save(transaction);
        syncAppointmentPaymentStatus(saved, "FAILED", null, null);
        publishNotification("PAYMENT_FAILED", saved, "Payment failed", saved.getPatientId());
        return PaymentMapper.toResponse(saved);
    }

    private PaymentResponse handleRefundEvent(Event event) {
        Charge charge = extractStripeObject(event, Charge.class);
        PaymentTransaction transaction = findByPaymentIntentId(charge.getPaymentIntent());
        transaction.setStatus(PaymentStatus.REFUNDED);
        transaction.setRefundedAt(LocalDateTime.now());
        transaction.setStripeRefundId(extractRefundId(event));
        PaymentTransaction saved = repository.save(transaction);
        syncAppointmentPaymentStatus(saved, "REFUNDED", null, null);
        publishNotification("PAYMENT_REFUNDED", saved, "Payment refunded", saved.getPatientId());
        return PaymentMapper.toResponse(saved);
    }

    private PaymentTransaction findOrCreateWebhookPlaceholder(String eventType) {
        PaymentTransaction transaction = new PaymentTransaction();
        transaction.setAppointmentId(-1L);
        transaction.setPatientId(-1L);
        transaction.setDoctorId(-1L);
        transaction.setAppointmentDate(java.time.LocalDate.now());
        transaction.setStartTime(LocalTime.now().truncatedTo(ChronoUnit.MINUTES));
        transaction.setEndTime(LocalTime.now().plusMinutes(30).truncatedTo(ChronoUnit.MINUTES));
        transaction.setAppointmentType(eventType);
        transaction.setAmount(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
        transaction.setCurrency(properties.getPayment().getDefaultCurrency().toUpperCase(Locale.ROOT));
        transaction.setStatus(PaymentStatus.CREATED);
        transaction.setProvider(PaymentProvider.STRIPE);
        return transaction;
    }

    private PaymentTransaction findPayment(Long paymentId) {
        return repository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with id " + paymentId));
    }

    private PaymentTransaction findByCheckoutSessionId(String checkoutSessionId) {
        return repository.findByStripeCheckoutSessionId(checkoutSessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found for checkout session " + checkoutSessionId));
    }

    private PaymentTransaction findByPaymentIntentId(String paymentIntentId) {
        return repository.findByStripePaymentIntentId(paymentIntentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found for payment intent " + paymentIntentId));
    }

    private void validateAppointmentForPatient(AppointmentSnapshot appointment, Long patientId) {
        if (appointment == null) {
            throw new ResourceNotFoundException("Appointment not found");
        }

        if (!appointment.patientId().equals(patientId)) {
            throw new ConflictException("Appointment does not belong to the signed-in patient");
        }

        if (appointment.status() == null || !"CONFIRMED".equalsIgnoreCase(appointment.status())) {
            throw new ConflictException("Payment is available only after doctor approval");
        }
    }

    private BigDecimal resolveFee(AppointmentSnapshot appointment) {
        if (appointment.finalFee() != null && appointment.finalFee().compareTo(BigDecimal.ZERO) > 0) {
            return appointment.finalFee().setScale(2, RoundingMode.HALF_UP);
        }

        Long doctorId = appointment.doctorId();
        String appointmentType = appointment.appointmentType();
        try {
            DoctorSnapshot doctor = doctorClient.getDoctorById(doctorId);
            if (doctor != null && doctor.consultationFee() != null && doctor.consultationFee().compareTo(BigDecimal.ZERO) > 0) {
                return doctor.consultationFee().setScale(2, RoundingMode.HALF_UP);
            }
        } catch (Exception ex) {
            log.warn("Using fixed channeling price for doctor {} due to pricing lookup issue: {}", doctorId, ex.getMessage());
        }

        if (appointmentType != null && appointmentType.equalsIgnoreCase("VIDEO")) {
            return properties.getPayment().getVideoConsultationFee().setScale(2, RoundingMode.HALF_UP);
        }
        return properties.getPayment().getPhysicalConsultationFee().setScale(2, RoundingMode.HALF_UP);
    }

    private void syncAppointmentPaymentStatus(
            PaymentTransaction transaction,
            String paymentStatus,
            LocalDateTime paidAt,
            String telemedicineSessionUrl) {
        try {
            appointmentClient.updateAppointmentPaymentStatus(
                    transaction.getAppointmentId(),
                    new AppointmentPaymentStatusUpdateRequest(paymentStatus, paidAt, telemedicineSessionUrl));
        } catch (Exception ex) {
            log.warn("Unable to sync payment status to appointment {}: {}", transaction.getAppointmentId(), ex.getMessage());
        }
    }

    private Long resolveStripeAmount(BigDecimal amount) {
        return amount.multiply(BigDecimal.valueOf(100)).longValueExact();
    }

    private void prepareTelemedicineAccess(PaymentTransaction transaction) {
        transaction.setTelemedicineSessionId(null);
        transaction.setTelemedicineSessionUrl(null);

        if (!"VIDEO".equalsIgnoreCase(transaction.getAppointmentType())) {
            return;
        }

        try {
            AppointmentSnapshot appointment = appointmentClient.getAppointmentById(transaction.getAppointmentId());
            TelemedicineSessionResponse telemedicineSession = telemedicineClient.createSession(
                    new TelemedicineSessionRequest(
                            transaction.getId(),
                            transaction.getAppointmentId(),
                            transaction.getPatientId(),
                            transaction.getDoctorId(),
                            transaction.getAppointmentDate(),
                            transaction.getStartTime(),
                            transaction.getEndTime(),
                            transaction.getAppointmentType(),
                            transaction.getAmount(),
                            transaction.getCurrency(),
                            appointment.reasonForVisit()));
            transaction.setTelemedicineSessionId(telemedicineSession.sessionId());
            transaction.setTelemedicineSessionUrl(telemedicineSession.sessionUrl());
        } catch (Exception ex) {
            log.warn("Unable to create telemedicine session for appointment {}: {}", transaction.getAppointmentId(), ex.getMessage());
            transaction.setTelemedicineSessionUrl(buildTelemedicineFallbackUrl(transaction.getAppointmentId()));
        }
    }

    private String buildTelemedicineFallbackUrl(Long appointmentId) {
        String baseUrl = properties.getIntegrations().getTelemedicineFallbackBaseUrl();
        if (!StringUtils.hasText(baseUrl)) {
            return null;
        }

        return baseUrl.endsWith("/")
                ? baseUrl + "appointment-" + appointmentId
                : baseUrl + "/appointment-" + appointmentId;
    }

    private void publishNotification(String eventType, PaymentTransaction transaction, String message, Long targetUserId) {
        try {
            boolean useDefaultTemplate = shouldUseDefaultTemplate(eventType);
            notificationClient.sendEvent(new NotificationEventRequest(
                    eventType,
                    determineTargetRole(targetUserId, transaction),
                    targetUserId,
                    transaction.getId(),
                    transaction.getAppointmentId(),
                    useDefaultTemplate ? null : "Smart Healthcare payment update",
                    useDefaultTemplate ? null : message,
                    transaction.getAppointmentDate().atTime(transaction.getStartTime())));
        } catch (Exception ex) {
            log.warn("Notification dispatch failed for payment {}: {}", transaction.getId(), ex.getMessage());
        }
    }

    private boolean shouldUseDefaultTemplate(String eventType) {
        return switch (eventType == null ? "" : eventType.trim().toUpperCase(Locale.ROOT)) {
            case "PAYMENT_CONFIRMED", "PAYMENT_CONFIRMED_DOCTOR", "CONSULTATION_COMPLETED", "CONSULTATION_COMPLETED_DOCTOR" -> true;
            default -> false;
        };
    }

    private String determineTargetRole(Long targetUserId, PaymentTransaction transaction) {
        if (targetUserId != null && targetUserId.equals(transaction.getPatientId())) {
            return "PATIENT";
        }
        if (targetUserId != null && targetUserId.equals(transaction.getDoctorId())) {
            return "DOCTOR";
        }
        return "SYSTEM";
    }

    private <T extends StripeObject> T extractStripeObject(Event event, Class<T> type) {
        Optional<StripeObject> object = event.getDataObjectDeserializer().getObject();
        if (object.isEmpty() || !type.isInstance(object.get())) {
            throw new ConflictException("Unable to deserialize Stripe webhook payload");
        }
        return type.cast(object.get());
    }

    private String extractRefundId(Event event) {
        return event.getId();
    }
}
