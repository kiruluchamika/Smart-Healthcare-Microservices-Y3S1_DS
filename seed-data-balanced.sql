-- Smart Healthcare Microservices - Balanced Demo Seed Data
-- Date: 2026-04-12
-- Mode: Seed only (no DDL)
--
-- How to use:
-- 1) Start each service at least once so Hibernate creates tables (ddl-auto=update).
-- 2) Run this file in MySQL Workbench.
-- 3) Re-running is safe because inserts are idempotent via ON DUPLICATE KEY UPDATE.

SET NAMES utf8mb4;

-- =========================================================
-- AUTH SERVICE
-- DB: auth_service_db
-- =========================================================
USE auth_service_db;

INSERT INTO users (
    id,
    email,
    password_hash,
    role,
    first_name,
    last_name,
    phone_number,
    is_email_verified,
    is_enabled,
    is_account_non_locked,
    failed_login_attempts,
    lock_time,
    last_login_at,
    password_changed_at,
    created_at,
    updated_at
) VALUES
    (
        1,
        'admin@gmail.com',
        '$2a$10$I1PlTXW7OHMBWxAEkjuCB./o.sOfrv5YStxxJQDmmgGPDLqCD2Daq',
        'ADMIN',
        'System',
        'Admin',
        '+94-11-900-1000',
        1,
        1,
        1,
        0,
        NULL,
        '2026-04-11 08:15:00',
        '2026-04-01 10:00:00',
        '2026-04-01 10:00:00',
        '2026-04-11 08:15:00'
    ),
    (
        2,
        'doctor@gmail.com',
        '$2a$10$LTC75WWx8liXAOo6qguj/.tzNPLzn0SPc5/.aGUpqTCkpEfkHkaAS',
        'DOCTOR',
        'Nimal',
        'Perera',
        '+94-71-111-2233',
        1,
        1,
        1,
        0,
        NULL,
        '2026-04-11 09:05:00',
        '2026-04-01 10:00:00',
        '2026-04-01 10:00:00',
        '2026-04-11 09:05:00'
    ),
    (
        3,
        'dr.anuja@smarthealth.local',
        '$2a$10$8xYxQ1E8k6v0b9WgM8h4EeuM4jD7dXlZgI7u7ZqzE4o6FjQmQkA1e',
        'DOCTOR',
        'Anuja',
        'Fernando',
        '+94-71-444-5566',
        1,
        1,
        1,
        0,
        NULL,
        '2026-04-11 09:10:00',
        '2026-04-01 10:00:00',
        '2026-04-01 10:00:00',
        '2026-04-11 09:10:00'
    ),
    (
        4,
        'sachini.j@smarthealth.local',
        '$2a$10$8xYxQ1E8k6v0b9WgM8h4EeuM4jD7dXlZgI7u7ZqzE4o6FjQmQkA1e',
        'PATIENT',
        'Sachini',
        'Jayasekara',
        '+94-77-101-2020',
        1,
        1,
        1,
        0,
        NULL,
        '2026-04-11 10:20:00',
        '2026-04-01 10:00:00',
        '2026-04-01 10:00:00',
        '2026-04-11 10:20:00'
    ),
    (
        5,
        'kavindu.r@smarthealth.local',
        '$2a$10$8xYxQ1E8k6v0b9WgM8h4EeuM4jD7dXlZgI7u7ZqzE4o6FjQmQkA1e',
        'PATIENT',
        'Kavindu',
        'Rathnayake',
        '+94-77-303-4040',
        1,
        1,
        1,
        0,
        NULL,
        '2026-04-11 11:00:00',
        '2026-04-01 10:00:00',
        '2026-04-01 10:00:00',
        '2026-04-11 11:00:00'
    )
ON DUPLICATE KEY UPDATE id = id;

-- =========================================================
-- DOCTOR SERVICE
-- DB: doctor_service_db
-- =========================================================
USE doctor_service_db;

