#!/usr/bin/env powershell
<#
.SYNOPSIS
    Smart Healthcare Notification Service - Verification & Testing Script
.DESCRIPTION
    Comprehensive script to verify notification service implementation and run end-to-end tests
.AUTHOR
    Smart Healthcare Development Team
.VERSION
    1.0
#>

param(
    [ValidateSet('verify', 'test-email', 'test-sms', 'test-all', 'monitor', 'diagnose')]
    [string]$Mode = 'verify',
    
    [int]$PatientId = 1,
    [int]$DoctorId = 1
)

# Colors
$colors = @{
    Success = 'Green'
    Error = 'Red'
    Warning = 'Yellow'
    Info = 'Cyan'
}

function Write-Status {
    param([string]$Message, [string]$Status)
    
    $color = switch ($Status) {
        'OK' { 'Green' }
        'ERROR' { 'Red' }
        'WARNING' { 'Yellow' }
        'INFO' { 'Cyan' }
        default { 'White' }
    }
    
    Write-Host "[$Status] $Message" -ForegroundColor $color
}

function Test-Service {
    param([string]$Url, [string]$Name)
    
    try {
        $response = Invoke-WebRequest -Uri $Url -Method GET -ErrorAction SilentlyContinue -TimeoutSec 5
        Write-Status "$Name responding at $Url" 'OK'
        return $true
    } catch {
        Write-Status "$Name NOT responding at $Url - $($_.Exception.Message)" 'ERROR'
        return $false
    }
}

function Test-Docker {
    param([string]$ContainerName)
    
    try {
        $status = docker ps --filter "name=$ContainerName" --format "{{.Status}}"
        if ($status) {
            Write-Status "Docker container '$ContainerName' is running: $status" 'OK'
            return $true
        } else {
            Write-Status "Docker container '$ContainerName' is NOT running" 'ERROR'
            return $false
        }
    } catch {
        Write-Status "Cannot check Docker: $($_.Exception.Message)" 'ERROR'
        return $false
    }
}

function Show-Logs {
    param(
        [string]$Container,
        [int]$Lines = 30,
        [string]$Pattern = $null
    )
    
    Write-Host "`n=== Logs for $Container ===" -ForegroundColor Cyan
    
    try {
        $logs = docker logs $Container --tail $Lines 2>&1
        
        if ($Pattern) {
            $logs = $logs | Select-String $Pattern
        }
        
        $logs | ForEach-Object { Write-Host $_ }
    } catch {
        Write-Status "Failed to retrieve logs: $($_.Exception.Message)" 'ERROR'
    }
}

function Test-Notification {
    param(
        [string]$EventType,
        [string]$TargetRole,
        [long]$TargetUserId,
        [long]$AppointmentId,
        [string]$Title = $null,
        [string]$Message = $null
    )
    
    $payload = @{
        eventType = $EventType
        targetRole = $TargetRole
        targetUserId = $TargetUserId
        appointmentId = $AppointmentId
        paymentId = $null
        title = $Title
        message = $Message
        scheduledFor = $(Get-Date -Format "yyyy-MM-ddTHH:mm:ss")
    } | ConvertTo-Json
    
    Write-Status "Sending notification: $EventType to $TargetRole/$TargetUserId" 'INFO'
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8084/api/v1/notifications/events" `
            -Method POST `
            -ContentType "application/json" `
            -Body $payload `
            -ErrorAction SilentlyContinue `
            -TimeoutSec 10
        
        if ($response.StatusCode -eq 200) {
            $result = $response.Content | ConvertFrom-Json
            Write-Status "Notification accepted (ID: $($result.id))" 'OK'
            Write-Status "Status: $($result.status) | Channel: $($result.channel)" 'INFO'
            
            if ($result.failureReason) {
                Write-Status "Failure Reason: $($result.failureReason)" 'WARNING'
            }
            
            return $result
        } else {
            Write-Status "Unexpected status code: $($response.StatusCode)" 'ERROR'
            return $null
        }
    } catch {
        Write-Status "Failed to send notification: $($_.Exception.Message)" 'ERROR'
        return $null
    }
}

