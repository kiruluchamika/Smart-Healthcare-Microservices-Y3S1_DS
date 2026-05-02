import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bell, ChevronRight, Loader2, CheckCheck, AlertCircle } from 'lucide-react';
import { useNotificationIdentity } from '../../hooks/useNotificationIdentity';
import { useNotifications } from '../../hooks/useNotifications';
import { formatRelativeTime, getNotificationMeta, getNotificationTone, shortenText } from '../../utils/notifications';

export default function NotificationBell() {
  const navigate = useNavigate();
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const identity = useNotificationIdentity();
  const { notifications, unreadCount, loading, error, refresh, markAsRead } = useNotifications(
    identity.role,
    identity.targetUserId,
    { limit: 6, pollIntervalMs: 30000, enabled: identity.status === 'ready' },
  );

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!wrapperRef.current) {
        return;
      }

      if (!wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [identity.role, identity.targetUserId]);

  const headerLabel = useMemo(() => {
    if (identity.role === 'DOCTOR') {
      return 'Doctor notifications';
    }

    if (identity.role === 'PATIENT') {
      return 'Patient notifications';
    }

    return 'Notifications';
  }, [identity.role]);

  const handleOpen = async () => {
    setIsOpen((prev) => !prev);
    if (!isOpen) {
      await refresh();
    }
  };

  const handleItemClick = async (notificationId: number) => {
    const item = notifications.find((entry) => entry.id === notificationId);
    if (item && !item.readFlag) {
      await markAsRead(notificationId);
    }
    setIsOpen(false);
    navigate('/notifications');
  };

  if (identity.status === 'missing') {
    return null;
  }

  const isIdentityError = identity.status === 'error';
  const isIdentityLoading = identity.status === 'loading';

  return (
    <div ref={wrapperRef} className="relative z-40">
      <button
        type="button"
        onClick={() => void handleOpen()}
        className={`relative flex h-11 w-11 items-center justify-center rounded-full border shadow-sm transition ${
          isIdentityError
            ? 'border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100'
            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-cyan-700'
        }`}
        aria-label={headerLabel}
        aria-expanded={isOpen}
        title={isIdentityError ? identity.errorMessage : undefined}
      >
        {isIdentityLoading ? (
          <Loader2 className="h-4.5 w-4.5 animate-spin" />
        ) : isIdentityError ? (
          <AlertCircle className="h-4.5 w-4.5" />
        ) : (
          <Bell className="h-4.5 w-4.5" />
        )}
        {unreadCount > 0 && !isIdentityError && (
          <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white shadow-lg">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.18 }}
          className="absolute right-0 mt-3 w-[min(92vw,24rem)] overflow-hidden rounded-[1.4rem] border border-slate-200 bg-white shadow-2xl shadow-slate-900/10"
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-700">{headerLabel}</p>
              <p className="text-sm text-slate-500">{unreadCount} unread, recent activity</p>
            </div>
            <button
              type="button"
              onClick={() => void refresh()}
              className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200"
            >
              Refresh
            </button>
          </div>

          <div className="max-h-[28rem] overflow-y-auto bg-gradient-to-b from-white to-slate-50/80 p-2">
            {isIdentityError ? (
              <div className="px-4 py-8 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <p className="text-sm font-semibold text-slate-700">Notifications unavailable</p>
                <p className="mt-1 text-xs text-slate-500">{identity.errorMessage || 'Unable to load doctor profile'}</p>
                {identity.retry && (
                  <button
                    type="button"
                    onClick={() => {
                      identity.retry?.();
                      setIsOpen(false);
                    }}
                    className="mt-3 inline-block rounded-lg bg-rose-100 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-200"
                  >
                    Retry
                  </button>
                )}
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center py-12 text-slate-500">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading notifications...
              </div>
            ) : error ? (
              <div className="px-4 py-8 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <p className="text-sm font-semibold text-slate-700">Failed to load notifications</p>
                <p className="mt-1 text-xs text-slate-500">{error}</p>
                <button
                  type="button"
                  onClick={() => void refresh()}
                  className="mt-3 inline-block rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                >
                  Retry
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-cyan-50 text-cyan-600">
                  <CheckCheck className="h-5 w-5" />
                </div>
                <p className="text-sm font-semibold text-slate-700">All caught up</p>
                <p className="mt-1 text-xs text-slate-500">New appointment or payment updates will appear here.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((notification) => {
                  const meta = getNotificationMeta(notification);
                  const Icon = meta.icon;

                  return (
                    <button
                      key={notification.id}
                      type="button"
                      onClick={() => void handleItemClick(notification.id)}
                      className={`group flex w-full items-start gap-3 rounded-[1.1rem] border border-transparent px-3 py-3 text-left transition hover:border-cyan-100 hover:bg-white ${getNotificationTone(notification)}`}
                    >
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${meta.accent} text-white shadow-sm`}>
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-semibold text-slate-900">{notification.title}</p>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                            {meta.badge}
                          </span>
                        </div>
                        <p className="mt-1 text-xs leading-5 text-slate-600">
                          {shortenText(notification.message, 110)}
                        </p>
                        <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-slate-500">
                          <span>{formatRelativeTime(notification.createdAt)}</span>
                          <span className="font-semibold text-slate-400 group-hover:text-cyan-700">
                            View details
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 bg-white px-4 py-3">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate('/notifications');
              }}
              className="flex w-full items-center justify-between rounded-2xl bg-gradient-to-r from-cyan-600 to-teal-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-900/10 transition hover:from-cyan-500 hover:to-teal-400"
            >
              <span>See all notifications</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
