import { authRepository } from './auth.repository';
import type { User } from '../../common/types/user';
import type { UserProfile } from '../users/users.types';

class AuthService {
  async syncCurrentUser(user: User): Promise<UserProfile> {
    return authRepository.upsertFromAuthUser(user);
  }
}

export const authService = new AuthService();