function Verify-Setup {
    Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Yellow
    Write-Host "║  SMART HEALTHCARE - NOTIFICATION SERVICE VERIFICATION  ║" -ForegroundColor Yellow
    Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Yellow
    
    Write-Host "Phase 1: Docker Containers" -ForegroundColor Cyan
    Write-Host "─" * 60
    
    $containers = @(
        'notification-service',
        'appointment-service',
        'doctor-service',
        'patient-service',
        'auth-service',
        'mysql-notification'
    )
    
    $allRunning = $true
    foreach ($container in $containers) {
        if (-not (Test-Docker $container)) {
            $allRunning = $false
        }
    }
    
    if (-not $allRunning) {
        Write-Status "Some containers are not running. Start with: docker compose -f docker-compose.yml up -d" 'WARNING'
        Write-Host ""
        return
    }
    
    Write-Host "`nPhase 2: Service Endpoints" -ForegroundColor Cyan
    Write-Host "─" * 60
    
    $endpoints = @(
        @{ Url = 'http://localhost:8084/api/v1/notifications/health'; Name = 'Notification Service' },
        @{ Url = 'http://localhost:8081/api/v1/appointments'; Name = 'Appointment Service' },
        @{ Url = 'http://localhost:8083/api/v1/doctors'; Name = 'Doctor Service' },
        @{ Url = 'http://localhost:8085/patients'; Name = 'Patient Service' },
        @{ Url = 'http://localhost:8080/auth'; Name = 'Auth Service' }
    )
    
    foreach ($endpoint in $endpoints) {
        Test-Service $endpoint.Url $endpoint.Name
    }
    
    Write-Host "`nPhase 3: Configuration" -ForegroundColor Cyan
    Write-Host "─" * 60
    
    Write-Status "SMTP Server: smtp.gmail.com:587" 'INFO'
    Write-Status "SMTP Username: gamindukalmadu8@gmail.com" 'INFO'
    Write-Status "Twilio Account SID: AC1870d6fd6e1e2c9e28c955cdbd749651" 'INFO'
    Write-Status "Twilio From Number: +94767955166" 'INFO'
    
    Write-Host "`nPhase 4: Database" -ForegroundColor Cyan
    Write-Host "─" * 60
    
    try {
        $count = docker exec mysql-notification mysql -u notification_user -pnotification_pass notification_service_db -se "SELECT COUNT(*) FROM notification;" 2>&1
        Write-Status "Notification table exists with $count records" 'OK'
    } catch {
        Write-Status "Cannot query notification table: $($_.Exception.Message)" 'ERROR'
    }
    
    Write-Host "`n✓ Verification complete!`n" -ForegroundColor Green
}

function Test-EmailDelivery {
    Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Yellow
    Write-Host "║  EMAIL DELIVERY TEST                                   ║" -ForegroundColor Yellow
    Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Yellow
    
    Write-Status "Sending test email notification..." 'INFO'
    
    $result = Test-Notification -EventType "TEST_EMAIL" -TargetRole "PATIENT" -TargetUserId 1 -AppointmentId 0 `
        -Title "Test Email" -Message "This is a test email to verify SMTP is working"
    
    if ($result) {
        Write-Host "`nCheck logs for [EMAIL] messages:" -ForegroundColor Cyan
        Show-Logs "notification-service" 20 "\[EMAIL\]"
        
        Write-Host "`n⏳ Check your email inbox (may take 10-30 seconds)..." -ForegroundColor Yellow
    }
}

