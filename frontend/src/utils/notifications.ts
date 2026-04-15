import { BellRing, CalendarDays, CircleDollarSign, HeartPulse, ShieldAlert, Sparkles } from 'lucide-react';
import type { NotificationResponse } from '../types/notification';

export function formatRelativeTime(value?: string | null) {
  if (!value) {
    return 'Just now';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Just now';
  }

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function shortenText(text: string, maxLength = 120) {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
}

export function getNotificationMeta(notification: NotificationResponse) {
  const eventType = notification.eventType.toUpperCase();

  if (eventType.includes('APPOINTMENT')) {
    return {
      icon: CalendarDays,
      accent: 'from-teal-500 to-cyan-500',
      badge: 'Appointment',
    };
  }

  if (eventType.includes('PAYMENT')) {
    return {
      icon: CircleDollarSign,
      accent: 'from-emerald-500 to-teal-500',
      badge: 'Payment',
    };
  }

  if (eventType.includes('CONSULTATION')) {
    return {
      icon: HeartPulse,
      accent: 'from-sky-500 to-cyan-500',
      badge: 'Consultation',
    };
  }

  if (notification.status === 'FAILED') {
    return {
      icon: ShieldAlert,
      accent: 'from-rose-500 to-amber-500',
      badge: 'Attention',
    };
  }

  return {
    icon: Sparkles,
    accent: 'from-violet-500 to-cyan-500',
    badge: 'Update',
  };
}

export function getNotificationTone(notification: NotificationResponse) {
  if (!notification.readFlag) {
    return 'border-l-4 border-l-cyan-500 bg-cyan-50/80';
  }

  if (notification.status === 'FAILED') {
    return 'border-l-4 border-l-rose-500 bg-rose-50/80';
  }

  return 'bg-white/80';
}
