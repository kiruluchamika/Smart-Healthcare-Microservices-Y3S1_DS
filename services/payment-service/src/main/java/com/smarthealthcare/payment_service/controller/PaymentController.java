package com.smarthealthcare.payment_service.controller;

import com.smarthealthcare.payment_service.dto.request.ConsultationCompletionRequest;
import com.smarthealthcare.payment_service.dto.request.CreateCheckoutSessionRequest;
import com.smarthealthcare.payment_service.dto.request.RefundRequest;
import com.smarthealthcare.payment_service.dto.response.ApiMessageResponse;
import com.smarthealthcare.payment_service.dto.response.CheckoutSessionResponse;
import com.smarthealthcare.payment_service.dto.response.PaymentResponse;
import com.smarthealthcare.payment_service.dto.response.PaymentSummaryResponse;
import com.smarthealthcare.payment_service.security.AccessControlService;
import com.smarthealthcare.payment_service.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/payments")
public class PaymentController {

    private final PaymentService paymentService;
    private final AccessControlService accessControlService;

    public PaymentController(PaymentService paymentService, AccessControlService accessControlService) {
        this.paymentService = paymentService;
        this.accessControlService = accessControlService;
    }

    @PostMapping("/checkout-sessions")
    @Operation(summary = "Create Stripe checkout session for a consultation")
    public ResponseEntity<CheckoutSessionResponse> createCheckoutSession(
            @Valid @RequestBody CreateCheckoutSessionRequest request,
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @RequestHeader(value = "X-Patient-Id", required = false) Long patientId) {
        Long authenticatedPatientId = accessControlService.requirePatientAccess(authorizationHeader, patientId);
        return ResponseEntity.status(HttpStatus.CREATED).body(paymentService.createCheckoutSession(authenticatedPatientId, request));
    }

    @PostMapping("/checkout-sessions/{sessionId}/sync")
    @Operation(summary = "Synchronize a Stripe checkout session after redirect")
    public ResponseEntity<PaymentResponse> syncCheckoutSession(
            @PathVariable String sessionId,
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @RequestHeader(value = "X-Patient-Id", required = false) Long patientId) {
        accessControlService.requirePatientAccess(authorizationHeader, patientId);
        return ResponseEntity.ok(paymentService.syncCheckoutSession(sessionId));
    }

    @GetMapping("/{paymentId}")
    @Operation(summary = "Get payment by id")
    public ResponseEntity<PaymentResponse> getPaymentById(
            @PathVariable @Positive Long paymentId,
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @RequestHeader(value = "X-Patient-Id", required = false) Long patientId,
            @RequestHeader(value = "X-Doctor-Id", required = false) Long doctorId) {
        if (patientId != null) {
            accessControlService.requirePatientAccess(authorizationHeader, patientId);
        } else if (doctorId != null) {
            accessControlService.requireDoctorAccess(authorizationHeader, doctorId);
        } else {
            accessControlService.requireAdminAccess(authorizationHeader);
        }
        return ResponseEntity.ok(paymentService.getPaymentById(paymentId));
    }

    @GetMapping("/appointment/{appointmentId}")
    @Operation(summary = "Get payment for an appointment")
    public ResponseEntity<PaymentResponse> getPaymentByAppointmentId(
            @PathVariable @Positive Long appointmentId,
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @RequestHeader(value = "X-Patient-Id", required = false) Long patientId,
            @RequestHeader(value = "X-Doctor-Id", required = false) Long doctorId) {
        if (patientId != null) {
            accessControlService.requirePatientAccess(authorizationHeader, patientId);
        } else if (doctorId != null) {
            accessControlService.requireDoctorAccess(authorizationHeader, doctorId);
        } else {
            accessControlService.requireAdminAccess(authorizationHeader);
        }
        return ResponseEntity.ok(paymentService.getPaymentByAppointmentId(appointmentId));
    }

    @GetMapping("/patient/me")
    @Operation(summary = "List patient payments")
    public ResponseEntity<List<PaymentResponse>> getMyPatientPayments(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @RequestHeader(value = "X-Patient-Id", required = false) Long patientId) {
        Long authenticatedPatientId = accessControlService.requirePatientAccess(authorizationHeader, patientId);
        return ResponseEntity.ok(paymentService.getPaymentsByPatientId(authenticatedPatientId));
    }

    @GetMapping("/doctor/me")
    @Operation(summary = "List doctor payments")
    public ResponseEntity<List<PaymentResponse>> getMyDoctorPayments(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @RequestHeader(value = "X-Doctor-Id", required = false) Long doctorId) {
        Long authenticatedDoctorId = accessControlService.requireDoctorAccess(authorizationHeader, doctorId);
        return ResponseEntity.ok(paymentService.getPaymentsByDoctorId(authenticatedDoctorId));
    }

    @GetMapping("/admin/transactions")
    @Operation(summary = "List all transactions for admin")
    public ResponseEntity<List<PaymentResponse>> getAllPayments(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader) {
        accessControlService.requireAdminAccess(authorizationHeader);
        return ResponseEntity.ok(paymentService.getAllPayments());
    }

    @GetMapping("/admin/summary")
    @Operation(summary = "Get payment summary for admin dashboard")
    public ResponseEntity<PaymentSummaryResponse> getSummary(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader) {
        accessControlService.requireAdminAccess(authorizationHeader);
        return ResponseEntity.ok(paymentService.getSummary());
    }

    @PostMapping(path = "/webhooks/stripe", consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Handle Stripe webhook notifications")
    public ResponseEntity<PaymentResponse> handleStripeWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String signatureHeader) {
        return ResponseEntity.ok(paymentService.handleStripeWebhook(payload, signatureHeader));
    }

    @PostMapping("/{paymentId}/refunds")
    @Operation(summary = "Request a refund for a payment")
    public ResponseEntity<PaymentResponse> requestRefund(
            @PathVariable @Positive Long paymentId,
            @Valid @RequestBody RefundRequest request,
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @RequestHeader(value = "X-Patient-Id", required = false) Long patientId) {
        if (patientId != null) {
            accessControlService.requirePatientAccess(authorizationHeader, patientId);
        } else {
            accessControlService.requireAdminAccess(authorizationHeader);
        }
        return ResponseEntity.ok(paymentService.requestRefund(paymentId, request));
    }

    @PostMapping("/{paymentId}/complete")
    @Operation(summary = "Mark consultation as completed")
    public ResponseEntity<PaymentResponse> completeConsultation(
            @PathVariable @Positive Long paymentId,
            @Valid @RequestBody(required = false) ConsultationCompletionRequest request) {
        ConsultationCompletionRequest payload = request == null ? new ConsultationCompletionRequest(null) : request;
        return ResponseEntity.ok(paymentService.completeConsultation(paymentId, payload));
    }

    @GetMapping("/health")
    public ResponseEntity<ApiMessageResponse> health() {
        return ResponseEntity.ok(ApiMessageResponse.of("Payment service is running"));
    }
}