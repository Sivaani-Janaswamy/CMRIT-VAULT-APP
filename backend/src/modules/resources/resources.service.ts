import { randomUUID } from 'node:crypto';

import { AppError } from '../../common/errors/AppError';
import { ForbiddenError } from '../../common/errors/ForbiddenError';
import { NotFoundError } from '../../common/errors/NotFoundError';
import { logDebug } from '../../common/utils/logger';
import { withRetryAndTimeout } from '../../common/utils/retry';
import { env } from '../../config/env';
import { supabaseServiceClient } from '../../integrations/supabase/client';
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
  UploadSession,
  UpdateResourceInput
} from './resources.types';

interface CreatedResourceResult {
  resource: Resource;
  uploadSession: UploadSession;
}

class ResourcesService {
  private static readonly uploadUrlTtlSeconds = 15 * 60;

  private sanitizeFileName(fileName: string): string {
    return fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  }

  private inferMimeType(fileName: string): string {
    const lower = fileName.toLowerCase();
    if (lower.endsWith('.pdf')) return 'application/pdf';
    if (lower.endsWith('.doc')) return 'application/msword';
    if (lower.endsWith('.docx')) {
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    }
    if (lower.endsWith('.png')) return 'image/png';
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
    return 'application/octet-stream';
  }

  private ensureUploadPolicy(input: CreateResourceInput): void {
    if (input.fileSizeBytes <= 0 || input.fileSizeBytes > env.uploadMaxBytes) {
      throw new AppError(400, 'File size is out of allowed range', 'INVALID_FILE_SIZE');
    }

    const inferredMime = this.inferMimeType(input.fileName);
    const mimeCandidate = input.mimeType?.trim() || inferredMime;
    if (!env.allowedUploadMimeTypes.includes(mimeCandidate)) {
      throw new AppError(400, 'File type is not allowed', 'INVALID_FILE_TYPE');
    }
  }

  private async createSignedUploadSession(resourceId: string, uploadPath: string): Promise<UploadSession> {
    if (env.nodeEnv === 'test') {
      return {
        resourceId,
        uploadPath,
        uploadToken: 'test-upload-token',
        signedUploadUrl: `https://example.test/upload/${resourceId}`,
        expiresAt: new Date(Date.now() + (ResourcesService.uploadUrlTtlSeconds * 1000)).toISOString()
      };
    }

    const { data, error } = await withRetryAndTimeout(() =>
      supabaseServiceClient.storage
        .from(env.uploadBucket)
        .createSignedUploadUrl(uploadPath)
    );

    if (error || !data?.token || !data?.signedUrl) {
      throw error ?? new AppError(500, 'Failed to create upload session', 'UPLOAD_SESSION_ERROR');
    }

    return {
      resourceId,
      uploadPath,
      uploadToken: data.token,
      signedUploadUrl: data.signedUrl,
      expiresAt: new Date(Date.now() + (ResourcesService.uploadUrlTtlSeconds * 1000)).toISOString()
    };
  }

  private async verifyUploadedObject(resource: Resource): Promise<{ fileSizeBytes: number; mimeType: string }> {
    if (env.nodeEnv === 'test') {
      return {
        fileSizeBytes: resource.fileSizeBytes,
        mimeType: resource.mimeType
      };
    }

    const parts = resource.filePath.split('/');
    const fileName = parts.pop();
    const directory = parts.join('/');

    if (!fileName || !directory) {
      throw new AppError(400, 'Invalid file path', 'INVALID_FILE_PATH');
    }

    const { data, error } = await withRetryAndTimeout(() =>
      supabaseServiceClient.storage
        .from(env.uploadBucket)
        .list(directory, {
          limit: 1,
          search: fileName
        })
    );

    if (error) {
      throw error;
    }

    const uploaded = (data ?? []).find((item) => item.name === fileName);
    if (!uploaded) {
      throw new AppError(400, 'Uploaded file not found', 'UPLOAD_NOT_FOUND');
    }

    const size = Number((uploaded.metadata as { size?: unknown } | null)?.size ?? 0);
    if (!Number.isFinite(size) || size <= 0 || size > env.uploadMaxBytes) {
      throw new AppError(400, 'Uploaded file size is invalid', 'INVALID_FILE_SIZE');
    }

    const mimeType = this.inferMimeType(fileName);
    if (!env.allowedUploadMimeTypes.includes(mimeType)) {
      throw new AppError(400, 'Uploaded file type is invalid', 'INVALID_FILE_TYPE');
    }

    return {
      fileSizeBytes: Math.trunc(size),
      mimeType
    };
  }

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
    this.ensureUploadPolicy(input);

    const resourceId = randomUUID();
    const sanitizedFileName = this.sanitizeFileName(input.fileName);
    const canonicalPath = `resources/${input.resourceType}/${resourceId}/${sanitizedFileName}`;
    const canonicalMimeType = this.inferMimeType(sanitizedFileName);

    const status: ResourceStatus = 'draft';
    const resource = await resourcesRepository.createResource(
      resourceId,
      {
        ...input,
        fileName: sanitizedFileName,
        filePath: canonicalPath,
        mimeType: canonicalMimeType
      },
      currentUser.id,
      status
    );

    const uploadSession = await this.createSignedUploadSession(resource.id, canonicalPath);

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

    const verified = await this.verifyUploadedObject(resource);
    const synced = await resourcesRepository.updateResource(resourceId, {
      fileSizeBytes: verified.fileSizeBytes,
      mimeType: verified.mimeType
    });
    if (!synced) {
      throw new NotFoundError('Resource not found');
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
