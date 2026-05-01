# Notification Service Implementation - Complete Guide

## Executive Summary

This document outlines the implementation of the Smart Healthcare notification system with comprehensive logging, error handling, and debugging capabilities. The system sends email and SMS notifications when:
1. Doctor accepts a patient's appointment booking
2. Patient completes payment for appointment

## Implementation Status: ✅ COMPLETE

### Changes Made

#### 1. Enhanced NotificationServiceImpl (20+ log statements added)

**File:** `services/notification-service/src/main/java/com/smarthealthcare/notification_service/service/impl/NotificationServiceImpl.java`

**Logging Phases:**
- `[PROCESS]` - Main event processing flow with START/SUCCESS/FAILED markers
- `[RECIPIENT]` - Recipient resolution orchestration
- `[RECIPIENT-DOCTOR]` - Doctor lookup with contact details
- `[RECIPIENT-PATIENT]` - Patient lookup with fallback sources
- `[CHANNEL]` - Channel resolution (EMAIL, SMS, or BOTH)
- `[DELIVERY]` - Delivery attempt coordination
- `[EMAIL]` - Email sending with SMTP success/failure
- `[SMS]` - SMS sending with Twilio error codes

**Key Features:**
- Detailed exception logging with exception type and message
- PII masking (email: `d***@example.com`, phone: `****5166`)
- Twilio error code capture
- Delivery result tracking (emailSent, smsSent, failures)
- Partial success handling (if EMAIL succeeds but SMS fails, mark SENT)

#### 2. Enhanced AppointmentServiceImpl (Appointment flow logging)

**File:** `services/appointment-service/src/main/java/com/smarthealthcare/appointment_service/service/impl/AppointmentServiceImpl.java`

**Logging Phases:**
- `[ACCEPT-APPOINTMENT]` - Doctor acceptance workflow with status changes
- `[APPOINTMENT]` - Confirmation notification publishing
- `[APPOINTMENT-NOTIFY]` - Notification event dispatch to notification-service

**Key Features:**
- Logs appointment acceptance start/complete
- Logs fee validation steps
- Logs status transitions (PENDING → CONFIRMED)
- Logs notification dispatch attempts and success/failure

#### 3. Channel Resolution Enhancement

**Enhanced Logic:**
- If both email AND phone available → `BOTH` (email + SMS)
- If only email → `EMAIL`
- If only phone → `SMS`
- Default → `EMAIL`

With detailed logging showing why each channel was selected.

---

## Configuration

### SMTP Configuration (Gmail)

**File:** `services/notification-service/src/main/resources/application-docker.yaml` (lines 6-21)

```yaml
spring:
  mail:
    host: smtp.gmail.com
    port: 587  # TLS port
    username: gamindukalmadu8@gmail.com
    password: bnnbdilpxngkpmtz  # ⚠️ Use app-specific password if 2FA enabled
    properties:
      mail:
        smtp:
          auth: true
          starttls:
            enable: true
            required: true
          connectiontimeout: 5000  # 5 seconds
          timeout: 5000
          writetimeout: 5000
```

**Important:** If Gmail account has 2-Factor Authentication enabled:
1. Generate app-specific password: https://myaccount.google.com/apppasswords
2. Update the `password` field with the app-specific password

### Twilio Configuration (SMS)

**File:** `services/notification-service/src/main/resources/application-docker.yaml` (lines 23-27)

```yaml
twilio:
  account-sid: AC1870d6fd6e1e2c9e28c955cdbd749651
  auth-token: b2b7d4716ccd47ee60976b3e5fa63044
  phone-number: +94767955166  # Sri Lanka number
```

**Important:** 
- Account must be active and verified
- Must have SMS credits available
- Phone number must be Twilio-verified

### Service Integration URLs

**File:** `services/notification-service/src/main/resources/application-docker.yaml` (lines 31-37)

```yaml
app:
  integrations:
    auth-base-url: http://auth-service:8080/auth
    doctor-base-url: http://doctor-service:8083/api/v1/doctors
    patient-base-url: http://patient-service:8085/patients
    doctor-username: doctor
    doctor-password: doctor123
```

**Note:** Uses container DNS names (`http://service:port`) for docker-compose networking.

