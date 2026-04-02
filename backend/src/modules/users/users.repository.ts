import { supabaseServiceClient } from '../../integrations/supabase/client';
import type { UserProfile } from './users.types';

class UsersRepository {
  private async resolveRoleCode(roleId: number): Promise<string> {
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

    return data.code;
  }

  async findById(id: string): Promise<UserProfile | null> {
    const { data, error } = await supabaseServiceClient
      .from('users')
      .select('id,email,full_name,role_id')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return null;
    }

    return {
      id: data.id,
      email: data.email,
      fullName: data.full_name,
      role: await this.resolveRoleCode(data.role_id)
    };
  }
}

export const usersRepository = new UsersRepository();
