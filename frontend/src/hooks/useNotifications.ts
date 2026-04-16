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

  const canLoad = enabled && Boolean(role && targetUserId);

  const loadNotifications = useCallback(async () => {
    if (!canLoad || !role || !targetUserId) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [items, count] = await Promise.all([
        getNotifications(role, targetUserId),
        getUnreadNotificationCount(role, targetUserId),
      ]);

      setNotifications(typeof limit === 'number' ? items.slice(0, limit) : items);
      setUnreadCount(count.unreadCount || 0);
    } finally {
      setLoading(false);
    }
  }, [canLoad, limit, role, targetUserId]);

  const refresh = useCallback(async () => {
    await loadNotifications();
  }, [loadNotifications]);

  const markAsRead = useCallback(async (notificationId: number) => {
    const updated = await markNotificationAsRead(notificationId);
    setNotifications((current) => current.map((item) => (item.id === notificationId ? updated : item)));
    setUnreadCount((current) => Math.max(0, current - (updated.readFlag ? 1 : 0)));
    return updated;
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
      refresh,
      markAsRead,
      setNotifications,
    }),
    [loading, markAsRead, notifications, refresh, unreadCount],
  );
}
