# Test Payment Doctor Notification - Implementation Complete

## Status
✅ **Implementation Complete** - Enhanced logging added to payment service to debug doctor notification delivery.

## Changes Made

### 1. **docker-compose.yml** - Configuration (Already Present ✅)
Line 343: `NOTIFICATION_SERVICE_BASE_URL: http://notification-service:8084` 
- ✅ Already configured for payment-service
- No changes needed

### 2. **PaymentServiceImpl.java** - Enhanced Logging Added

#### Change 1: `handleCheckoutCompleted()` method (lines 348-370)
Added detailed logging before/during/after notification publishing:
```java
log.info("[PAYMENT-PROCESS] Payment checkout completed | SessionId: {} | PaymentId: {} ...");
log.info("[PAYMENT-NOTIFICATIONS] Publishing notifications for paid payment | PaymentId: {} | PatientId: {} | DoctorId: {}");
log.info("[PAYMENT-PROCESS] Payment checkout processing completed | PaymentId: {}");
```

#### Change 2: `publishNotification()` method (lines 577-616)
Enhanced to track patient vs doctor notifications separately:
```java
// Before sending
log.info("[PAYMENT-NOTIFY-DOCTOR] Publishing doctor payment notification | PaymentId: {} | DoctorId: {} ...");
log.info("[PAYMENT-NOTIFY-PATIENT] Publishing patient payment notification | PaymentId: {} | PatientId: {} ...");

// After success
log.info("[PAYMENT-NOTIFY-DOCTOR] Successfully published doctor payment notification | PaymentId: {}");

// On error
log.error("[PAYMENT-NOTIFY-DOCTOR] FAILED to publish doctor payment notification | PaymentId: {} | DoctorId: {} | Exception: {}");
```

---

## How to Test

### Step 1: Monitor Logs in Real-Time (3 terminals)

**Terminal 1** - Payment Service Logs:
```powershell
docker logs -f payment-service | Select-String "\[PAYMENT"
```

**Terminal 2** - Notification Service Logs:
```powershell
docker logs -f notification-service | Select-String "\[PROCESS\].*DOCTOR.*PAYMENT|DOCTOR.*PAYMENT_CONFIRMED"
```

**Terminal 3** - Notification Service Detailed:
```powershell
docker logs -f notification-service | Select-String "\[RECIPIENT\]|\[CHANNEL\]|\[EMAIL\]|\[SMS\]"
```

### Step 2: Complete Payment Flow via UI

1. Open Frontend: http://localhost:5173
2. **Register & Login** as patient (or login with existing account)
3. **Book Appointment** with a doctor
   - Fill appointment details
   - Submit booking
4. **Doctor Accepts** (login as doctor if needed, or use doctor account to accept)
5. **Patient Completes Payment**
   - Go to payment page
   - Complete Stripe checkout (use test card: 4242 4242 4242 4242, future date, any CVC)
   - Verify payment success page shows

### Step 3: Monitor Log Output

Watch the three terminals for these patterns:

**Expected in Terminal 1 (Payment Service)**:
```
[PAYMENT-PROCESS] Payment checkout completed | SessionId: ...
[PAYMENT-NOTIFICATIONS] Publishing notifications for paid payment | PaymentId: X | PatientId: Y | DoctorId: Z
[PAYMENT-NOTIFY-PATIENT] Publishing patient payment notification | PaymentId: X | PatientId: Y
[PAYMENT-NOTIFY-PATIENT] Successfully published patient payment notification | PaymentId: X
[PAYMENT-NOTIFY-DOCTOR] Publishing doctor payment notification | PaymentId: X | DoctorId: Z
[PAYMENT-NOTIFY-DOCTOR] Successfully published doctor payment notification | PaymentId: X
[PAYMENT-PROCESS] Payment checkout processing completed | PaymentId: X
```

**Expected in Terminal 2 (Notification Service - Doctor)**:
```
[PROCESS] === START === eventType=PAYMENT_CONFIRMED_DOCTOR, targetRole=DOCTOR, targetUserId=Z
[RECIPIENT] Resolved doctor ... | Phone: ... | Email: ...
[CHANNEL] Resolved to BOTH (Email + SMS)
[DELIVERY] Attempting EMAIL delivery
[EMAIL] Successfully sent email | Subject: 'Payment confirmed'
[DELIVERY] Attempting SMS delivery
[SMS] Successfully sent SMS | MessageSID: SM... | Status: queued
[PROCESS] === SUCCESS === status=SENT, channel=BOTH, emailSent=true, smsSent=true
```

**Expected in Terminal 3 (Notification Service - Detailed)**:
```
[RECIPIENT] Resolved doctor information
[CHANNEL] Resolved to BOTH
[EMAIL] Successfully sent
[SMS] Successfully sent
```

### Step 4: Verify Email & SMS Received

1. **Doctor's Email**: Check inbox for payment confirmation email
2. **Doctor's Phone**: Check for SMS from +94767955166 (or configured number)

### Step 5: Query Database for Records