---

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Patient Books Appointment                     │
├─────────────────────────────────────────────────────────────────┤
│ 1. POST /api/v1/appointments (appointment-service)              │
│    └─> Status: PENDING                                           │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Doctor Accepts Appointment                      │
├─────────────────────────────────────────────────────────────────┤
│ 2. PUT /api/v1/appointments/{id}/accept (appointment-service)   │
│    └─> Status: CONFIRMED                                         │
│    └─> [ACCEPT-APPOINTMENT] logs START                           │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│          Appointment Service Publishes Notifications              │
├─────────────────────────────────────────────────────────────────┤
│ 3. POST /api/v1/notifications/events (notification-service)     │
│    └─> [APPOINTMENT-NOTIFY] logs dispatch                       │
│    ├─ Event 1: APPOINTMENT_CONFIRMED (PATIENT)                  │
│    └─ Event 2: APPOINTMENT_CONFIRMED_DOCTOR (DOCTOR)            │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│        Notification Service Processes Each Event                  │
├─────────────────────────────────────────────────────────────────┤
│ 4. NotificationServiceImpl.processEvent()                         │
│    └─> [PROCESS] START logs event details                       │
│    └─> [RECIPIENT] Resolve patient/doctor contact info          │
│    └─> [CHANNEL] Determine EMAIL, SMS, or BOTH                  │
│    └─> [DELIVERY] Attempt email delivery                        │
│    └─> [DELIVERY] Attempt SMS delivery                          │
│    └─> [PROCESS] SUCCESS/FAILED logs final status               │
└─────────────────────────────────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
   ┌─────────────┐         ┌─────────────┐        ┌──────────────┐
   │   Database  │         │   Email     │        │     SMS      │
   │ (SENT/      │         │   Inbox     │        │    Phone     │
   │  FAILED)    │         │             │        │              │
   └─────────────┘         └─────────────┘        └──────────────┘
```

---

## Notification Flow Data

### Event Payload

```json
{
  "eventType": "APPOINTMENT_CONFIRMED",
  "targetRole": "PATIENT",
  "targetUserId": 1,
  "appointmentId": 123,
  "paymentId": null,
  "title": null,  // uses default if null
  "message": null,  // uses default if null
  "scheduledFor": "2026-05-01T14:30:00"
}
```

### Notification Response

```json
{
  "id": 1,
  "eventType": "APPOINTMENT_CONFIRMED",
  "targetRole": "PATIENT",
  "targetUserId": 1,
  "appointmentId": 123,
  "channel": "BOTH",  // EMAIL, SMS, or BOTH
  "status": "SENT",  // PENDING, SENT, or FAILED
  "title": "Appointment Confirmed: You're All Set",
  "message": "Hi [Name], your appointment is confirmed...",
  "recipientName": "John Doe",
  "recipientEmail": "john@example.com",
  "recipientPhone": "+94771234567",
  "failureReason": null,  // null if SENT, error details if FAILED
  "sentAt": "2026-05-01T14:20:15.123Z",
  "readFlag": false,
  "readAt": null,
  "createdAt": "2026-05-01T14:20:14.123Z",
  "updatedAt": "2026-05-01T14:20:15.123Z"
}
```

### Default Message Templates

| Event Type | Target | Title | Message |
|-----------|--------|-------|---------|
| APPOINTMENT_CONFIRMED | PATIENT | "Appointment Confirmed: You're All Set" | "Hi {name}, your appointment is confirmed and your care team is ready..." |
| APPOINTMENT_CONFIRMED_DOCTOR | DOCTOR | "Appointment Confirmed With Patient" | "Hi Dr. {name}, this booking is confirmed. Your patient has been notified..." |
| PAYMENT_CONFIRMED | PATIENT | "Payment Confirmed: Consultation Ready" | "Hi {name}, we received your payment successfully..." |
| PAYMENT_CONFIRMED_DOCTOR | DOCTOR | "Patient Payment Received" | "A patient payment has been confirmed..." |

---

## Error Handling & Partial Success

### Partial Success Logic

```
Email Attempt:     SMTP → success ✓ or failure ✗
SMS Attempt:       Twilio → success ✓ or failure ✗

