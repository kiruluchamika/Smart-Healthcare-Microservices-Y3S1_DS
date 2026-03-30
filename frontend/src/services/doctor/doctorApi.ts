import type {
  ApiErrorResponse,
  DoctorAvailability,
  DoctorAvailabilityPayload,
  DoctorCreatePayload,
  DoctorDashboardSummary,
  DoctorListParams,
  DoctorSearchParams,
  DoctorServiceDoctor,
  DoctorUpdatePayload,
  DoctorUserRole,
  DoctorVerificationHistoryItem,
  DoctorVerificationStatusUpdatePayload,
  PagedResponse,
} from '../../types/doctor';

const DOCTOR_API_BASE = import.meta.env.VITE_DOCTOR_API_BASE || '/api/doctors';

type RequestOptions = RequestInit & {
  role?: DoctorUserRole;
  idempotencyKey?: string;
};

function getBasicCredentials(role: DoctorUserRole = 'doctor') {
  if (role === 'admin') {
    const username = import.meta.env.VITE_DOCTOR_ADMIN_USER || 'admin';
    const password = import.meta.env.VITE_DOCTOR_ADMIN_PASS || 'admin123';
    return { username, password };
  }

  const username = import.meta.env.VITE_DOCTOR_USER || 'doctor';
  const password = import.meta.env.VITE_DOCTOR_PASS || 'doctor123';
  return { username, password };
}

function getBasicAuthHeader(role: DoctorUserRole = 'doctor') {
  const credentials = getBasicCredentials(role);
  return `Basic ${btoa(`${credentials.username}:${credentials.password}`)}`;
}

function serializeParams(params?: Record<string, string | number | boolean | undefined>) {
  if (!params) {
    return '';
  }

  const queryParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    queryParams.set(key, String(value));
  });

  const query = queryParams.toString();
  return query ? `?${query}` : '';
}

function parseApiError(payload: ApiErrorResponse | null, response: Response) {
  const error = new Error(payload?.message || `Request failed with status ${response.status}`) as Error & {
    status?: number;
    fieldErrors?: Record<string, string>;
    traceId?: string;
  };

  error.status = response.status;
  error.fieldErrors = payload?.fieldErrors || {};
  error.traceId = payload?.traceId;
  return error;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { role = 'doctor', idempotencyKey, headers, ...init } = options;

  const response = await fetch(`${DOCTOR_API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: getBasicAuthHeader(role),
      ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
      ...(headers || {}),
    },
  });

  const payload = (await response.json().catch(() => null)) as ApiErrorResponse | T | null;

  if (!response.ok) {
    throw parseApiError(payload as ApiErrorResponse | null, response);
  }

  return payload as T;
}

export function getDoctors(params: DoctorListParams = {}) {
  const query = serializeParams({
    page: params.page ?? 0,
    size: params.size ?? 10,
    sortBy: params.sortBy ?? 'createdAt',
    sortDir: params.sortDir ?? 'desc',
  });

  return request<PagedResponse<DoctorServiceDoctor>>(`${query}`);
}

export function searchDoctors(params: DoctorSearchParams = {}) {
  const query = serializeParams({
    specialization: params.specialization,
    verified: params.verified,
    active: params.active,
    minExperience: params.minExperience,
    dayOfWeek: params.dayOfWeek,
  });

  return request<DoctorServiceDoctor[]>(`/search${query}`);
}

export function getDoctorById(doctorId: number) {
  return request<DoctorServiceDoctor>(`/${doctorId}`);
}

export function createDoctor(payload: DoctorCreatePayload, idempotencyKey?: string) {
  return request<DoctorServiceDoctor>('', {
    method: 'POST',
    body: JSON.stringify(payload),
    idempotencyKey,
  });
}

export function updateDoctor(doctorId: number, payload: DoctorUpdatePayload) {
  return request<DoctorServiceDoctor>(`/${doctorId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function deleteDoctor(doctorId: number) {
  return request<{ message: string }>(`/${doctorId}`, {
    method: 'DELETE',
  });
}

export function createAvailability(doctorId: number, payload: DoctorAvailabilityPayload) {
  return request<DoctorAvailability>(`/${doctorId}/availability`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getAvailability(doctorId: number) {
  return request<DoctorAvailability[]>(`/${doctorId}/availability`);
}

export function updateAvailability(doctorId: number, availabilityId: number, payload: DoctorAvailabilityPayload) {
  return request<DoctorAvailability>(`/${doctorId}/availability/${availabilityId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function deleteAvailability(doctorId: number, availabilityId: number) {
  return request<{ message: string }>(`/${doctorId}/availability/${availabilityId}`, {
    method: 'DELETE',
  });
}

export function getDashboardSummary(doctorId: number) {
  return request<DoctorDashboardSummary>(`/${doctorId}/dashboard-summary`);
}

export function updateVerificationStatus(
  doctorId: number,
  payload: DoctorVerificationStatusUpdatePayload,
) {
  return request<DoctorServiceDoctor>(`/${doctorId}/verification-status`, {
    role: 'admin',
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function getVerificationHistory(doctorId: number) {
  return request<DoctorVerificationHistoryItem[]>(`/${doctorId}/verification-history`, {
    role: 'admin',
  });
}
