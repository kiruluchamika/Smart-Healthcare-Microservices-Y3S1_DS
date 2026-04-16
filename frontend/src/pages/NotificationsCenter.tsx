import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  BellRing,
  CalendarDays,
  CircleDollarSign,
  Filter,
  Loader2,
  Search,
  ShieldAlert,
  Sparkles,
  CheckCheck,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useNotificationIdentity } from '../hooks/useNotificationIdentity';
import { useNotifications } from '../hooks/useNotifications';
import { formatRelativeTime, getNotificationMeta, getNotificationTone, shortenText } from '../utils/notifications';
import type { NotificationResponse } from '../types/notification';

type FilterKey = 'ALL' | 'UNREAD' | 'APPOINTMENT' | 'PAYMENT' | 'SYSTEM';

function getNotificationGroup(notification: NotificationResponse): Exclude<FilterKey, 'ALL' | 'UNREAD'> {
  const eventType = notification.eventType.toUpperCase();

  if (eventType.includes('APPOINTMENT')) return 'APPOINTMENT';
  if (eventType.includes('PAYMENT')) return 'PAYMENT';
  return 'SYSTEM';
}

function getFilterStats(notifications: NotificationResponse[]) {
  const unread = notifications.filter((item) => !item.readFlag).length;
  const appointments = notifications.filter((item) => getNotificationGroup(item) === 'APPOINTMENT').length;
  const payments = notifications.filter((item) => getNotificationGroup(item) === 'PAYMENT').length;
  const system = notifications.filter((item) => getNotificationGroup(item) === 'SYSTEM').length;

  return { unread, appointments, payments, system };
}

