import { AppError } from '../../common/errors/AppError';
import { ForbiddenError } from '../../common/errors/ForbiddenError';
import { NotFoundError } from '../../common/errors/NotFoundError';
import { logDebug } from '../../common/utils/logger';
import { adminRepository } from '../admin/admin.repository';
import { searchService } from '../search/search.service';
import { subjectsRepository } from '../subjects/subjects.repository';
import { usersRepository } from '../users/users.repository';
import { resourcesRepository } from './resources.repository';
import { canViewResource } from './resources.utils';
import type {
  CreateResourceInput,
  Resource,
  ResourceListQuery,
  ResourcePage,
  ResourceStatus,
  UpdateResourceInput
} from './resources.types';

interface UploadSession {
  resourceId: string;
  uploadPath: string;
  expiresAt: string;
}

interface CreatedResourceResult {
  resource: Resource;
  uploadSession: UploadSession;
}

class ResourcesService {
  private async syncSearchIndex(resourceId: string, action: string): Promise<void> {
    try {
      await searchService.syncResourceIndex(resourceId);
      logDebug('Search index sync success', { resourceId, action });
    } catch (error) {
      // Search is a read model; primary resource writes should remain available.
      logDebug('Search index sync skipped', {
        resourceId,
        action,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  private async requireAccess(userId: string) {
    const currentUser = await usersRepository.findAccessContextById(userId);
    if (!currentUser || !currentUser.isActive) {
      throw new ForbiddenError('Access required');
    }

    return currentUser;
  }

  private canModifyResource(
    resource: Resource,
    userId: string,
    role: 'student' | 'faculty' | 'admin'
  ): boolean {
    if (role === 'admin') {
      return true;
    }

    return role === 'faculty' && resource.uploadedBy === userId && resource.status !== 'archived';
  }

  private async ensureActiveSubject(subjectId: string): Promise<void> {
    const subject = await subjectsRepository.findById(subjectId);
    if (!subject) {
      throw new NotFoundError('Subject not found');
    }
  }

  async listResources(userId: string, filters: ResourceListQuery): Promise<ResourcePage> {
    const currentUser = await this.requireAccess(userId);
    return resourcesRepository.listResources(filters, currentUser.role, currentUser.id);
  }

  async getResource(userId: string, resourceId: string): Promise<Resource> {
    const currentUser = await this.requireAccess(userId);
    const resource = await resourcesRepository.findById(resourceId);
    if (!resource) {
      throw new NotFoundError('Resource not found');
    }

    if (!canViewResource(currentUser.role, { status: resource.status, ownerId: resource.uploadedBy }, currentUser.id)) {
      throw new NotFoundError('Resource not found');
    }

    return resource;
  }

  async createResource(userId: string, input: CreateResourceInput): Promise<CreatedResourceResult> {
    const currentUser = await this.requireAccess(userId);
    if (currentUser.role === 'student') {
      throw new ForbiddenError('Faculty or admin access required');
    }

    await this.ensureActiveSubject(input.subjectId);
    const status: ResourceStatus = 'draft';
    const resource = await resourcesRepository.createResource(input, currentUser.id, status);
    const uploadSession: UploadSession = {
      resourceId: resource.id,
      uploadPath: resource.filePath,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
    };

    await this.syncSearchIndex(resource.id, 'resource.create');

    return {
      resource,
      uploadSession
    };
  }

  async updateResource(userId: string, resourceId: string, input: UpdateResourceInput): Promise<Resource> {
    const currentUser = await this.requireAccess(userId);
    const resource = await resourcesRepository.findById(resourceId);
    if (!resource) {
      throw new NotFoundError('Resource not found');
    }

    if (!this.canModifyResource(resource, currentUser.id, currentUser.role)) {
      throw new ForbiddenError('Resource update not allowed');
    }

    if (input.subjectId) {
      await this.ensureActiveSubject(input.subjectId);
    }

    const updated = await resourcesRepository.updateResource(resourceId, input);
    if (!updated) {
      throw new NotFoundError('Resource not found');
    }

    await this.syncSearchIndex(updated.id, 'resource.update');

    return updated;
  }

  async completeResource(userId: string, resourceId: string): Promise<Resource> {
    const currentUser = await this.requireAccess(userId);
    const resource = await resourcesRepository.findById(resourceId);
    if (!resource) {
      throw new NotFoundError('Resource not found');
    }

    if (!this.canModifyResource(resource, currentUser.id, currentUser.role)) {
      throw new ForbiddenError('Resource completion not allowed');
    }

    const updated = await resourcesRepository.updateResourceStatus(resourceId, 'draft');
    if (!updated) {
      throw new NotFoundError('Resource not found');
    }

    await this.syncSearchIndex(updated.id, 'resource.complete');

    return updated;
  }

  async submitResource(userId: string, resourceId: string): Promise<Resource> {
    const currentUser = await this.requireAccess(userId);
    const resource = await resourcesRepository.findById(resourceId);
    if (!resource) {
      throw new NotFoundError('Resource not found');
    }

    if (!this.canModifyResource(resource, currentUser.id, currentUser.role)) {
      throw new ForbiddenError('Resource submission not allowed');
    }

    const updated = await resourcesRepository.updateResourceStatus(resourceId, 'pending_review');
    if (!updated) {
      throw new NotFoundError('Resource not found');
    }

    await this.syncSearchIndex(updated.id, 'resource.submit');

    return updated;
  }

  async archiveResource(userId: string, resourceId: string): Promise<Resource> {
    const currentUser = await this.requireAccess(userId);
    const resource = await resourcesRepository.findById(resourceId);
    if (!resource) {
      throw new NotFoundError('Resource not found');
    }

    if (!this.canModifyResource(resource, currentUser.id, currentUser.role)) {
      throw new ForbiddenError('Resource archive not allowed');
    }

    const updated = await resourcesRepository.archiveResource(resourceId);
    if (!updated) {
      throw new NotFoundError('Resource not found');
    }

    await this.syncSearchIndex(updated.id, 'resource.archive');

    return updated;
  }

  async updateResourceStatus(
    userId: string,
    resourceId: string,
    status: 'published' | 'rejected'
  ): Promise<Resource> {
    const currentUser = await this.requireAccess(userId);
    if (currentUser.role !== 'admin') {
      throw new ForbiddenError('Admin access required');
    }

    const resource = await resourcesRepository.findById(resourceId);
    if (!resource) {
      throw new NotFoundError('Resource not found');
    }

    if (resource.status !== 'pending_review') {
      throw new AppError(400, 'Invalid status transition', 'INVALID_STATUS_TRANSITION');
    }

    const updated = await resourcesRepository.updateStatus(resourceId, status);
    if (!updated) {
      throw new NotFoundError('Resource not found');
    }

    await adminRepository.logAction({
      actorId: userId,
      action: 'admin.resource.status.updated',
      entityType: 'resource',
      entityId: resourceId,
      metadata: {
        fromStatus: resource.status,
        toStatus: status
      }
    });

    await this.syncSearchIndex(updated.id, 'admin.resource.status.update');

    return updated;
  }
}

export const resourcesService = new ResourcesService();
