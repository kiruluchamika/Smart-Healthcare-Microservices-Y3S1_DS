import { getAuthToken } from './authSession';
import type { NotificationResponse, UnreadCountResponse, NotificationRole } from '../types/notification';

const API_BASE = import.meta.env.VITE_NOTIFICATION_API_BASE || '/api/notifications';

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers || {}),
    },
  });

  const text = await response.text();
  let payload: unknown = null;

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const message =
      (payload && typeof payload === 'object' && 'message' in payload && typeof (payload as { message?: unknown }).message === 'string'
        ? (payload as { message: string }).message
        : null) ||
      (text.trim().length > 0 ? text : null) ||
      `Request failed with status ${response.status}`;

    throw new Error(message);
  }

  return payload as T;
}

export function getNotifications(targetRole: NotificationRole, targetUserId: number) {
  const params = new URLSearchParams({ targetRole, targetUserId: String(targetUserId) });
  return request<NotificationResponse[]>(`?${params.toString()}`);
}

export function getUnreadNotificationCount(targetRole: NotificationRole, targetUserId: number) {
  const params = new URLSearchParams({ targetRole, targetUserId: String(targetUserId) });
  return request<UnreadCountResponse>(`/unread-count?${params.toString()}`);
}

export function markNotificationAsRead(notificationId: number) {
  return request<NotificationResponse>(`/${notificationId}/read`, { method: 'PATCH' });
}