function Test-SMSDelivery {
    Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Yellow
    Write-Host "║  SMS DELIVERY TEST                                     ║" -ForegroundColor Yellow
    Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Yellow
    
    Write-Status "Sending test SMS notification..." 'INFO'
    
    $result = Test-Notification -EventType "TEST_SMS" -TargetRole "PATIENT" -TargetUserId 1 -AppointmentId 0 `
        -Title "Test SMS" -Message "This is a test SMS to verify Twilio integration"
    
    if ($result) {
        Write-Host "`nCheck logs for [SMS] messages:" -ForegroundColor Cyan
        Show-Logs "notification-service" 20 "\[SMS\]"
        
        Write-Host "`n⏳ Check your phone for SMS (may take 10-30 seconds)..." -ForegroundColor Yellow
    }
}

function Test-EndToEnd {
    Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Yellow
    Write-Host "║  END-TO-END TEST                                       ║" -ForegroundColor Yellow
    Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Yellow
    
    Write-Host "Instructions for manual testing:" -ForegroundColor Cyan
    Write-Host "1. Open your frontend application" -ForegroundColor White
    Write-Host "2. Patient books appointment with doctor" -ForegroundColor White
    Write-Host "3. Doctor accepts the appointment" -ForegroundColor White
    Write-Host "4. Watch the logs below for notification flow" -ForegroundColor White
    Write-Host "`nMonitoring logs... (Press Ctrl+C to stop)`n" -ForegroundColor Yellow
    
    Write-Host "Appointment Service Logs:" -ForegroundColor Cyan
    Show-Logs "appointment-service" 20 "\[ACCEPT-APPOINTMENT\]|\[APPOINTMENT-NOTIFY\]"
    
    Write-Host "`nNotification Service Logs:" -ForegroundColor Cyan
    Show-Logs "notification-service" 30 "\[PROCESS\]|\[DELIVERY\]|\[EMAIL\]|\[SMS\]"
}

function Monitor-Services {
    Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Yellow
    Write-Host "║  REAL-TIME MONITORING                                  ║" -ForegroundColor Yellow
    Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Yellow
    
    Write-Host "Monitoring notification service logs (Ctrl+C to stop)..." -ForegroundColor Yellow
    Write-Host ""
    
    docker logs -f notification-service | ForEach-Object {
        if ($_ -match '\[PROCESS\]|\[EMAIL\]|\[SMS\]|\[DELIVERY\]|\[RECIPIENT\]') {
            Write-Host $_ -ForegroundColor Cyan
        } elseif ($_ -match 'ERROR|FAILED') {
            Write-Host $_ -ForegroundColor Red
        }
    }
}

function Diagnose {
    Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Yellow
    Write-Host "║  DIAGNOSTIC REPORT                                     ║" -ForegroundColor Yellow
    Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Yellow
    
    Write-Host "1. Recent notifications in database:" -ForegroundColor Cyan
    try {
        docker exec mysql-notification mysql -u notification_user -pnotification_pass notification_service_db -e `
            "SELECT id, event_type, target_role, status, channel, failure_reason FROM notification ORDER BY created_at DESC LIMIT 5;"
    } catch {
        Write-Status "Failed to query database" 'ERROR'
    }
    
    Write-Host "`n2. Notification service errors:" -ForegroundColor Cyan
    Show-Logs "notification-service" 50 "ERROR|FAILED"
    
    Write-Host "`n3. Recipient resolution issues:" -ForegroundColor Cyan
    Show-Logs "notification-service" 30 "\[RECIPIENT.*FAILED\]"
    
    Write-Host "`n4. SMTP errors:" -ForegroundColor Cyan
    Show-Logs "notification-service" 30 "\[EMAIL\].*FAILED"
    
    Write-Host "`n5. Twilio errors:" -ForegroundColor Cyan
    Show-Logs "notification-service" 30 "\[SMS\].*FAILED"
}

# Main execution
switch ($Mode) {
    'verify' { Verify-Setup }
    'test-email' { Verify-Setup; Test-EmailDelivery }
    'test-sms' { Verify-Setup; Test-SMSDelivery }
    'test-all' { 
        Verify-Setup
        Test-EmailDelivery
        Start-Sleep -Seconds 5
        Test-SMSDelivery
    }
    'monitor' { Monitor-Services }
    'diagnose' { Diagnose }
    default { Verify-Setup }
}

Write-Host ""