```powershell
# Check notification records for payment events
docker exec mysql-notification mysql -u notification_user -pnotification_pass notification_service_db -e "SELECT id, event_type, target_role, status, channel FROM notification WHERE event_type LIKE 'PAYMENT%' ORDER BY created_at DESC LIMIT 20;"
```

**Expected Output**:
```
+----+---------------------+-------------+--------+---------+
| id | event_type          | target_role | status | channel |
+----+---------------------+-------------+--------+---------+
| N  | PAYMENT_CONFIRMED_DOCTOR | DOCTOR    | SENT   | BOTH    |
| N-1| PAYMENT_CONFIRMED   | PATIENT     | SENT   | BOTH    |
+----+---------------------+-------------+--------+---------+
```

---

## Troubleshooting

### Issue 1: "No doctor notifications in logs"

**Diagnosis**:
```powershell
docker logs payment-service | grep "\[PAYMENT-NOTIFY-DOCTOR\]"
```

**If empty**: Doctor notification not being published
- Check payment service recompiled correctly: `docker logs payment-service | grep "PaymentServiceApplication"`
- Verify PaymentServiceImpl.java has the new logging code
- Rebuild: `docker compose down && docker compose up --build -d`

### Issue 2: "Doctor notification published but not reaching notification-service"

Check if call succeeded:
```powershell
docker logs payment-service | Select-String "\[PAYMENT-NOTIFY-DOCTOR\].*Successfully|FAILED"
```

If FAILED: Check exception details in logs:
```powershell
docker logs payment-service | Select-String "\[PAYMENT-NOTIFY-DOCTOR\].*FAILED" -A 2
```

### Issue 3: "Notification received by notification-service but not delivered"

Check notification service logs:
```powershell
docker logs notification-service | Select-String "DOCTOR.*PAYMENT" -A 3
```

Look for:
- `[RECIPIENT]` - Did doctor lookup succeed?
- `[CHANNEL]` - What channel was selected?
- `[EMAIL]` or `[SMS]` - Did delivery fail?

If email failed: Check SMTP configuration
If SMS failed: Check Twilio credits and configuration

### Issue 4: "Notification marked SENT but doctor didn't receive"

Check database for failure details:
```powershell
docker exec mysql-notification mysql -u notification_user -pnotification_pass notification_service_db -e "SELECT id, event_type, status, failure_reason FROM notification WHERE event_type LIKE 'PAYMENT%' LIMIT 10;"
```

If `failure_reason` column has value, that's the error. Common reasons:
- **"Email delivery failed: 535 Authentication failed"** → Gmail credentials need update or 2FA enabled
- **"Could not connect to Twilio"** → Twilio credentials invalid or no credits
- **"Doctor phone format invalid"** → Phone number stored in wrong format in doctor-service

---

## Success Criteria ✅

After completing the test flow:
- [ ] Payment service logs show `[PAYMENT-NOTIFY-DOCTOR]` entries (patient + doctor)
- [ ] Notification service processes `PAYMENT_CONFIRMED_DOCTOR` event
- [ ] Doctor email inbox receives payment confirmation
- [ ] Doctor SMS receives payment notification
- [ ] Database shows 2 PAYMENT_CONFIRMED entries (PATIENT + DOCTOR, both SENT)
- [ ] Both notifications have `status=SENT` and `channel=BOTH`
- [ ] No `[FAILED]` or `ERROR` messages for doctor notifications

---

## Database Verification Queries

### Check all payment notifications:
```sql
SELECT id, event_type, target_role, status, channel, created_at 
FROM notification 
WHERE event_type LIKE 'PAYMENT%' 
ORDER BY created_at DESC 
LIMIT 20;
```

### Check specific payment:
```sql
SELECT id, event_type, target_role, status, failure_reason, sent_at 
FROM notification 
WHERE event_type LIKE 'PAYMENT%' AND appointment_id = 123
ORDER BY created_at DESC;
```

### Check doctor notifications only:
```sql
SELECT id, event_type, target_role, status, channel 
FROM notification 
WHERE target_role = 'DOCTOR' AND event_type LIKE 'PAYMENT%' 
ORDER BY created_at DESC;
```

---

## Logs Summary

All payment notifications now have clear logging prefixes:

| Log Prefix | Meaning | Location |
|-----------|---------|----------|
| `[PAYMENT-PROCESS]` | Payment processing flow | handleCheckoutCompleted() |
| `[PAYMENT-NOTIFICATIONS]` | Notification publishing starts | handleCheckoutCompleted() |
| `[PAYMENT-NOTIFY-PATIENT]` | Patient notification event | publishNotification() |
| `[PAYMENT-NOTIFY-DOCTOR]` | Doctor notification event | publishNotification() |

---

## Next Steps

1. ✅ Run full payment flow test (Steps 1-5 above)
2. ✅ Verify doctor receives notifications (email + SMS)
3. ✅ Confirm database has 2 records (patient + doctor)
4. ✅ Share logs and screenshots for verification

---

**Implementation Date**: May 1, 2026  
**Status**: READY FOR TESTING ✅