export default function NotificationsCenter() {
  const navigate = useNavigate();
  const identity = useNotificationIdentity();
  const { notifications, unreadCount, loading, refresh, markAsRead } = useNotifications(
    identity.role,
    identity.targetUserId,
    { pollIntervalMs: 30000, enabled: identity.status === 'ready' },
  );
  const [activeFilter, setActiveFilter] = useState<FilterKey>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNotificationId, setSelectedNotificationId] = useState<number | null>(null);

  useEffect(() => {
    if (notifications.length > 0 && selectedNotificationId === null) {
      setSelectedNotificationId(notifications[0].id);
    }
  }, [notifications, selectedNotificationId]);

  const filteredNotifications = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return notifications.filter((notification) => {
      if (activeFilter === 'UNREAD' && notification.readFlag) return false;
      if (activeFilter !== 'ALL' && activeFilter !== 'UNREAD' && getNotificationGroup(notification) !== activeFilter) {
        return false;
      }

      if (!query) return true;

      return [notification.title, notification.message, notification.eventType, notification.failureReason]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [activeFilter, notifications, searchTerm]);

  const stats = useMemo(() => getFilterStats(notifications), [notifications]);
  const selectedNotification = useMemo(
    () => filteredNotifications.find((item) => item.id === selectedNotificationId) || filteredNotifications[0] || null,
    [filteredNotifications, selectedNotificationId],
  );

  const roleLabel = identity.role === 'DOCTOR' ? 'Doctor' : 'Patient';

  const handleMarkAsRead = async (notification: NotificationResponse) => {
    if (!notification.readFlag) {
      await markAsRead(notification.id);
      await refresh();
    }
    setSelectedNotificationId(notification.id);
  };

  const handleMarkAllAsRead = async () => {
    const unreadItems = filteredNotifications.filter((item) => !item.readFlag);
    if (!unreadItems.length) {
      return;
    }

    await Promise.all(unreadItems.map((item) => markAsRead(item.id)));
    await refresh();
  };

  if (identity.status === 'missing') {
    return (
      <div className="min-h-screen bg-[#e7f3f5] px-4 pb-20 pt-28 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-[1.75rem] border border-white/70 bg-white/70 p-6 text-center shadow-xl backdrop-blur-xl">
          <BellRing className="mx-auto mb-3 h-10 w-10 text-cyan-600" />
          <h1 className="text-2xl font-black text-slate-900">Notifications are unavailable</h1>
          <p className="mt-2 text-sm text-slate-600">Sign in with a patient or doctor account to view notification activity.</p>
          <div className="mt-6">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white"
            >
              Go to dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#e7f3f5] relative overflow-hidden px-4 pb-20 pt-24 sm:px-6 lg:px-8 text-slate-900">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(87,184,193,0.22),transparent_40%),radial-gradient(circle_at_85%_25%,rgba(64,145,168,0.18),transparent_35%),radial-gradient(circle_at_30%_85%,rgba(206,233,238,0.8),transparent_42%)]" />
      <div className="absolute inset-0 backdrop-blur-[1px]" />

      <div className="relative z-10 mx-auto max-w-7xl">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mb-6 overflow-hidden rounded-[2rem] border border-white/60 bg-white/55 p-5 shadow-[0_18px_60px_rgba(13,55,78,0.14)] backdrop-blur-xl"
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.24em] text-cyan-700">
                <Sparkles className="h-3.5 w-3.5" />
                Activity center
              </div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                {roleLabel} notifications
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
                Follow appointments, payments, reminders, and delivery updates in one creative timeline.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Unread</p>
                <p className="text-2xl font-black text-slate-900">{unreadCount}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total</p>
                <p className="text-2xl font-black text-slate-900">{notifications.length}</p>
              </div>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to dashboard
              </Link>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'All', value: notifications.length, icon: BellRing, tone: 'from-cyan-500 to-teal-500' },
              { label: 'Unread', value: stats.unread, icon: CheckCheck, tone: 'from-rose-500 to-orange-500' },
              { label: 'Appointments', value: stats.appointments, icon: CalendarDays, tone: 'from-teal-500 to-cyan-500' },
              { label: 'Payments', value: stats.payments, icon: CircleDollarSign, tone: 'from-emerald-500 to-teal-500' },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/70 bg-white/85 p-4 shadow-sm">
                <div className={`flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br ${item.tone} text-white shadow-sm`}>
                  <item.icon className="h-4.5 w-4.5" />
                </div>
                <p className="mt-4 text-xs font-bold uppercase tracking-[0.22em] text-slate-500">{item.label}</p>
                <p className="mt-1 text-2xl font-black text-slate-900">{item.value}</p>
              </div>
            ))}
          </div>
        </motion.section>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.05 }}
            className="rounded-[1.8rem] border border-white/70 bg-white/55 p-4 shadow-[0_18px_60px_rgba(13,55,78,0.12)] backdrop-blur-xl sm:p-5"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-700">Filter activity</p>
                <h2 className="text-xl font-black text-slate-900">Your notification stream</h2>
              </div>

              <div className="flex flex-wrap gap-2">
                {(['ALL', 'UNREAD', 'APPOINTMENT', 'PAYMENT', 'SYSTEM'] as FilterKey[]).map((filter) => {
                  const active = activeFilter === filter;
                  return (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setActiveFilter(filter)}
                      className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] transition ${
                        active
                          ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10'
                          : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {filter.replace('_', ' ')}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search title, message, or event type"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-11 py-3 text-sm text-slate-800 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                />
              </div>

              <button
                type="button"
                onClick={() => void refresh()}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Loader2 className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>

              <button
                type="button"
                onClick={() => void handleMarkAllAsRead()}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 to-teal-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-900/10 hover:from-cyan-500 hover:to-teal-400"
              >
                <CheckCheck className="h-4 w-4" />
                Mark all read
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {loading ? (
                <div className="flex items-center justify-center rounded-[1.5rem] border border-dashed border-slate-200 bg-white/80 py-16 text-slate-500">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading your notifications...
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-white/80 px-6 py-16 text-center">
                  <BellRing className="mx-auto h-10 w-10 text-cyan-500" />
                  <h3 className="mt-4 text-lg font-black text-slate-900">No notifications found</h3>
                  <p className="mt-2 text-sm text-slate-600">
                    Try a different filter or search term. New appointment and payment activity will show here.
                  </p>
                </div>
              ) : (
                filteredNotifications.map((notification) => {
                  const meta = getNotificationMeta(notification);
                  const Icon = meta.icon;
                  const selected = selectedNotification?.id === notification.id;

                  return (
                    <button
                      key={notification.id}
                      type="button"
                      onClick={() => void handleMarkAsRead(notification)}
                      className={`w-full rounded-[1.5rem] border p-4 text-left transition ${
                        selected
                          ? 'border-cyan-200 bg-cyan-50/80 shadow-lg shadow-cyan-900/5'
                          : 'border-slate-200 bg-white/85 hover:border-cyan-100 hover:bg-white'
                      } ${getNotificationTone(notification)}`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${meta.accent} text-white shadow-sm`}>
                          <Icon className="h-5 w-5" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="truncate text-base font-black text-slate-900">{notification.title}</p>
                                {!notification.readFlag && (
                                  <span className="rounded-full bg-cyan-600 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white">
                                    New
                                  </span>
                                )}
                                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                                  {meta.badge}
                                </span>
                              </div>
                              <p className="mt-1 text-sm leading-6 text-slate-600">
                                {shortenText(notification.message, 180)}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
                              <span>{formatRelativeTime(notification.createdAt)}</span>
                              <Filter className="h-3.5 w-3.5" />
                            </div>
                          </div>

                          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">{notification.status}</span>
                            <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">{notification.channel}</span>
                            {notification.recipientName && (
                              <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">
                                {notification.recipientName}
                              </span>
                            )}
                            {notification.failureReason && (
                              <span className="rounded-full bg-rose-50 px-3 py-1 font-semibold text-rose-700">
                                {notification.failureReason}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </motion.section>

          <motion.aside
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08 }}
            className="rounded-[1.8rem] border border-white/70 bg-white/55 p-5 shadow-[0_18px_60px_rgba(13,55,78,0.12)] backdrop-blur-xl"
          >
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-700">Notification details</p>
            {selectedNotification ? (
              <div className="mt-4 space-y-4">
                <div className="rounded-[1.4rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-black text-slate-900">{selectedNotification.title}</h3>
                      <p className="mt-1 text-sm text-slate-500">{formatRelativeTime(selectedNotification.createdAt)}</p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-600 to-teal-500 text-white shadow-sm">
                      {selectedNotification.status === 'FAILED' ? <ShieldAlert className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
                    </div>
                  </div>

                  <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-700">
                    {selectedNotification.message}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Event</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">{selectedNotification.eventType}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Channel</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">{selectedNotification.channel}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Recipient</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">{selectedNotification.recipientName || 'Unknown'}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Status</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">{selectedNotification.status}</p>
                  </div>
                </div>

                {selectedNotification.failureReason && (
                  <div className="rounded-[1.4rem] border border-rose-100 bg-rose-50/80 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-rose-700">Failure reason</p>
                    <p className="mt-2 text-sm leading-6 text-rose-800">{selectedNotification.failureReason}</p>
                  </div>
                )}

                <div className="rounded-[1.4rem] border border-cyan-100 bg-cyan-50/80 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-700">Message feed tip</p>
                  <p className="mt-2 text-sm leading-6 text-cyan-900/90">
                    Patient updates stay reassuring and clear, while doctor updates stay concise and action-oriented.
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-[1.4rem] border border-dashed border-slate-200 bg-white/80 p-6 text-center text-sm text-slate-500">
                Select a notification to see the full activity details.
              </div>
            )}
          </motion.aside>
        </div>
      </div>
    </div>
  );
}
