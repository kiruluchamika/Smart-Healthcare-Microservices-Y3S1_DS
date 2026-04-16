import { getDoctorByEmail } from './doctor/doctorApi';
import { getAuthUser, getAuthUserRole } from './authSession';

const DOCTOR_PROFILE_ID_KEY = 'doctorProfileId';

let pendingDoctorProfileLookup: Promise<number | null> | null = null;

export async function resolveDoctorProfileId(forceRefresh = false): Promise<number | null> {
  const role = getAuthUserRole();
  const authUser = getAuthUser();

  if (role !== 'DOCTOR' || !authUser?.email) {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(DOCTOR_PROFILE_ID_KEY);
    }
    return null;
  }

  const storedValue = typeof window !== 'undefined'
    ? window.localStorage.getItem(DOCTOR_PROFILE_ID_KEY)
    : null;
  const storedDoctorProfileId = storedValue ? Number(storedValue) : NaN;

  if (!forceRefresh && Number.isInteger(storedDoctorProfileId) && storedDoctorProfileId > 0) {
    return storedDoctorProfileId;
  }

  if (!pendingDoctorProfileLookup || forceRefresh) {
    pendingDoctorProfileLookup = getDoctorByEmail(authUser.email)
      .then((doctor) => {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(DOCTOR_PROFILE_ID_KEY, String(doctor.id));
        }
        return doctor.id;
      })
      .catch(() => {
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(DOCTOR_PROFILE_ID_KEY);
        }
        return null;
      })
      .finally(() => {
        pendingDoctorProfileLookup = null;
      });
  }

  return pendingDoctorProfileLookup;
}
