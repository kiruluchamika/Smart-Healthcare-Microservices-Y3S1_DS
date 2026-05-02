import { getAuthToken } from './authSession';
import type { NotificationResponse, UnreadCountResponse, NotificationRole } from '../types/notification';

const API_BASE = import.meta.env.VITE_NOTIFICATION_API_BASE || '/api/notifications';

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const fullUrl = `${API_BASE}${path}`;
  console.log('[NOTIFICATION-API] Request | method:', init.method || 'GET', '| url:', fullUrl);

  const response = await fetch(fullUrl, {
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
    } catch (err) {
      console.warn('[NOTIFICATION-API] Failed to parse response as JSON:', text.substring(0, 100));
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

    console.error('[NOTIFICATION-API] Error | status:', response.status, '| message:', message);
    throw new Error(message);
  }

  console.log('[NOTIFICATION-API] Success | status:', response.status, '| response type:', typeof payload);
  return payload as T;
}

export function getNotifications(targetRole: NotificationRole, targetUserId: number) {
  const params = new URLSearchParams({ targetRole, targetUserId: String(targetUserId) });
  console.log('[NOTIFICATION-API] getNotifications | targetRole:', targetRole, '| targetUserId:', targetUserId);
  return request<NotificationResponse[]>(`?${params.toString()}`);
}

export function getUnreadNotificationCount(targetRole: NotificationRole, targetUserId: number) {
  const params = new URLSearchParams({ targetRole, targetUserId: String(targetUserId) });
  console.log('[NOTIFICATION-API] getUnreadNotificationCount | targetRole:', targetRole, '| targetUserId:', targetUserId);
  return request<UnreadCountResponse>(`/unread-count?${params.toString()}`);
}

export function markNotificationAsRead(notificationId: number) {
  console.log('[NOTIFICATION-API] markNotificationAsRead | notificationId:', notificationId);
  return request<NotificationResponse>(`/${notificationId}/read`, { method: 'PATCH' });
}
