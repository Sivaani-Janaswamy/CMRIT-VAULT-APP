import { supabaseServiceClient } from '../../integrations/supabase/client';
import type { User } from '../../common/types/user';
import type { RoleCode, UserProfile } from '../users/users.types';
import { logDebug } from '../../common/utils/logger';

class AuthRepository {
  private async resolveRoleId(roleCode: string): Promise<number> {
    const { data, error } = await supabaseServiceClient
      .from('roles')
      .select('id')
      .eq('code', roleCode)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      const { data: fallbackRole, error: fallbackError } = await supabaseServiceClient
        .from('roles')
        .select('id')
        .eq('code', 'student')
        .maybeSingle();

      if (fallbackError) {
        throw fallbackError;
      }

      if (!fallbackRole) {
        throw new Error(`Role not found: ${roleCode}`);
      }

      return fallbackRole.id;
    }

    return data.id;
  }

  private isRoleCode(value: string): value is RoleCode {
    return value === 'student' || value === 'faculty' || value === 'admin';
  }

  private async resolveRoleCode(roleId: number): Promise<RoleCode> {
    const { data, error } = await supabaseServiceClient
      .from('roles')
      .select('code')
      .eq('id', roleId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return 'student';
    }

    return this.isRoleCode(data.code) ? data.code : 'student';
  }

  async upsertFromAuthUser(user: User): Promise<UserProfile> {
    const { data: existingUser, error: existingError } = await supabaseServiceClient
      .from('users')
      .select('role_id,full_name')
      .eq('id', user.id)
      .maybeSingle();

    if (existingError) {
      logDebug('AuthRepository.upsertFromAuthUser: lookup failed', {
        userId: user.id,
        error: existingError.message
      });
      throw existingError;
    }

    const payload = {
      id: user.id,
      email: user.email,
      full_name: user.fullName || existingUser?.full_name || user.email.split('@')[0],
      role_id:
        existingUser?.role_id ?? (await this.resolveRoleId('student'))
    };

    const { data, error } = await supabaseServiceClient
      .from('users')
      .upsert(payload, { onConflict: 'id' })
      .select('id,email,full_name,role_id')
      .single();

    if (error) {
      logDebug('AuthRepository.upsertFromAuthUser: upsert failed', {
        userId: user.id,
        error: error.message
      });
      throw error;
    }

    logDebug('AuthRepository.upsertFromAuthUser: upsert succeeded', {
      userId: data.id,
      roleId: data.role_id
    });

    const role = await this.resolveRoleCode(data.role_id);

    return {
      id: data.id,
      email: data.email,
      fullName: data.full_name,
      role
    };
  }
}

export const authRepository = new AuthRepository();
