package com.smarthealthcare.payment_service.service;

import com.smarthealthcare.payment_service.dto.request.ConsultationCompletionRequest;
import com.smarthealthcare.payment_service.dto.request.CreateCheckoutSessionRequest;
import com.smarthealthcare.payment_service.dto.request.RefundRequest;
import com.smarthealthcare.payment_service.dto.response.CheckoutSessionResponse;
import com.smarthealthcare.payment_service.dto.response.PaymentResponse;
import com.smarthealthcare.payment_service.dto.response.PaymentSummaryResponse;
import java.util.List;

public interface PaymentService {

    CheckoutSessionResponse createCheckoutSession(Long patientId, CreateCheckoutSessionRequest request);

    PaymentResponse getPaymentById(Long paymentId);

    PaymentResponse getPaymentByAppointmentId(Long appointmentId);

    List<PaymentResponse> getPaymentsByPatientId(Long patientId);

    List<PaymentResponse> getPaymentsByDoctorId(Long doctorId);

    List<PaymentResponse> getAllPayments();

    PaymentResponse handleStripeWebhook(String payload, String signatureHeader);

    PaymentResponse requestRefund(Long paymentId, RefundRequest request);

    PaymentResponse completeConsultation(Long paymentId, ConsultationCompletionRequest request);

    PaymentSummaryResponse getSummary();
}