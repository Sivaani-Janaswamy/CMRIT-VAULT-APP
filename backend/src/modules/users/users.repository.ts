import { supabaseServiceClient } from '../../integrations/supabase/client';
import { NotFoundError } from '../../common/errors/NotFoundError';

import type {
  AdminUserProfile,
  AdminUsersPage,
  AdminUsersQuery,
  RoleCode,
  UpdateOwnUserInput,
  UserAccessContext,
  UserProfile
} from './users.types';

type UserRow = {
  id: string;
  email: string;
  full_name: string;
  role_id: number;
  roll_no: string | null;
  department: string | null;
  semester: number | null;
  is_active: boolean;
};

class UsersRepository {
  private roleCodeCache = new Map<number, RoleCode>();
  private roleIdCache = new Map<RoleCode, number>();

  private isRoleCode(value: string): value is RoleCode {
    return value === 'student' || value === 'faculty' || value === 'admin';
  }

  private async resolveRoleId(roleCode: RoleCode): Promise<number> {
    const cachedRoleId = this.roleIdCache.get(roleCode);
    if (cachedRoleId !== undefined) {
      return cachedRoleId;
    }

    const { data, error } = await supabaseServiceClient
      .from('roles')
      .select('id')
      .eq('code', roleCode)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new NotFoundError(`Role not found: ${roleCode}`);
    }

    this.roleIdCache.set(roleCode, data.id);
    return data.id;
  }

  private async resolveRoleCode(roleId: number): Promise<RoleCode> {
    const cachedRoleCode = this.roleCodeCache.get(roleId);
    if (cachedRoleCode) {
      return cachedRoleCode;
    }

    const { data, error } = await supabaseServiceClient
      .from('roles')
      .select('code')
      .eq('id', roleId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    const role = data?.code && this.isRoleCode(data.code) ? data.code : 'student';
    this.roleCodeCache.set(roleId, role);
    return role;
  }

  private async mapUserRow(row: UserRow): Promise<AdminUserProfile> {
    return {
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      role: await this.resolveRoleCode(row.role_id),
      rollNo: row.roll_no,
      department: row.department,
      semester: row.semester,
      isActive: row.is_active
    };
  }

  async findById(id: string): Promise<UserProfile | null> {
    const user = await this.findAdminUserById(id);
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role
    };
  }

  async findAccessContextById(id: string): Promise<UserAccessContext | null> {
    const user = await this.findAdminUserById(id);
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      role: user.role,
      isActive: user.isActive
    };
  }

  async findAdminUserById(id: string): Promise<AdminUserProfile | null> {
    const { data, error } = await supabaseServiceClient
      .from('users')
      .select('id,email,full_name,role_id,roll_no,department,semester,is_active')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    const row = data as UserRow | null;

    if (!row) {
      return null;
    }

    return this.mapUserRow(row);
  }

  async updateOwnProfile(
    id: string,
    input: UpdateOwnUserInput
  ): Promise<UserProfile | null> {
    const payload: Record<string, string | number | null> = {};

    if (input.fullName !== undefined) {
      payload.full_name = input.fullName;
    }

    if (input.rollNo !== undefined) {
      payload.roll_no = input.rollNo;
    }

    if (input.department !== undefined) {
      payload.department = input.department;
    }

    if (input.semester !== undefined) {
      payload.semester = input.semester;
    }

    const { data, error } = await supabaseServiceClient
      .from('users')
      .update(payload)
      .eq('id', id)
      .select('id,email,full_name,role_id')
      .maybeSingle();

    if (error) {
      throw error;
    }

    const row = data as UserRow | null;

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      role: await this.resolveRoleCode(row.role_id)
    };
  }

  async listUsers(filters: AdminUsersQuery): Promise<AdminUsersPage> {
    const { page, pageSize, role, department, semester } = filters;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabaseServiceClient
      .from('users')
      .select('id,email,full_name,role_id,roll_no,department,semester,is_active', {
        count: 'exact'
      })
      .order('full_name', { ascending: true })
      .order('id', { ascending: true });

    if (role) {
      const roleId = await this.resolveRoleId(role);
      query = query.eq('role_id', roleId);
    }

    if (department) {
      query = query.eq('department', department);
    }

    if (semester !== undefined) {
      query = query.eq('semester', semester);
    }

    const { data, error, count } = await query.range(from, to);

    if (error) {
      throw error;
    }

    const items = await Promise.all((data ?? []).map((row) => this.mapUserRow(row as UserRow)));
    const total = count ?? 0;

    return {
      items,
      page,
      pageSize,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / pageSize)
    };
  }

  async updateUserRole(id: string, role: RoleCode): Promise<AdminUserProfile | null> {
    const roleId = await this.resolveRoleId(role);

    const { data, error } = await supabaseServiceClient
      .from('users')
      .update({ role_id: roleId })
      .eq('id', id)
      .select('id,email,full_name,role_id,roll_no,department,semester,is_active')
      .maybeSingle();

    if (error) {
      throw error;
    }

    const row = data as UserRow | null;

    if (!row) {
      return null;
    }

    return this.mapUserRow(row);
  }

  async updateUserStatus(id: string, isActive: boolean): Promise<AdminUserProfile | null> {
    const { data, error } = await supabaseServiceClient
      .from('users')
      .update({ is_active: isActive })
      .eq('id', id)
      .select('id,email,full_name,role_id,roll_no,department,semester,is_active')
      .maybeSingle();

    if (error) {
      throw error;
    }

    const row = data as UserRow | null;

    if (!row) {
      return null;
    }

    return this.mapUserRow(row);
  }
}

export const usersRepository = new UsersRepository();
