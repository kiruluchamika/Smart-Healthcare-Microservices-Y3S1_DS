export type UserRole = 'PATIENT' | 'DOCTOR' | 'ADMIN';

export interface AdminOverviewResponse {
  totalUsers: number;
  adminUsers: number;
  doctorUsers: number;
  patientUsers: number;
  enabledUsers: number;
  disabledUsers: number;
}

export interface AdminUserItem {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string | null;
  role: UserRole;
  enabled: boolean;
  accountNonLocked: boolean;
  createdAt?: string;
  lastLoginAt?: string | null;
}

export interface AdminUsersResponse {
  items: AdminUserItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface AdminUserStatusUpdatePayload {
  enabled: boolean;
  accountNonLocked: boolean;
}

export interface AdminSystemSettings {
  sessionTimeoutMinutes: number;
  maintenanceMode: boolean;
  registrationsEnabled: boolean;
}
