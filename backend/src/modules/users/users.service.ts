import { ForbiddenError } from '../../common/errors/ForbiddenError';
import { NotFoundError } from '../../common/errors/NotFoundError';
import type {
  AdminUsersPage,
  AdminUsersQuery,
  RoleCode,
  UpdateOwnUserInput,
  UserProfile
} from './users.types';
import { usersRepository } from './users.repository';

class UsersService {
  async getCurrentUser(userId: string): Promise<UserProfile> {
    const user = await usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User profile not found');
    }

    return user;
  }

  async updateCurrentUser(userId: string, input: UpdateOwnUserInput): Promise<UserProfile> {
    const user = await usersRepository.updateOwnProfile(userId, input);
    if (!user) {
      throw new NotFoundError('User profile not found');
    }

    return user;
  }

  private async requireAdmin(userId: string): Promise<void> {
    const currentUser = await usersRepository.findAccessContextById(userId);
    if (!currentUser || !currentUser.isActive || currentUser.role !== 'admin') {
      throw new ForbiddenError('Admin access required');
    }
  }

  async listAdminUsers(userId: string, filters: AdminUsersQuery): Promise<AdminUsersPage> {
    await this.requireAdmin(userId);
    return usersRepository.listUsers(filters);
  }

  async getAdminUser(userId: string, targetUserId: string) {
    await this.requireAdmin(userId);
    const user = await usersRepository.findAdminUserById(targetUserId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  async updateAdminUserRole(
    userId: string,
    targetUserId: string,
    role: RoleCode
  ) {
    await this.requireAdmin(userId);
    const user = await usersRepository.updateUserRole(targetUserId, role);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  async updateAdminUserStatus(
    userId: string,
    targetUserId: string,
    isActive: boolean
  ) {
    await this.requireAdmin(userId);
    const user = await usersRepository.updateUserStatus(targetUserId, isActive);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }
}

export const usersService = new UsersService();
