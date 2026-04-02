import { authRepository } from './auth.repository';
import type { User } from '../../common/types/user';
import type { UserProfile } from '../users/users.types';
import { logDebug } from '../../common/utils/logger';

class AuthService {
  async syncCurrentUser(user: User): Promise<UserProfile> {
    logDebug('AuthService.syncCurrentUser: syncing user', {
      userId: user.id,
      role: user.role
    });
    return authRepository.upsertFromAuthUser(user);
  }
}

export const authService = new AuthService();
