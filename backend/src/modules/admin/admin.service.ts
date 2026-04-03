import { ForbiddenError } from '../../common/errors/ForbiddenError';
import { usersRepository } from '../users/users.repository';
import { adminRepository } from './admin.repository';
import type {
  AdminDashboardQuery,
  AdminDashboardSummary,
  AdminDownloadPage,
  AdminDownloadsOverviewQuery,
  AdminResourcePage,
  AdminResourcesOverviewQuery
} from './admin.types';

class AdminService {
  private async requireAdmin(userId: string) {
    const currentUser = await usersRepository.findAccessContextById(userId);
    if (!currentUser || !currentUser.isActive || currentUser.role !== 'admin') {
      throw new ForbiddenError('Admin access required');
    }

    return currentUser;
  }

  async getDashboardSummary(userId: string, query: AdminDashboardQuery): Promise<AdminDashboardSummary> {
    await this.requireAdmin(userId);
    return adminRepository.getDashboardSummary(query);
  }

  async listResourcesOverview(userId: string, filters: AdminResourcesOverviewQuery): Promise<AdminResourcePage> {
    await this.requireAdmin(userId);
    return adminRepository.listResourcesOverview(filters);
  }

  async listDownloadsOverview(userId: string, filters: AdminDownloadsOverviewQuery): Promise<AdminDownloadPage> {
    await this.requireAdmin(userId);
    return adminRepository.listDownloadsOverview(filters);
  }

  async logModerationAction(
    userId: string,
    action: string,
    entityType: string,
    entityId: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const currentUser = await this.requireAdmin(userId);
    await adminRepository.logAction({
      actorId: currentUser.id,
      action,
      entityType,
      entityId,
      metadata
    });
  }

  async logUserAction(
    userId: string,
    action: string,
    entityId: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const currentUser = await this.requireAdmin(userId);
    await adminRepository.logAction({
      actorId: currentUser.id,
      action,
      entityType: 'user',
      entityId,
      metadata
    });
  }

  async logSubjectAction(
    userId: string,
    action: string,
    entityId: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const currentUser = await this.requireAdmin(userId);
    await adminRepository.logAction({
      actorId: currentUser.id,
      action,
      entityType: 'subject',
      entityId,
      metadata
    });
  }
}

export const adminService = new AdminService();
