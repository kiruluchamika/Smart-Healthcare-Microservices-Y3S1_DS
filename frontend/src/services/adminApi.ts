import { getAuthToken } from './authSession';
import type {
  AdminOverviewResponse,
  AdminSystemSettings,
  AdminUserItem,
  AdminUserStatusUpdatePayload,
  AdminUsersResponse,
} from '../types/admin';

const API_BASE = import.meta.env.VITE_AUTH_API_BASE || '/api/auth';

type RequestOptions = RequestInit & {
  skipContentType?: boolean;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const { skipContentType = false, headers, ...init } = options;

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...(skipContentType ? {} : { 'Content-Type': 'application/json' }),
      Authorization: `Bearer ${token}`,
      ...(headers || {}),
    },
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const fieldErrors = payload?.errors && typeof payload.errors === 'object'
      ? Object.values(payload.errors).filter((value): value is string => typeof value === 'string')
      : [];

    const message = fieldErrors[0] || payload?.message || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return payload as T;
}

export function getAdminOverview() {
  return request<AdminOverviewResponse>('/admin/overview');
}

export function getAdminUsers(page = 0, size = 10) {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
  });

  return request<AdminUsersResponse>(`/admin/users?${params.toString()}`);
}

export function updateAdminUserStatus(userId: number, payload: AdminUserStatusUpdatePayload) {
  return request<AdminUserItem>(`/admin/users/${userId}/status`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function getAdminSystemSettings() {
  return request<AdminSystemSettings>('/admin/settings');
}

export function updateAdminSystemSettings(payload: AdminSystemSettings) {
  return request<AdminSystemSettings>('/admin/settings', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}
