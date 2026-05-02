import { useCallback, useEffect, useMemo, useState } from 'react';
import type { NotificationResponse, NotificationRole } from '../types/notification';
import { getNotifications, getUnreadNotificationCount, markNotificationAsRead } from '../services/notificationApi';

interface UseNotificationsOptions {
  limit?: number;
  pollIntervalMs?: number;
  enabled?: boolean;
}

export function useNotifications(
  role: NotificationRole | null,
  targetUserId: number | null,
  options: UseNotificationsOptions = {},
) {
  const { limit, pollIntervalMs = 30000, enabled = true } = options;
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canLoad = enabled && Boolean(role && targetUserId);

  const loadNotifications = useCallback(async () => {
    if (!canLoad || !role || !targetUserId) {
      console.log('[NOTIFICATIONS-HOOK] Cannot load: canLoad=', canLoad, 'role=', role, 'targetUserId=', targetUserId);
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      console.log('[NOTIFICATIONS-HOOK] Fetching notifications | role:', role, '| userId:', targetUserId);
      const [items, count] = await Promise.all([
        getNotifications(role, targetUserId),
        getUnreadNotificationCount(role, targetUserId),
      ]);

      const notificationItems = Array.isArray(items) ? items : [];
      const unreadValue = typeof count?.unreadCount === 'number' ? count.unreadCount : 0;

      console.log('[NOTIFICATIONS-HOOK] Received:', notificationItems.length, 'notifications |', unreadValue, 'unread');
      setNotifications(typeof limit === 'number' ? notificationItems.slice(0, limit) : notificationItems);
      setUnreadCount(unreadValue);
      setError(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error('[NOTIFICATIONS-HOOK] Error loading notifications:', errorMsg);
      setError(errorMsg);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, [canLoad, limit, role, targetUserId]);

  const refresh = useCallback(async () => {
    console.log('[NOTIFICATIONS-HOOK] Manual refresh triggered');
    await loadNotifications();
  }, [loadNotifications]);

  const markAsRead = useCallback(async (notificationId: number) => {
    try {
      console.log('[NOTIFICATIONS-HOOK] Marking notification as read | id:', notificationId);
      const updated = await markNotificationAsRead(notificationId);
      setNotifications((current) => current.map((item) => (item.id === notificationId ? updated : item)));
      setUnreadCount((current) => Math.max(0, current - (updated.readFlag ? 1 : 0)));
      console.log('[NOTIFICATIONS-HOOK] Notification marked as read successfully');
      return updated;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error('[NOTIFICATIONS-HOOK] Error marking notification as read:', errorMsg);
      throw err;
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    if (!canLoad || pollIntervalMs <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      void loadNotifications();
    }, pollIntervalMs);

    return () => window.clearInterval(timer);
  }, [canLoad, loadNotifications, pollIntervalMs]);

  return useMemo(
    () => ({
      notifications,
      unreadCount,
      loading,
      error,
      refresh,
      markAsRead,
      setNotifications,
    }),
    [error, loading, markAsRead, notifications, refresh, unreadCount],
  );
}
