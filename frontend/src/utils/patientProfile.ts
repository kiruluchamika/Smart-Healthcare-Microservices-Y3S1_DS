import type { PatientProfile } from '../types/patient';

const NAME_PATTERN = /^[A-Za-z ]+$/;
const PHONE_PATTERN = /^\d{10}$/;

export function normalizePlainText(value?: string | null): string {
  return (value || '').trim().replace(/\s+/g, ' ');
}

export function isPatientNameValid(value?: string | null): boolean {
  const normalized = normalizePlainText(value);
  return normalized.length >= 2 && normalized.length <= 100 && NAME_PATTERN.test(normalized);
}

export function isPatientAddressValid(value?: string | null): boolean {
  const normalized = normalizePlainText(value);
  return normalized.length >= 5 && normalized.length <= 500;
}

export function normalizeContactNumber(value?: string | null): string {
  return (value || '').replace(/\D/g, '').slice(0, 10);
}

export function isPatientContactNumberValid(value?: string | null): boolean {
  return PHONE_PATTERN.test(normalizeContactNumber(value));
}

export function calculateAgeYears(dateOfBirth?: string | null): number | null {
  if (!dateOfBirth) {
    return null;
  }

  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }

  return age;
}

export function isDateOfBirthValid(dateOfBirth?: string | null): boolean {
  if (!dateOfBirth) {
    return false;
  }

  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) {
    return false;
  }

  const today = new Date();
  if (dob > today) {
    return false;
  }

  const age = calculateAgeYears(dateOfBirth);
  return age !== null && age >= 0 && age <= 120;
}

export function isPatientProfileComplete(profile?: Partial<PatientProfile> | null): boolean {
  if (!profile) {
    return false;
  }

  const hasValidGender = profile.gender === 'MALE' || profile.gender === 'FEMALE' || profile.gender === 'OTHER';

  return (
    isPatientNameValid(profile.firstName) &&
    isPatientNameValid(profile.lastName) &&
    isDateOfBirthValid(profile.dateOfBirth) &&
    hasValidGender &&
    isPatientAddressValid(profile.address) &&
    isPatientContactNumberValid(profile.emergencyContactPhone)
  );
}
