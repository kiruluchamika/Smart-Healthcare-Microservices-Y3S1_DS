const API_BASE = import.meta.env.VITE_TELEMEDICINE_API_BASE || '/api/telemedicine';

export interface CreateTelemedicineSessionPayload {
  appointmentId: number;
}

export interface TelemedicineSessionResponse {
  sessionId: string;
  appointmentId: number;
  roomId: string;
  meetingUrl: string;
  sessionUrl: string;
  provider: 'JITSI' | string;
  status: 'CREATED' | 'STARTED' | 'COMPLETED' | string;
  createdAt: string;
}

async function request<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload?.message ||
      payload?.errors?.appointmentId ||
      payload?.errors?.sessionId ||
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

export function startTelemedicineSession(sessionId: number | string) {
  return request<TelemedicineSessionResponse>(`/session/${encodeURIComponent(String(sessionId))}/start`, {
    method: 'PUT',
  });
}

export function completeTelemedicineSession(sessionId: number | string) {
  return request<TelemedicineSessionResponse>(`/session/${encodeURIComponent(String(sessionId))}/complete`, {
    method: 'PUT',
  });
}