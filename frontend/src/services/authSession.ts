import type { AuthResponse } from './authApi';

const AUTH_TOKEN_KEY = 'authToken';
const AUTH_USER_KEY = 'user';
const AUTH_TOKEN_EXPIRES_AT_KEY = 'authTokenExpiresAt';
const DOCTOR_PROFILE_ID_KEY = 'doctorProfileId';
export const AUTH_CHANGED_EVENT = 'auth-state-changed';
export const PROFILE_UPDATED_EVENT = 'patient-profile-updated';

function getAuthStorage() {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function notifyAuthChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
  }
}

export function notifyProfileUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(PROFILE_UPDATED_EVENT));
  }
}

export function setAuthSession(response: AuthResponse) {
  const authStorage = getAuthStorage();
  if (!authStorage) {
    return;
  }

  const expiresAt = Date.now() + (response.expiresInMs || 0);
  window.localStorage.removeItem(DOCTOR_PROFILE_ID_KEY);
  authStorage.setItem(AUTH_TOKEN_KEY, response.accessToken);
  authStorage.setItem(AUTH_USER_KEY, JSON.stringify(response.user));
  authStorage.setItem(AUTH_TOKEN_EXPIRES_AT_KEY, String(expiresAt));
  notifyAuthChanged();
}

export function updateAuthUser(patch: Record<string, unknown>) {
  const current = getAuthUser();
  if (!current) {
    return;
  }

  const next = { ...current, ...patch };
  authStorage.setItem(AUTH_USER_KEY, JSON.stringify(next));
  notifyAuthChanged();
}

export function clearAuthSession() {
  const authStorage = getAuthStorage();
  if (!authStorage) {
    return;
  }

  authStorage.removeItem(AUTH_TOKEN_KEY);
  authStorage.removeItem(AUTH_USER_KEY);
  authStorage.removeItem(AUTH_TOKEN_EXPIRES_AT_KEY);
  window.localStorage.removeItem(DOCTOR_PROFILE_ID_KEY);
  notifyAuthChanged();
}

function isTokenExpired(token: string) {
  const authStorage = getAuthStorage();
  if (!authStorage) {
    return false;
  }

  const expiresAtRaw = authStorage.getItem(AUTH_TOKEN_EXPIRES_AT_KEY);
  const expiresAt = expiresAtRaw ? Number(expiresAtRaw) : NaN;

  if (Number.isFinite(expiresAt) && expiresAt > 0) {
    return Date.now() >= expiresAt;
  }

  // Fallback: parse JWT exp claim if persisted expiry is missing.
  try {
    const payloadBase64 = token.split('.')[1];
    if (!payloadBase64) return false;
    const payloadJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(payloadJson) as { exp?: number };
    if (!payload.exp) return false;
    return Date.now() >= payload.exp * 1000;
  } catch {
    return false;
  }
}

export function getAuthToken() {
  const authStorage = getAuthStorage();
  if (!authStorage) {
    return null;
  }

  const token = authStorage.getItem(AUTH_TOKEN_KEY);
  if (!token) {
    return null;
  }

  if (isTokenExpired(token)) {
    clearAuthSession();
    return null;
  }

  return token;
}

export function getAuthUser() {
  const authStorage = getAuthStorage();
  if (!authStorage) {
    return null;
  }

  const rawUser = authStorage.getItem(AUTH_USER_KEY);
  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser);
  } catch {
    return null;
  }
}

export function getAuthUserRole() {
  const user = getAuthUser();
  const role = user?.role;

  if (role === 'DOCTOR' || role === 'ADMIN' || role === 'PATIENT') {
    return role;
  }

  return null;
}

export function isDoctorUser() {
  return getAuthUserRole() === 'DOCTOR';
}

export function isAdminUser() {
  return getAuthUserRole() === 'ADMIN';
}

export function isUserAuthenticated() {
  return Boolean(getAuthToken() && getAuthUser());
}
