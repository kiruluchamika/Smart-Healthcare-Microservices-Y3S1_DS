export interface AuthUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string | null;
  role: 'PATIENT' | 'DOCTOR' | 'ADMIN';
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresInMs: number;
  user: AuthUser;
}

export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: 'PATIENT' | 'DOCTOR' | 'ADMIN';
}

const API_BASE = import.meta.env.VITE_AUTH_API_BASE || '/api/auth';

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message = payload?.message || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return payload as T;
}

export function register(payload: RegisterPayload) {
  return request<AuthResponse>('/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function login(email: string, password: string) {
  return request<AuthResponse>('/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}