Result Matrix:
┌─────────┬─────────┬──────────────┐
│ Email   │ SMS     │ Final Status │
├─────────┼─────────┼──────────────┤
│ ✓       │ ✓       │ SENT         │
│ ✓       │ ✗       │ SENT*        │ *with failureReason="SMS: [error]"
│ ✗       │ ✓       │ SENT*        │ *with failureReason="EMAIL: [error]"
│ ✗       │ ✗       │ FAILED       │ *with failureReason="EMAIL: [error] | SMS: [error]"
│ N/A     │ ✓       │ SENT         │ *SMS only, no email available
│ ✓       │ N/A     │ SENT         │ *EMAIL only, no phone available
│ N/A     │ N/A     │ FAILED       │ *No contact info available
└─────────┴─────────┴──────────────┘
```

### Recipient Resolution Fallbacks

**For PATIENT:**
1. Try: `GET /patients/internal/contact?authUserId={id}`
2. If fails, try: `GET /patients/internal/contact-by-profile?patientProfileId={id}`
3. If still missing email/phone, try: `GET /auth/api/users/{id}`
4. Prefer patient profile contact info, fallback to auth user info

**For DOCTOR:**
1. Try: `GET /api/v1/doctors/{id}` (Basic Auth: doctor/doctor123)
2. Extract: firstName, lastName, email, phone
3. If fails, notification marked FAILED with resolution error

---

## Terminal Output Examples

### Successful Appointment Acceptance

```
[appointment-service] [ACCEPT-APPOINTMENT] Starting appointment acceptance | AppointmentId: 123 | DoctorId: 1
[appointment-service] [ACCEPT-APPOINTMENT] Found appointment | Status: PENDING | PatientId: 1 | DoctorId: 1
[appointment-service] [ACCEPT-APPOINTMENT] Updating appointment to CONFIRMED | FinalFee: 15.00 | ExtraFee: 0.00
[appointment-service] [ACCEPT-APPOINTMENT] Appointment saved successfully, now publishing notifications
[appointment-service] [APPOINTMENT] Publishing confirmation notifications for AppointmentId: 123 | PatientId: 1 | DoctorId: 1
[appointment-service] [APPOINTMENT-NOTIFY] Preparing to publish notification | EventType: APPOINTMENT_CONFIRMED | TargetRole: PATIENT | TargetUserId: 1
[appointment-service] [APPOINTMENT-NOTIFY] Successfully dispatched notification to notification-service | AppointmentId: 123

[notification-service] [PROCESS] === START === eventType=APPOINTMENT_CONFIRMED, targetRole=PATIENT, targetUserId=1, appointmentId=123, paymentId=null
[notification-service] [RECIPIENT] Starting resolution for role=PATIENT, userId=1
[notification-service] [RECIPIENT-PATIENT] Attempting to resolve patient with ID: 1
[notification-service] [RECIPIENT-PATIENT] Successfully resolved by authUserId
[notification-service] [RECIPIENT-PATIENT] Resolved | Name: John Doe | AuthUserId: 1 | ContactSource: PATIENT_PROFILE_EMERGENCY | Phone: ****1234 | Email: j***@example.com
[notification-service] [CHANNEL] Resolving channel | HasEmail: true | HasPhone: true
[notification-service] [CHANNEL] Resolved to BOTH (Email + SMS) - both contact methods available
[notification-service] [DELIVERY] Starting delivery process | Channel: BOTH | Recipient: John Doe | Email: j***@example.com | Phone: ****1234
[notification-service] [DELIVERY] Attempting EMAIL delivery to j***@example.com
[notification-service] [EMAIL] Attempting to send email to j***@example.com (recipient: john@example.com)
[notification-service] [EMAIL] Successfully sent email to j***@example.com | Subject: 'Appointment Confirmed: You're All Set'
[notification-service] [DELIVERY] EMAIL delivery SUCCESS
[notification-service] [DELIVERY] Attempting SMS delivery to ****1234
[notification-service] [SMS] Attempting to send SMS to ****1234 (recipient: +94771234567)
[notification-service] [SMS] Successfully sent SMS to ****1234 | MessageSID: SM1234567890 | Status: queued
[notification-service] [DELIVERY] SMS delivery SUCCESS
[notification-service] [DELIVERY] Delivery attempt complete | EmailSent: true | SMSSent: true | Failures: 0
[notification-service] [PROCESS] === SUCCESS === NotificationId: 1, eventType=APPOINTMENT_CONFIRMED, targetRole=PATIENT, targetUserId=1, status=SENT, channel=BOTH, emailSent=true, smsSent=true, failures=0
```

### Failed Email (SMTP) with SMS Success

```
[notification-service] [EMAIL] Attempting to send email to j***@example.com (recipient: john@example.com)
[notification-service] [EMAIL] FAILED to send email to j***@example.com | Exception: MessagingException | Message: 535 5.7.8 Username and Password not accepted
[notification-service] [DELIVERY] EMAIL delivery FAILED | Exception: MessagingException | Details: 535 5.7.8 Username and Password not accepted
[notification-service] [SMS] Attempting to send SMS to ****1234 (recipient: +94771234567)
[notification-service] [SMS] Successfully sent SMS to ****1234 | MessageSID: SM1234567890 | Status: queued
[notification-service] [DELIVERY] SMS delivery SUCCESS
[notification-service] [PROCESS] === SUCCESS === NotificationId: 1, eventType=APPOINTMENT_CONFIRMED, status=SENT, channel=BOTH, emailSent=false, smsSent=true, failures=1
```

### Failed Recipient Resolution

```
[notification-service] [RECIPIENT] Starting resolution for role=PATIENT, userId=999
[notification-service] [RECIPIENT-PATIENT] Attempting to resolve patient with ID: 999
[notification-service] [RECIPIENT-PATIENT] Lookup by authUserId 999 failed: HttpClientErrorException - 404 Not Found
[notification-service] [RECIPIENT-PATIENT] Lookup by profileId 999 failed: HttpClientErrorException - 404 Not Found
[notification-service] [PROCESS] Recipient resolution FAILED | eventType=APPOINTMENT_CONFIRMED, targetRole=PATIENT, targetUserId=999 | Exception: HttpClientErrorException | Reason: 404 Not Found
[notification-service] [PROCESS] Saved notification with FAILED status | NotificationId: 1 | FailureReason: Recipient resolution failed: 404 Not Found
```

---

## Testing Checklist

### Pre-Flight Checks
- [ ] All Docker containers running: `docker ps`
- [ ] Notification service health: `http://localhost:8084/api/v1/notifications/health` returns 200
- [ ] MySQL notification database exists
- [ ] SMTP credentials verified (Gmail account active, app-specific password if 2FA enabled)
- [ ] Twilio account active with SMS credits
- [ ] Doctor service accessible: `http://localhost:8083/api/v1/doctors/1`
- [ ] Patient service accessible: `http://localhost:8085/patients/internal/contact?authUserId=1`