INSERT INTO doctors (
    id,
    first_name,
    last_name,
    email,
    phone,
    specialization,
    qualifications,
    experience_years,
    license_number,
    bio,
    board_certifications,
    languages_spoken,
    clinic_locations,
    insurance_providers,
    license_expiry_date,
    verification_status,
    active,
    profile_completeness_score,
    onboarding_state,
    version,
    created_at,
    updated_at
) VALUES
    (
        1,
        'Nimal',
        'Perera',
        'doctor@gmail.com',
        '+94-71-111-2233',
        'Cardiology',
        'MBBS, MD Cardiology',
        12,
        'SLMC-CARD-0001',
        'Consultant cardiologist focused on preventive heart care.',
        'Board Certified Cardiology',
        'English,Sinhala',
        'Colombo Heart Center, Nugegoda Clinic',
        'AIA, Ceylinco',
        '2028-11-30',
        'APPROVED',
        1,
        95,
        'VERIFIED',
        0,
        '2026-04-01 08:00:00',
        '2026-04-11 09:05:00'
    ),
    (
        2,
        'Anuja',
        'Fernando',
        'dr.anuja@smarthealth.local',
        '+94-71-444-5566',
        'Dermatology',
        'MBBS, MD Dermatology',
        8,
        'SLMC-DERM-0002',
        'Dermatologist with interest in chronic skin disorders.',
        'Board Certified Dermatology',
        'English,Sinhala,Tamil',
        'Kandy Skin Care Center',
        'Softlogic, Union Assurance',
        '2027-09-15',
        'APPROVED',
        1,
        90,
        'VERIFIED',
        0,
        '2026-04-01 08:10:00',
        '2026-04-11 09:10:00'
    )
ON DUPLICATE KEY UPDATE id = id;

INSERT INTO doctor_availabilities (
    id,
    doctor_id,
    day_of_week,
    start_time,
    end_time,
    available,
    effective_from,
    effective_to,
    created_at,
    updated_at
) VALUES
    (1, 1, 'MONDAY', '09:00:00', '12:00:00', 1, '2026-04-01', NULL, '2026-04-01 08:30:00', '2026-04-01 08:30:00'),
    (2, 1, 'WEDNESDAY', '14:00:00', '17:00:00', 1, '2026-04-01', NULL, '2026-04-01 08:31:00', '2026-04-01 08:31:00'),
    (3, 2, 'TUESDAY', '10:00:00', '13:00:00', 1, '2026-04-01', NULL, '2026-04-01 08:32:00', '2026-04-01 08:32:00'),
    (4, 2, 'FRIDAY', '15:00:00', '18:00:00', 1, '2026-04-01', NULL, '2026-04-01 08:33:00', '2026-04-01 08:33:00')
ON DUPLICATE KEY UPDATE id = id;

INSERT INTO doctor_verification_history (
    id,
    doctor_id,
    previous_status,
    new_status,
    reason,
    notes,
    changed_by,
    changed_at
) VALUES
    (
        1,
        1,
        'PENDING',
        'APPROVED',
        'Credentials verified',
        'SLMC registration and certificates validated.',
        'admin@gmail.com',
        '2026-04-02 11:00:00'
    ),
    (
        2,
        2,
        'PENDING',
        'APPROVED',
        'Onboarding approved',
        'Background check and references completed.',
        'admin@gmail.com',
        '2026-04-02 11:30:00'
    )
ON DUPLICATE KEY UPDATE id = id;

-- =========================================================
-- PATIENT SERVICE
-- DB: patient_service_db
-- =========================================================
USE patient_service_db;

INSERT INTO patient_profiles (
    id,
    auth_user_id,
    date_of_birth,
    gender,
    blood_group,
    address,
    emergency_contact_name,
    emergency_contact_phone,
    allergies,
    chronic_conditions,
    profile_picture_url,
    bio,
    created_at,
    updated_at
) VALUES
    (
        1,
        4,
        '1997-06-14',
        'FEMALE',
        'A+',
        'No. 17, Lake Road, Colombo 08',
        'Nadeesha Jayasekara',
        '+94-77-500-6000',
        'Penicillin',
        'Mild asthma',
        '/uploads/profile-pictures/patient-1.jpg',
        'Working professional, prefers evening appointments.',
        '2026-04-01 12:00:00',
        '2026-04-11 10:25:00'
    ),
    (
        2,
        5,
        '1994-02-02',
        'MALE',
        'B+',
        'No. 42, Temple Street, Kandy',
        'Ishara Rathnayake',
        '+94-77-700-8000',
        'None known',
        'Seasonal sinusitis',
        '/uploads/profile-pictures/patient-2.jpg',
        'Active lifestyle, prefers weekend consultations.',
        '2026-04-01 12:10:00',
        '2026-04-11 11:05:00'
    )
