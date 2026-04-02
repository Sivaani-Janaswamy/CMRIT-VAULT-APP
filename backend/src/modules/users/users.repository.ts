import { supabaseServiceClient } from '../../integrations/supabase/client';
import type { UserProfile } from './users.types';

class UsersRepository {
  async findById(id: string): Promise<UserProfile | null> {
    const { data, error } = await supabaseServiceClient
      .from('users')
      .select('id,email,full_name,role')
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
      role: data.role
    };
  }
}

export const usersRepository = new UsersRepository();