### Unit Tests
- [ ] Test email delivery (isolated, mock patient/doctor)
- [ ] Test SMS delivery (isolated, mock recipient)
- [ ] Test channel resolution (both email+phone → BOTH)
- [ ] Test recipient resolution (patient and doctor lookups)
- [ ] Test partial failure (email success, SMS failure → SENT)

### Integration Tests
- [ ] Appointment acceptance triggers notification publish
- [ ] Notification service receives appointment event
- [ ] Recipient data resolved successfully
- [ ] Channel determined correctly (BOTH if both contacts)
- [ ] Email sent to patient inbox
- [ ] SMS sent to patient phone
- [ ] Database record created with SENT status

### End-to-End Test
- [ ] Patient books appointment (creates PENDING)
- [ ] Doctor accepts appointment (triggers notifications)
- [ ] Patient receives email with appointment details
- [ ] Patient receives SMS with appointment details
- [ ] Doctor receives email with patient information
- [ ] Doctor receives SMS with patient information
- [ ] Database shows 2 notifications with SENT status (one for patient, one for doctor)
- [ ] Each notification shows BOTH channel

---

## Troubleshooting Quick Links

See `/memories/session/debugging-guide.md` for:
- Step-by-step debugging procedures
- Terminal commands for each phase
- Common issues and solutions
- Log filtering cheat sheet
- Database query examples

---

## Files Modified

1. `services/notification-service/src/main/java/com/smarthealthcare/notification_service/service/impl/NotificationServiceImpl.java`
   - Added 20+ log statements across 6 logging phases
   - Enhanced email delivery logging
   - Enhanced SMS delivery logging  
   - Enhanced recipient resolution logging
   - Enhanced channel resolution logging

2. `services/appointment-service/src/main/java/com/smarthealthcare/appointment_service/service/impl/AppointmentServiceImpl.java`
   - Added appointment acceptance logging
   - Added appointment confirmation publishing logging
   - Enhanced notification dispatch logging

3. `services/notification-service/src/main/resources/application-docker.yaml`
   - No code changes needed (configuration verified)
   - SMTP: smtp.gmail.com:587
   - Twilio: Active account required

---

## Next Steps

1. **Verify Implementation:** Run through debugging checklist in debugging-guide.md
2. **Test Flow:** Follow end-to-end testing procedures
3. **Monitor Logs:** Use log filtering commands to watch for errors
4. **Validate:** Check emails, SMS, and database for successful delivery
5. **Troubleshoot:** If issues, follow common issues & solutions section

---

**Last Updated:** May 1, 2026
**Status:** ✅ Implementation Complete
**Testing:** Ready for verification