ON DUPLICATE KEY UPDATE id = id;

INSERT INTO medical_history (
    id,
    patient_profile_id,
    event_type,
    title,
    description,
    event_date,
    doctor_name,
    facility_name,
    notes,
    created_at,
    updated_at
) VALUES
    (
        1,
        1,
        'DIAGNOSIS',
        'Asthma Review',
        'Routine respiratory review with medication adjustment.',
        '2025-10-12',
        'Dr. Nimal Perera',
        'Colombo Heart Center',
        'Continue inhaler twice daily.',
        '2026-04-01 12:30:00',
        '2026-04-01 12:30:00'
    ),
    (
        2,
        1,
        'LAB_RESULT',
        'Lipid Profile',
        'Annual lipid profile for preventive screening.',
        '2026-01-20',
        'Dr. Nimal Perera',
        'MediLab Colombo',
        'Borderline LDL, advised dietary changes.',
        '2026-04-01 12:31:00',
        '2026-04-01 12:31:00'
    ),
    (
        3,
        2,
        'DIAGNOSIS',
        'Chronic Sinusitis Follow-up',
        'Persistent seasonal sinus symptoms reviewed.',
        '2025-11-05',
        'Dr. Anuja Fernando',
        'Kandy Skin Care Center',
        'Steam inhalation and antihistamine continued.',
        '2026-04-01 12:32:00',
        '2026-04-01 12:32:00'
    )
ON DUPLICATE KEY UPDATE id = id;

INSERT INTO medical_reports (
    id,
    patient_profile_id,
    title,
    description,
    report_type,
    report_date,
    file_name,
    original_file_name,
    file_path,
    file_size,
    content_type,
    uploaded_at
) VALUES
    (
        1,
        1,
        'Lipid Profile Report',
        'Lab report including HDL, LDL and triglycerides.',
        'LAB_REPORT',
        '2026-01-20',
        'lipid-profile-2026-01-20.pdf',
        'lipid-profile.pdf',
        '/uploads/reports/patient-1/lipid-profile-2026-01-20.pdf',
        248320,
        'application/pdf',
        '2026-04-01 12:45:00'
    ),
    (
        2,
        2,
        'ENT Prescription',
        'Prescription for sinusitis management.',
        'PRESCRIPTION',
        '2025-11-05',
        'ent-prescription-2025-11-05.pdf',
        'prescription.pdf',
        '/uploads/reports/patient-2/ent-prescription-2025-11-05.pdf',
        124110,
        'application/pdf',
        '2026-04-01 12:46:00'
    )
ON DUPLICATE KEY UPDATE id = id;

-- =========================================================
-- APPOINTMENT SERVICE
-- DB: appointment_service_db
-- =========================================================
USE appointment_service_db;

INSERT INTO appointments (
    id,
    patient_id,
    doctor_id,
    appointment_date,
    start_time,
    end_time,
    appointment_type,
    status,
    reason_for_visit,
    created_at,
    updated_at
) VALUES
    (
        1,
        1,
        1,
        '2026-04-15',
        '09:30:00',
        '10:00:00',
        'VIDEO',
        'CONFIRMED',
        'Quarterly cardiac follow-up and lifestyle review.',
        '2026-04-11 10:30:00',
        '2026-04-11 10:40:00'
    ),
    (
        2,
        2,
        2,
        '2026-04-16',
        '15:30:00',
        '16:00:00',
        'PHYSICAL',
        'PENDING',
        'Recurring sinus discomfort and medication review.',
        '2026-04-11 11:10:00',
        '2026-04-11 11:10:00'
    ),
    (
        3,
        1,
        2,
        '2026-04-18',
        '10:30:00',
        '11:00:00',
        'VIDEO',
        'COMPLETED',
        'Skin allergy consultation for seasonal flare-up.',
        '2026-04-05 09:00:00',
        '2026-04-08 17:30:00'
    )
ON DUPLICATE KEY UPDATE id = id;

-- =========================================================
-- PAYMENT SERVICE
-- DB: payment_service_db
-- =========================================================
USE payment_service_db;

