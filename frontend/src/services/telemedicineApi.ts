import { getAuthToken, getAuthUser, getAuthUserRole } from './authSession';

const API_BASE = import.meta.env.VITE_TELEMEDICINE_API_BASE || '/api/telemedicine';
const DOCTOR_PROFILE_ID_KEY = 'doctorProfileId';

export interface CreateTelemedicineSessionPayload {
  appointmentId: number;
  paymentId?: number;
  patientId?: number;
  doctorId?: number;
  appointmentDate?: string;
  startTime?: string;
  endTime?: string;
  appointmentType?: string;
  amount?: number | string;
  currency?: string;
  reasonForVisit?: string;
}

export interface CompleteTelemedicineSessionPayload {
  consultationSummary?: string;
}

export interface TelemedicineSessionResponse {
  sessionId: string;
  paymentId?: number | null;
  appointmentId: number;
  patientId?: number | null;
  doctorId?: number | null;
  appointmentDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  appointmentType?: string | null;
  amount?: number | string | null;
  currency?: string | null;
  reasonForVisit?: string | null;
  roomId: string;
  meetingUrl: string | null;
  sessionUrl: string | null;
  provider: 'JITSI' | string;
  status: 'CREATED' | 'STARTED' | 'COMPLETED' | string;
  createdAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
  consultationSummary?: string | null;
  joinAllowed?: boolean;
}

function buildHeaders(includeJson = true) {
  const token = getAuthToken();
  const user = getAuthUser();
  const role = getAuthUserRole();
  const storedDoctorProfileId = localStorage.getItem(DOCTOR_PROFILE_ID_KEY);
  const doctorId =
    role === 'DOCTOR' ? storedDoctorProfileId || (user?.id ? String(user.id) : null) : null;

  return {
    ...(includeJson ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(role === 'PATIENT' && user?.id ? { 'X-Patient-Id': String(user.id) } : {}),
    ...(role === 'DOCTOR' && doctorId ? { 'X-Doctor-Id': doctorId } : {}),
  };
}

async function request<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...buildHeaders(),
      ...(init?.headers || {}),
    },
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload?.message ||
      payload?.validationErrors?.appointmentId ||
      payload?.validationErrors?.sessionId ||
      `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return payload as T;
}

export function createTelemedicineSession(payload: CreateTelemedicineSessionPayload) {
  return request<TelemedicineSessionResponse>('/session', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getTelemedicineSession(appointmentId: number) {
  return request<TelemedicineSessionResponse>(`/session/${appointmentId}`, {
    method: 'GET',
  });
}

export function getMyPatientTelemedicineSessions(patientId: number) {
  return request<TelemedicineSessionResponse[]>(`/sessions/patient/${encodeURIComponent(String(patientId))}`, {
    method: 'GET',
  });
}

export function getMyDoctorTelemedicineSessions(doctorId: number | string) {
  return request<TelemedicineSessionResponse[]>(`/sessions/doctor/${encodeURIComponent(String(doctorId))}`, {
    method: 'GET',
  });
}

export function getAdminTelemedicineSessions() {
  return request<TelemedicineSessionResponse[]>('/sessions/admin/summary', {
    method: 'GET',
  });
}

export function startTelemedicineSession(sessionId: number | string) {
  return request<TelemedicineSessionResponse>(`/session/${encodeURIComponent(String(sessionId))}/start`, {
    method: 'PUT',
  });
}

export function completeTelemedicineSession(
  sessionId: number | string,
  payload?: CompleteTelemedicineSessionPayload,
) {
  return request<TelemedicineSessionResponse>(`/session/${encodeURIComponent(String(sessionId))}/complete`, {
    method: 'PUT',
    body: JSON.stringify(payload ?? {}),
  });
}
