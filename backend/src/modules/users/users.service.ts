import { NotFoundError } from '../../common/errors/NotFoundError';
import { usersRepository } from './users.repository';
import type { UserProfile } from './users.types';

class UsersService {
  async getCurrentUser(userId: string): Promise<UserProfile> {
    const user = await usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User profile not found');
    }

    return user;
  }
}

export const usersService = new UsersService();
