import { getAuthToken, getAuthUser, getAuthUserRole } from './authSession';
import { resolveDoctorProfileId } from './doctorIdentity';

const API_BASE = import.meta.env.VITE_TELEMEDICINE_API_BASE || '/api/telemedicine';

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

async function buildHeaders(includeJson = true) {
  const token = getAuthToken();
  const user = getAuthUser();
  const role = getAuthUserRole();
  const doctorId = role === 'DOCTOR' ? await resolveDoctorProfileId() : null;

  return {
    ...(includeJson ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(role === 'PATIENT' && user?.id ? { 'X-Patient-Id': String(user.id) } : {}),
    ...(role === 'DOCTOR' && doctorId ? { 'X-Doctor-Id': String(doctorId) } : {}),
  };
}

async function request<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...(await buildHeaders()),
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

export async function getMyDoctorTelemedicineSessions(doctorId?: number | string) {
  const resolvedDoctorId =
    doctorId == null || doctorId === ''
      ? await resolveDoctorProfileId()
      : Number(doctorId);

  if (!resolvedDoctorId) {
    throw new Error('Doctor profile not found for the current session');
  }

  return request<TelemedicineSessionResponse[]>(`/sessions/doctor/${encodeURIComponent(String(resolvedDoctorId))}`, {
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
