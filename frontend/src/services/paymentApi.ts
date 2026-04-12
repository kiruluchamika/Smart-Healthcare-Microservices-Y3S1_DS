import { getAuthToken, getAuthUser } from './authSession';

const API_BASE = import.meta.env.VITE_PAYMENT_API_BASE || '/api/payments';

export interface CreateCheckoutSessionPayload {
  appointmentId: number;
  successUrl?: string;
  cancelUrl?: string;
}

export interface CheckoutSessionResponse {
  paymentId: number;
  appointmentId: number;
  patientId: number;
  doctorId: number;
  amount: string;
  currency: string;
  status: 'CREATED' | 'CHECKOUT_CREATED' | 'PAID' | 'FAILED' | 'CANCELLED' | 'REFUND_PENDING' | 'REFUNDED' | 'COMPLETED';
  checkoutSessionId: string | null;
  checkoutUrl: string | null;
  telemedicineSessionUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentResponse extends CheckoutSessionResponse {
  appointmentDate: string;
  startTime: string;
  endTime: string;
  appointmentType: string;
  provider: 'STRIPE';
  paymentIntentId: string | null;
  refundId: string | null;
  failureReason: string | null;
  refundReason: string | null;
  reminderSent: boolean;
  paidAt: string | null;
  refundedAt: string | null;
  completedAt: string | null;
  reminderSentAt: string | null;
}

export interface PaymentSummaryResponse {
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  refundedTransactions: number;
  pendingTransactions: number;
  totalRevenue: string;
  currency: string;
}

export interface RefundRequest {
  reason?: string;
  amount?: number;
}

export class PaymentApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'PaymentApiError';
    this.status = status;
  }
}

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

  return {
    ...(includeJson ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(user?.id ? { 'X-Doctor-Id': String(user.id) } : {}),
  };
}

async function request<T>(path: string, init?: RequestInit, headers?: Record<string, string>) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...buildHeaders(),
      ...(headers || {}),
      ...(init?.headers || {}),
    },
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload?.message ||
      payload?.errors?.appointmentId ||
      payload?.errors?.reason ||
      `Request failed with status ${response.status}`;
    throw new PaymentApiError(message, response.status);
  }

  return payload as T;
}

export function createCheckoutSession(payload: CreateCheckoutSessionPayload) {
  return request<CheckoutSessionResponse>('/checkout-sessions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function syncCheckoutSession(sessionId: string) {
  return request<PaymentResponse>(`/checkout-sessions/${encodeURIComponent(sessionId)}/sync`, {
    method: 'POST',
  });
}

export function getMyPayments() {
  return request<PaymentResponse[] | null>('/patient/me', {
    method: 'GET',
  }).then((payload) => (Array.isArray(payload) ? payload : []));
}

export function getMyDoctorPayments() {
  const headers = buildDoctorHeaders();
  return fetch(`${API_BASE}/doctor/me`, {
    method: 'GET',
    headers,
  }).then(async (response) => {
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(payload?.message || `Request failed with status ${response.status}`);
    }
    return payload as PaymentResponse[];
  });
}

export function getPaymentByAppointmentId(appointmentId: number) {
  return request<PaymentResponse>(`/appointment/${appointmentId}`, {
    method: 'GET',
  });
}

export function isPaymentNotFoundError(error: unknown) {
  return error instanceof PaymentApiError && error.status === 404;
}

export function getPaymentById(paymentId: number) {
  return request<PaymentResponse>(`/${paymentId}`, {
    method: 'GET',
  });
}

export function getAdminPayments() {
  return request<PaymentResponse[]>('/admin/transactions', {
    method: 'GET',
  });
}

export function getAdminSummary() {
  return request<PaymentSummaryResponse>('/admin/summary', {
    method: 'GET',
  });
}

export function requestRefund(paymentId: number, payload: RefundRequest) {
  return request<PaymentResponse>(`/${paymentId}/refunds`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function completeConsultation(paymentId: number, summary?: string) {
  return request<PaymentResponse>(`/${paymentId}/complete`, {
    method: 'POST',
    body: JSON.stringify(summary ? { summary } : {}),
  });
}