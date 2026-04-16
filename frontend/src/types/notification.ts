export type NotificationRole = 'PATIENT' | 'DOCTOR';
export type NotificationChannel = 'EMAIL' | 'SMS' | 'BOTH';
export type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED';

export interface NotificationResponse {
  id: number;
  eventType: string;
  targetRole: NotificationRole;
  targetUserId: number;
  paymentId?: number | null;
  appointmentId?: number | null;
  title: string;
  message: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  recipientEmail?: string | null;
  recipientPhone?: string | null;
  recipientName?: string | null;
  failureReason?: string | null;
  readFlag: boolean;
  readAt?: string | null;
  sentAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UnreadCountResponse {
  unreadCount: number;
}
