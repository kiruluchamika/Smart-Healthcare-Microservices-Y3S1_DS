import { getAuthToken, getAuthUser } from './authSession';

const DOCTOR_PROFILE_ID_KEY = 'doctorProfileId';

export interface BookedSlot {
  appointmentId: number;
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';
}

export interface AvailabilityResponse {
  doctorId: number;
  appointmentDate: string;
  bookedSlots: BookedSlot[];
  message: string;
}

export interface CreateAppointmentPayload {
  doctorId: number;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  appointmentType: 'VIDEO' | 'PHYSICAL';
  reasonForVisit: string;
}

export interface AppointmentResponse {
  id: number;
  patientId: number;
  doctorId: number;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  appointmentType: 'VIDEO' | 'PHYSICAL';
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';
  reasonForVisit: string;
  fixedFeeSnapshot?: number | null;
  doctorExtraFee?: number | null;
  finalFee?: number | null;
  feeCurrency?: string | null;
  feeLockedAt?: string | null;
  extraFeeReason?: string | null;
  paymentStatusHint?: 'UNPAID' | 'PAID' | 'FAILED' | 'REFUNDED' | 'COMPLETED' | string | null;
  paymentPaidAt?: string | null;
  telemedicineSessionUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AcceptAppointmentPayload {
  extraFee?: number;
  extraFeeReason?: string;
}

export interface RescheduleAppointmentPayload {
  appointmentDate: string;
  startTime: string;
  endTime: string;
}

export interface UpdateAppointmentPaymentStatusPayload {
  paymentStatus: string;
  paidAt?: string | null;
  telemedicineSessionUrl?: string | null;
}

const API_BASE = import.meta.env.VITE_APPOINTMENTS_API_BASE || '/api/appointments';

function buildHeaders(includeJson = true) {
  const token = getAuthToken();
  const user = getAuthUser();

  return {
    ...(includeJson ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(user?.id ? { 'X-Patient-Id': String(user.id) } : {}),
  };
}

function buildDoctorHeaders(includeJson = true) {
  const token = getAuthToken();
  const user = getAuthUser();
  const storedDoctorProfileId = localStorage.getItem(DOCTOR_PROFILE_ID_KEY);
  const doctorId = storedDoctorProfileId || (user?.id ? String(user.id) : null);

  return {
    ...(includeJson ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(doctorId ? { 'X-Doctor-Id': doctorId } : {}),
  };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
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
      payload?.errors?.appointmentDate ||
      payload?.errors?.startTime ||
      payload?.errors?.doctorId ||
      `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return payload as T;
}

export function getDoctorAvailability(doctorId: number, date: string) {
  const params = new URLSearchParams({
    doctorId: String(doctorId),
    date,
  });

  return request<AvailabilityResponse>(`/availability?${params.toString()}`, {
    method: 'GET',
  });
}

export async function createAppointment(
  payload: CreateAppointmentPayload,
): Promise<AppointmentResponse> {
  const user = getAuthUser();

  if (!user?.id) {
    throw new Error('You must be signed in to book an appointment');
  }

  return request<AppointmentResponse>('', {
    method: 'POST',
    body: JSON.stringify({
      patientId: user.id,
      ...payload,
    }),
  });
}

export function getMyAppointments() {
  const user = getAuthUser();

  if (!user?.id) {
    throw new Error('You must be signed in to view appointments');
  }

  return request<AppointmentResponse[]>('/my', {
    method: 'GET',
  });
}

export function getAppointmentById(appointmentId: number) {
  return request<AppointmentResponse>(`/${appointmentId}`, {
    method: 'GET',
  });
}

export function cancelAppointment(appointmentId: number) {
  return request<{ message: string; timestamp: string }>(`/${appointmentId}/cancel`, {
    method: 'PATCH',
  });
}

export function rescheduleAppointment(
  appointmentId: number,
  payload: RescheduleAppointmentPayload,
) {
  return request<AppointmentResponse>(`/${appointmentId}/reschedule`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function getMyDoctorAppointments() {
  const user = getAuthUser();

  if (!user?.id) {
    throw new Error('You must be signed in to view doctor appointments');
  }

  const response = await fetch(`${API_BASE}/doctor/me`, {
    method: 'GET',
    headers: buildDoctorHeaders(),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message = payload?.message || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return payload as AppointmentResponse[];
}

async function doctorAction(path: string, bodyPayload?: unknown) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'PATCH',
    headers: buildDoctorHeaders(),
    body: bodyPayload ? JSON.stringify(bodyPayload) : undefined,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message = payload?.message || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return payload as AppointmentResponse;
}

export function acceptAppointment(appointmentId: number) {
  return doctorAction(`/${appointmentId}/accept`);
}

export function acceptAppointmentWithFee(
  appointmentId: number,
  payload: AcceptAppointmentPayload,
) {
  return doctorAction(`/${appointmentId}/accept`, payload);
}

export function rejectAppointment(appointmentId: number) {
  return doctorAction(`/${appointmentId}/reject`);
}

export function completeAppointment(appointmentId: number) {
  return doctorAction(`/${appointmentId}/complete`);
}

export function updateAppointmentPaymentStatus(
  appointmentId: number,
  payload: UpdateAppointmentPaymentStatusPayload,
) {
  return request<AppointmentResponse>(`/${appointmentId}/payment-status`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}
