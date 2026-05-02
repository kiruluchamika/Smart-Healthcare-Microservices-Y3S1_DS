import { useEffect, useMemo, useState } from 'react';
import { getAuthUser, getAuthUserRole } from '../services/authSession';
import { getDoctorByEmail } from '../services/doctor/doctorApi';
import type { NotificationRole } from '../types/notification';

type IdentityStatus = 'loading' | 'ready' | 'missing' | 'error';

export interface NotificationIdentity {
  role: NotificationRole | null;
  targetUserId: number | null;
  displayName: string;
  status: IdentityStatus;
  errorMessage?: string;
  retry?: () => void;
}

export function useNotificationIdentity() {
  const authUser = getAuthUser();
  const role = getAuthUserRole();
  const [doctorId, setDoctorId] = useState<number | null>(null);
  const [doctorName, setDoctorName] = useState('');
  const [status, setStatus] = useState<IdentityStatus>(role === 'DOCTOR' ? 'loading' : 'ready');
  const [errorMessage, setErrorMessage] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let mounted = true;

    const loadDoctorIdentity = async () => {
      if (role !== 'DOCTOR') {
        console.log('[NOTIFICATION-IDENTITY] Non-doctor user, skipping doctor lookup');
        setDoctorId(null);
        setDoctorName('');
        setStatus('ready');
        setErrorMessage('');
        return;
      }

      // Validate email exists and is non-empty
      const email = typeof authUser?.email === 'string' ? authUser.email.trim() : '';
      console.log('[NOTIFICATION-IDENTITY] Doctor lookup | email:', email ? `${email.substring(0, 3)}***` : 'MISSING');

      if (!email) {
        const msg = 'Doctor email not found in auth session';
        console.warn('[NOTIFICATION-IDENTITY] Error:', msg);
        if (mounted) {
          setDoctorId(null);
          setDoctorName('Doctor');
          setStatus('error');
          setErrorMessage(msg);
        }
        return;
      }

      try {
        console.log('[NOTIFICATION-IDENTITY] Fetching doctor by email...');
        const doctor = await getDoctorByEmail(email);
        if (!mounted) {
          return;
        }

        if (!doctor?.id) {
          const msg = 'Doctor profile not found for this email';
          console.warn('[NOTIFICATION-IDENTITY] Error:', msg);
          setDoctorId(null);
          setDoctorName('Doctor');
          setStatus('error');
          setErrorMessage(msg);
          return;
        }

        console.log('[NOTIFICATION-IDENTITY] Doctor found | ID:', doctor.id, '| Name:', doctor.firstName, doctor.lastName);
        setDoctorId(doctor.id);
        setDoctorName(`${doctor.firstName || ''} ${doctor.lastName || ''}`.trim() || doctor.email || 'Doctor');
        setStatus('ready');
        setErrorMessage('');
      } catch (error) {
        if (!mounted) {
          return;
        }

        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error('[NOTIFICATION-IDENTITY] Doctor lookup failed | attempt:', retryCount + 1, '| error:', errorMsg);

        // Retry once on transient errors
        if (retryCount < 1) {
          console.log('[NOTIFICATION-IDENTITY] Retrying doctor lookup...');
          setRetryCount(retryCount + 1);
          // Retry after delay
          setTimeout(() => {
            if (mounted) {
              void loadDoctorIdentity();
            }
          }, 1500);
          return;
        }

        setDoctorId(null);
        setDoctorName('Doctor');
        setStatus('error');
        setErrorMessage(`Failed to load doctor profile: ${errorMsg}`);
      }
    };

    if (role === 'DOCTOR') {
      setStatus('loading');
      setRetryCount(0);
      void loadDoctorIdentity();
    } else {
      setDoctorId(null);
      setDoctorName('');
      setStatus(role ? 'ready' : 'missing');
      setErrorMessage('');
    }

    return () => {
      mounted = false;
    };
  }, [authUser?.email, role, retryCount]);

  const handleRetry = () => {
    console.log('[NOTIFICATION-IDENTITY] Retry triggered by user');
    setRetryCount(0);
    setStatus('loading');
    setErrorMessage('');
  };

  return useMemo<NotificationIdentity>(() => {
    if (!role || !authUser?.id) {
      return {
        role: null,
        targetUserId: null,
        displayName: '',
        status: 'missing',
        retry: handleRetry,
      };
    }

    if (role === 'PATIENT') {
      const displayName = `${authUser.firstName || ''} ${authUser.lastName || ''}`.trim() || authUser.email || 'Patient';
      return {
        role,
        targetUserId: authUser.id,
        displayName,
        status: 'ready',
        retry: handleRetry,
      };
    }

    return {
      role,
      targetUserId: doctorId,
      displayName: doctorName || 'Doctor',
      status,
      errorMessage,
      retry: handleRetry,
    };
  }, [authUser?.email, authUser?.firstName, authUser?.id, authUser?.lastName, doctorId, doctorName, errorMessage, role, status]);
}
