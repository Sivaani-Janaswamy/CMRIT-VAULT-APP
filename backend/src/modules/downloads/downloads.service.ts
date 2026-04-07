import { ForbiddenError } from '../../common/errors/ForbiddenError';
import { NotFoundError } from '../../common/errors/NotFoundError';
import { withRetryAndTimeout } from '../../common/utils/retry';
import { supabaseServiceClient } from '../../integrations/supabase/client';
import { resourcesRepository } from '../resources/resources.repository';
import { canViewResource } from '../resources/resources.utils';
import { usersRepository } from '../users/users.repository';
import { downloadsRepository } from './downloads.repository';
import type {
  AdminDownloadsQuery,
  CreateDownloadUrlInput,
  DownloadPage,
  DownloadUrlResult,
  MyDownloadsQuery
} from './downloads.types';

const DOWNLOAD_BUCKET = 'cmrit-vault-files';

class DownloadsService {
  private async requireAccess(userId: string) {
    const currentUser = await usersRepository.findAccessContextById(userId);
    if (!currentUser || !currentUser.isActive) {
      throw new ForbiddenError('Access required');
    }

    return currentUser;
  }

  async createDownloadUrl(
    userId: string,
    resourceId: string,
    input: CreateDownloadUrlInput
  ): Promise<DownloadUrlResult> {
    const currentUser = await this.requireAccess(userId);
    const resource = await resourcesRepository.findById(resourceId);
    if (!resource) {
      throw new NotFoundError('Resource not found');
    }

    if (!canViewResource(currentUser.role, { status: resource.status, ownerId: resource.uploadedBy }, currentUser.id)) {
      throw new NotFoundError('Resource not found');
    }

    const { data, error } = await withRetryAndTimeout(() =>
      supabaseServiceClient.storage
        .from(DOWNLOAD_BUCKET)
        .createSignedUrl(resource.filePath, 15 * 60)
    );

    if (error || !data?.signedUrl) {
      throw error ?? new Error('Failed to create signed download URL');
    }

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    await downloadsRepository.createDownloadRecord({
      resourceId: resource.id,
      userId: currentUser.id,
      resourceTitle: resource.title,
      source: input.source,
      ipHash: input.ipHash ?? null,
      userAgent: input.userAgent ?? null
    });

    return {
      downloadUrl: data.signedUrl,
      expiresAt
    };
  }

  async listMyDownloads(userId: string, query: MyDownloadsQuery): Promise<DownloadPage> {
    const currentUser = await this.requireAccess(userId);
    return downloadsRepository.listOwnDownloads(currentUser.id, query);
  }

  async listAdminDownloads(userId: string, query: AdminDownloadsQuery): Promise<DownloadPage> {
    const currentUser = await this.requireAccess(userId);
    if (currentUser.role !== 'admin') {
      throw new ForbiddenError('Admin access required');
    }

    return downloadsRepository.listAdminDownloads(query);
  }
}

export const downloadsService = new DownloadsService();
