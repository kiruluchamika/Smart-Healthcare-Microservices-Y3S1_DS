import type { AuthResponse } from './authApi';

const AUTH_TOKEN_KEY = 'authToken';
const AUTH_USER_KEY = 'user';
export const AUTH_CHANGED_EVENT = 'auth-state-changed';

function notifyAuthChanged() {
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

export function setAuthSession(response: AuthResponse) {
  localStorage.setItem(AUTH_TOKEN_KEY, response.accessToken);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(response.user));
  notifyAuthChanged();
}

export function clearAuthSession() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  notifyAuthChanged();
}

export function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function getAuthUser() {
  const rawUser = localStorage.getItem(AUTH_USER_KEY);
  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser);
  } catch {
    return null;
  }
}

export function isUserAuthenticated() {
  return Boolean(getAuthToken() && getAuthUser());
}