INSERT INTO payment_transactions (
    id,
    appointment_id,
    patient_id,
    doctor_id,
    appointment_date,
    start_time,
    end_time,
    appointment_type,
    amount,
    currency,
    status,
    provider,
    stripe_checkout_session_id,
    stripe_payment_intent_id,
    stripe_refund_id,
    checkout_url,
    telemedicine_session_url,
    telemedicine_session_id,
    failure_reason,
    refund_reason,
    reminder_sent,
    paid_at,
    refunded_at,
    completed_at,
    reminder_sent_at,
    created_at,
    updated_at
) VALUES
    (
        1,
        1,
        1,
        1,
        '2026-04-15',
        '09:30:00',
        '10:00:00',
        'VIDEO',
        15.00,
        'USD',
        'PAID',
        'STRIPE',
        'cs_test_a1b2c3_appointment_1',
        'pi_test_a1b2c3_appointment_1',
        NULL,
        'https://checkout.stripe.com/pay/cs_test_a1b2c3_appointment_1',
        'https://meet.jit.si/smarthealth-apt-1',
        'smarthealth-apt-1',
        NULL,
        NULL,
        1,
        '2026-04-11 10:42:00',
        NULL,
        NULL,
        '2026-04-14 09:30:00',
        '2026-04-11 10:40:00',
        '2026-04-14 09:30:00'
    ),
    (
        2,
        2,
        2,
        2,
        '2026-04-16',
        '15:30:00',
        '16:00:00',
        'PHYSICAL',
        20.00,
        'USD',
        'CHECKOUT_CREATED',
        'STRIPE',
        'cs_test_d4e5f6_appointment_2',
        NULL,
        NULL,
        'https://checkout.stripe.com/pay/cs_test_d4e5f6_appointment_2',
        NULL,
        NULL,
        NULL,
        NULL,
        0,
        NULL,
        NULL,
        NULL,
        NULL,
        '2026-04-11 11:12:00',
        '2026-04-11 11:12:00'
    ),
    (
        3,
        3,
        1,
        2,
        '2026-04-18',
        '10:30:00',
        '11:00:00',
        'VIDEO',
        15.00,
        'USD',
        'COMPLETED',
        'STRIPE',
        'cs_test_g7h8i9_appointment_3',
        'pi_test_g7h8i9_appointment_3',
        NULL,
        'https://checkout.stripe.com/pay/cs_test_g7h8i9_appointment_3',
        'https://meet.jit.si/smarthealth-apt-3',
        'smarthealth-apt-3',
        NULL,
        NULL,
        1,
        '2026-04-08 16:55:00',
        NULL,
        '2026-04-08 17:32:00',
        '2026-04-17 10:30:00',
        '2026-04-05 09:02:00',
        '2026-04-17 10:30:00'
    )
ON DUPLICATE KEY UPDATE id = id;

-- =========================================================
-- AI DOCTOR SUGGESTION SERVICE
-- DB: ai_doctor_suggestion_db
-- =========================================================
USE ai_doctor_suggestion_db;

INSERT INTO doctor_embedding_cache (
    id,
    doctor_id,
    source_text,
    embedding_json,
    created_at,
    updated_at
) VALUES
    (
        1,
        1,
        'Cardiology specialist with 12 years experience, Colombo clinics, speaks English and Sinhala.',
        '[0.1234,0.0456,-0.0789,0.2211,0.0312,-0.0144,0.1678,-0.0901]',
        '2026-04-10 08:00:00',
        '2026-04-10 08:00:00'
    ),
    (
        2,
        2,
        'Dermatology specialist with 8 years experience, Kandy clinic, speaks English, Sinhala and Tamil.',
        '[0.1021,0.0633,-0.0520,0.1987,0.0441,-0.0217,0.1822,-0.0713]',
        '2026-04-10 08:05:00',
        '2026-04-10 08:05:00'
    )
ON DUPLICATE KEY UPDATE id = id;

INSERT INTO suggestion_log (
    id,
    patient_id,
    query_text,
    recommended_specialty,
    explanation,
    created_at
) VALUES
    (
        1,
        1,
        'Chest discomfort during exercise and family history of high blood pressure',
        'Cardiology',
        'Symptoms and risk profile match cardiovascular screening needs; cardiology consultation recommended.',
        '2026-04-11 18:10:00'
    ),
    (
        2,
        2,
        'Recurring itchy skin patches and dryness for 3 weeks',
        'Dermatology',
        'Presentation suggests chronic skin inflammation; dermatology evaluation advised.',
        '2026-04-11 18:25:00'
    )
ON DUPLICATE KEY UPDATE id = id;

-- End of seed file
