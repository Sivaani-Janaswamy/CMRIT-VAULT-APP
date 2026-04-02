import { supabaseServiceClient } from '../../integrations/supabase/client';
import type { User } from '../../common/types/user';
import type { UserProfile } from '../users/users.types';

class AuthRepository {
  async upsertFromAuthUser(user: User): Promise<UserProfile> {
    const payload = {
      id: user.id,
      email: user.email,
      full_name: user.fullName || user.email.split('@')[0],
      role: user.role || 'student'
    };

    const { data, error } = await supabaseServiceClient
      .from('users')
      .upsert(payload, { onConflict: 'id' })
      .select('id,email,full_name,role')
      .single();

    if (error) {
      throw error;
    }

    return {
      id: data.id,
      email: data.email,
      fullName: data.full_name,
      role: data.role
    };
  }
}

export const authRepository = new AuthRepository();
