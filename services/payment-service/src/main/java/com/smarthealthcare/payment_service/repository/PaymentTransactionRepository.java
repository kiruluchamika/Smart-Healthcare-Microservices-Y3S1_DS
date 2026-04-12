package com.smarthealthcare.payment_service.repository;

import com.smarthealthcare.payment_service.entity.PaymentStatus;
import com.smarthealthcare.payment_service.entity.PaymentTransaction;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, Long> {

    Optional<PaymentTransaction> findByAppointmentId(Long appointmentId);

    Optional<PaymentTransaction> findByStripeCheckoutSessionId(String stripeCheckoutSessionId);

    Optional<PaymentTransaction> findByStripePaymentIntentId(String stripePaymentIntentId);

    List<PaymentTransaction> findByPatientIdOrderByCreatedAtDesc(Long patientId);

    List<PaymentTransaction> findByDoctorIdOrderByCreatedAtDesc(Long doctorId);

    List<PaymentTransaction> findByStatusInOrderByCreatedAtDesc(List<PaymentStatus> statuses);

    List<PaymentTransaction> findByStatusOrderByCreatedAtDesc(PaymentStatus status);
}