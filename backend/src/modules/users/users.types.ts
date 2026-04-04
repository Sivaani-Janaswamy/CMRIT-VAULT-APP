export type RoleCode = 'student' | 'faculty' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: RoleCode;
}

export interface AdminUserProfile extends UserProfile {
  rollNo: string | null;
  department: string | null;
  semester: number | null;
  isActive: boolean;
}

export interface UpdateOwnUserInput {
  fullName?: string;
  rollNo?: string | null;
  department?: string | null;
  semester?: number | null;
}

export interface AdminUsersQuery {
  page: number;
  pageSize: number;
  role?: RoleCode;
  department?: string;
  semester?: number;
}

export interface AdminUsersPage {
  items: AdminUserProfile[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface UpdateUserRoleInput {
  role: RoleCode;
}

export interface UpdateUserStatusInput {
  is_active: boolean;
}

export interface UserAccessContext {
  id: string;
  role: RoleCode;
  isActive: boolean;
}
