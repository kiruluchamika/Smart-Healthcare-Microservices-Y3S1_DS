import { useEffect, useMemo, useState } from 'react';
import { getAuthUser, getAuthUserRole } from '../services/authSession';
import { getDoctorByEmail } from '../services/doctor/doctorApi';
import type { NotificationRole } from '../types/notification';

type IdentityStatus = 'loading' | 'ready' | 'missing';

export interface NotificationIdentity {
  role: NotificationRole | null;
  targetUserId: number | null;
  displayName: string;
  status: IdentityStatus;
}

export function useNotificationIdentity() {
  const authUser = getAuthUser();
  const role = getAuthUserRole();
  const [doctorId, setDoctorId] = useState<number | null>(null);
  const [doctorName, setDoctorName] = useState('');
  const [status, setStatus] = useState<IdentityStatus>(role === 'DOCTOR' ? 'loading' : 'ready');

  useEffect(() => {
    let mounted = true;

    const loadDoctorIdentity = async () => {
      if (role !== 'DOCTOR') {
        setDoctorId(null);
        setDoctorName('');
        setStatus('ready');
        return;
      }

      const email = typeof authUser?.email === 'string' ? authUser.email.trim() : '';
      if (!email) {
        if (mounted) {
          setDoctorId(null);
          setDoctorName('Doctor');
          setStatus('missing');
        }
        return;
      }

      try {
        const doctor = await getDoctorByEmail(email);
        if (!mounted) {
          return;
        }

        setDoctorId(doctor.id);
        setDoctorName(`${doctor.firstName || ''} ${doctor.lastName || ''}`.trim() || doctor.email || 'Doctor');
        setStatus('ready');
      } catch {
        if (mounted) {
          setDoctorId(null);
          setDoctorName('Doctor');
          setStatus('missing');
        }
      }
    };

    if (role === 'DOCTOR') {
      setStatus('loading');
      void loadDoctorIdentity();
    } else {
      setDoctorId(null);
      setDoctorName('');
      setStatus(role ? 'ready' : 'missing');
    }

    return () => {
      mounted = false;
    };
  }, [authUser?.email, role]);

  return useMemo<NotificationIdentity>(() => {
    if (!role || !authUser?.id) {
      return {
        role: null,
        targetUserId: null,
        displayName: '',
        status: 'missing',
      };
    }

    if (role === 'PATIENT') {
      const displayName = `${authUser.firstName || ''} ${authUser.lastName || ''}`.trim() || authUser.email || 'Patient';
      return {
        role,
        targetUserId: authUser.id,
        displayName,
        status: 'ready',
      };
    }

    return {
      role,
      targetUserId: doctorId,
      displayName: doctorName || 'Doctor',
      status,
    };
  }, [authUser?.email, authUser?.firstName, authUser?.id, authUser?.lastName, doctorId, doctorName, role, status]);
}
