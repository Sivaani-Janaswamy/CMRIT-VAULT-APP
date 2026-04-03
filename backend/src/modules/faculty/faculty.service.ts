import { ForbiddenError } from '../../common/errors/ForbiddenError';
import { NotFoundError } from '../../common/errors/NotFoundError';
import { usersRepository } from '../users/users.repository';
import { facultyRepository } from './faculty.repository';
import type {
  FacultyDashboardQuery,
  FacultyDashboardSummary,
  FacultyResourcePage,
  FacultyResourceStats,
  FacultyResourcesQuery
} from './faculty.types';

class FacultyService {
  private async requireFacultyAccess(userId: string) {
    const currentUser = await usersRepository.findAccessContextById(userId);
    if (!currentUser || !currentUser.isActive || currentUser.role === 'student') {
      throw new ForbiddenError('Faculty access required');
    }

    return currentUser;
  }

  private buildScope(userId: string, role: 'faculty' | 'admin') {
    return {
      userId,
      role
    } as const;
  }

  async getDashboardSummary(userId: string, query: FacultyDashboardQuery): Promise<FacultyDashboardSummary> {
    const currentUser = await this.requireFacultyAccess(userId);
    const scopeRole = currentUser.role === 'admin' ? 'admin' : 'faculty';
    return facultyRepository.getDashboardSummary(this.buildScope(currentUser.id, scopeRole), query.period);
  }

  async listResources(userId: string, query: FacultyResourcesQuery): Promise<FacultyResourcePage> {
    const currentUser = await this.requireFacultyAccess(userId);
    const scopeRole = currentUser.role === 'admin' ? 'admin' : 'faculty';
    return facultyRepository.listResources(this.buildScope(currentUser.id, scopeRole), query);
  }

  async getResourceStats(userId: string, resourceId: string): Promise<FacultyResourceStats> {
    const currentUser = await this.requireFacultyAccess(userId);
    const resource = await facultyRepository.findResourceById(resourceId);
    if (!resource) {
      throw new NotFoundError('Resource not found');
    }

    if (currentUser.role !== 'admin' && resource.uploadedBy !== currentUser.id) {
      throw new NotFoundError('Resource not found');
    }

    const downloads = await facultyRepository.getResourceDownloadMetricsById(resourceId);
    return {
      resource: {
        ...resource,
        downloadCount: downloads.total
      },
      downloads
    };
  }
}

export const facultyService = new FacultyService();
