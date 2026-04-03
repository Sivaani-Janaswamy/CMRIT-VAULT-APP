import express from 'express';
import { afterEach, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';

import { errorHandler } from '../src/common/middleware/errorHandler';
import { validateBody, validateParams, validateQuery } from '../src/common/middleware/validate';
import type { AuthenticatedRequest } from '../src/common/types/authenticated-request';
import type { User } from '../src/common/types/user';
import { supabaseServiceClient } from '../src/integrations/supabase/client';
import { resourcesRepository } from '../src/modules/resources/resources.repository';
import type { Resource } from '../src/modules/resources/resources.types';
import { usersRepository } from '../src/modules/users/users.repository';
import {
  createDownloadUrlHandler,
  listAdminDownloadsHandler,
  listMyDownloadsHandler
} from '../src/modules/downloads/downloads.controller';
import {
  createDownloadUrlSchema,
  listAdminDownloadsQuerySchema,
  listMyDownloadsQuerySchema,
  resourceIdParamSchema
} from '../src/modules/downloads/downloads.schemas';
import { downloadsRepository } from '../src/modules/downloads/downloads.repository';

type RepoStubs = {
  findById: typeof resourcesRepository.findById;
  createDownloadRecord: typeof downloadsRepository.createDownloadRecord;
  listOwnDownloads: typeof downloadsRepository.listOwnDownloads;
  listAdminDownloads: typeof downloadsRepository.listAdminDownloads;
  findAccessContextById: typeof usersRepository.findAccessContextById;
};

const originalRepoMethods: RepoStubs = {
  findById: resourcesRepository.findById.bind(resourcesRepository),
  createDownloadRecord: downloadsRepository.createDownloadRecord.bind(downloadsRepository),
  listOwnDownloads: downloadsRepository.listOwnDownloads.bind(downloadsRepository),
  listAdminDownloads: downloadsRepository.listAdminDownloads.bind(downloadsRepository),
  findAccessContextById: usersRepository.findAccessContextById.bind(usersRepository)
};

const storageClient = supabaseServiceClient.storage as unknown as {
  from: typeof supabaseServiceClient.storage.from;
};

const originalStorageFrom = storageClient.from.bind(storageClient);

function restoreRepositoryMocks() {
  resourcesRepository.findById = originalRepoMethods.findById;
  downloadsRepository.createDownloadRecord = originalRepoMethods.createDownloadRecord;
  downloadsRepository.listOwnDownloads = originalRepoMethods.listOwnDownloads;
  downloadsRepository.listAdminDownloads = originalRepoMethods.listAdminDownloads;
  usersRepository.findAccessContextById = originalRepoMethods.findAccessContextById;
  storageClient.from = originalStorageFrom;
}

beforeEach(() => {
  restoreRepositoryMocks();
});

afterEach(() => {
  restoreRepositoryMocks();
});

function attachUser(user: User) {
  return (req: express.Request, _res: express.Response, next: express.NextFunction): void => {
    (req as AuthenticatedRequest).user = user;
    next();
  };
}

function createApp(user: User) {
  const app = express();
  app.use(express.json());

  app.post(
    '/v1/resources/:id/download-url',
    attachUser(user),
    validateParams(resourceIdParamSchema),
    validateBody(createDownloadUrlSchema),
    createDownloadUrlHandler
  );

  app.get(
    '/v1/downloads/me',
    attachUser(user),
    validateQuery(listMyDownloadsQuerySchema),
    listMyDownloadsHandler
  );

  app.get(
    '/v1/admin/downloads',
    attachUser(user),
    validateQuery(listAdminDownloadsQuerySchema),
    listAdminDownloadsHandler
  );

  app.use(errorHandler);
  return app;
}

async function request(
  baseUrl: string,
  path: string,
  options: {
    method?: string;
    body?: unknown;
  } = {}
) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });

  const text = await response.text();
  const json = text ? JSON.parse(text) : null;
  return { response, json };
}

async function withServer<T>(app: express.Express, handler: (baseUrl: string) => Promise<T>) {
  const server = app.listen(0);
  await new Promise<void>((resolve) => {
    server.once('listening', () => resolve());
  });

  try {
    const address = server.address();
    if (!address || typeof address === 'string') {
      throw new Error('Failed to start test server');
    }

    return await handler(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  }
}

const resourceId = '44444444-4444-4444-4444-444444444444';
const subjectId = '33333333-3333-3333-3333-333333333333';

function baseResource(overrides: Partial<Resource> = {}): Resource {
  return {
    id: resourceId,
    subjectId,
    uploadedBy: '55555555-5555-5555-5555-555555555555',
    title: 'DBMS Notes',
    description: 'Unit 1 notes',
    resourceType: 'note',
    academicYear: '2025-2026',
    semester: 5,
    fileName: 'dbms.pdf',
    filePath: 'resources/note/44444444-4444-4444-4444-444444444444/dbms.pdf',
    fileSizeBytes: 1024,
    mimeType: 'application/pdf',
    status: 'published',
    downloadCount: 0,
    publishedAt: '2026-04-02T00:00:00.000Z',
    createdAt: '2026-04-02T00:00:00.000Z',
    updatedAt: '2026-04-02T00:00:00.000Z',
    ...overrides
  };
}

test('POST /v1/resources/:id/download-url returns a signed URL and audit record for student users', async () => {
  const student: User = {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'student@example.com',
    fullName: 'Student',
    role: 'student'
  };

  usersRepository.findAccessContextById = async () => ({
    id: student.id,
    role: 'student',
    isActive: true
  });
  resourcesRepository.findById = async () => baseResource({ status: 'published', uploadedBy: 'other-user' });
  let auditInput: unknown = null;
  downloadsRepository.createDownloadRecord = async (input) => {
    auditInput = input;
    return {
      id: '77777777-7777-7777-7777-777777777777',
      resourceId: input.resourceId,
      userId: input.userId,
      resourceTitle: input.resourceTitle,
      source: input.source,
      ipHash: input.ipHash ?? null,
      userAgent: input.userAgent ?? null,
      downloadedAt: '2026-04-02T00:00:00.000Z'
    };
  };
  storageClient.from = (() => ({
    createSignedUrl: async () => ({
      data: { signedUrl: 'https://signed.example/download' },
      error: null
    })
  })) as typeof storageClient.from;

  await withServer(createApp(student), async (baseUrl) => {
    const { response, json } = await request(baseUrl, `/v1/resources/${resourceId}/download-url`, {
      method: 'POST',
      body: {
        source: 'web'
      }
    });

    assert.equal(response.status, 200);
    assert.equal(json.success, true);
    assert.equal(json.data.downloadUrl, 'https://signed.example/download');
    assert.equal(typeof json.data.expiresAt, 'string');
    assert.ok(auditInput);
    assert.equal((auditInput as { resourceTitle: string }).resourceTitle, 'DBMS Notes');
    assert.equal((auditInput as { source: string }).source, 'web');
  });
});

test('POST /v1/resources/:id/download-url allows faculty owners on non-published resources', async () => {
  const faculty: User = {
    id: '22222222-2222-2222-2222-222222222222',
    email: 'faculty@example.com',
    fullName: 'Faculty',
    role: 'faculty'
  };

  usersRepository.findAccessContextById = async () => ({
    id: faculty.id,
    role: 'faculty',
    isActive: true
  });
  resourcesRepository.findById = async () => baseResource({ status: 'draft', uploadedBy: faculty.id });
  downloadsRepository.createDownloadRecord = async (input) => ({
    id: '77777777-7777-7777-7777-777777777777',
    resourceId: input.resourceId,
    userId: input.userId,
    resourceTitle: input.resourceTitle,
    source: input.source,
    ipHash: input.ipHash ?? null,
    userAgent: input.userAgent ?? null,
    downloadedAt: '2026-04-02T00:00:00.000Z'
  });
  storageClient.from = (() => ({
    createSignedUrl: async () => ({
      data: { signedUrl: 'https://signed.example/faculty' },
      error: null
    })
  })) as typeof storageClient.from;

  await withServer(createApp(faculty), async (baseUrl) => {
    const { response, json } = await request(baseUrl, `/v1/resources/${resourceId}/download-url`, {
      method: 'POST'
    });

    assert.equal(response.status, 200);
    assert.equal(json.success, true);
    assert.equal(json.data.downloadUrl, 'https://signed.example/faculty');
  });
});

test('POST /v1/resources/:id/download-url returns 404 for non-visible resources', async () => {
  const student: User = {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'student@example.com',
    fullName: 'Student',
    role: 'student'
  };

  usersRepository.findAccessContextById = async () => ({
    id: student.id,
    role: 'student',
    isActive: true
  });
  resourcesRepository.findById = async () => baseResource({ status: 'draft', uploadedBy: 'other-user' });

  await withServer(createApp(student), async (baseUrl) => {
    const { response, json } = await request(baseUrl, `/v1/resources/${resourceId}/download-url`, {
      method: 'POST'
    });

    assert.equal(response.status, 404);
    assert.equal(json.success, false);
    assert.equal(json.error.code, 'NOT_FOUND');
  });
});

test('POST /v1/resources/:id/download-url rejects invalid UUIDs', async () => {
  const student: User = {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'student@example.com',
    fullName: 'Student',
    role: 'student'
  };

  await withServer(createApp(student), async (baseUrl) => {
    const { response, json } = await request(baseUrl, '/v1/resources/not-a-uuid/download-url', {
      method: 'POST'
    });

    assert.equal(response.status, 422);
    assert.equal(json.success, false);
    assert.equal(json.error.code, 'VALIDATION_ERROR');
  });
});

test('GET /v1/downloads/me returns only the caller records with filters', async () => {
  const student: User = {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'student@example.com',
    fullName: 'Student',
    role: 'student'
  };

  usersRepository.findAccessContextById = async () => ({
    id: student.id,
    role: 'student',
    isActive: true
  });

  let capturedUserId = '';
  let capturedQuery: any = null;
  downloadsRepository.listOwnDownloads = async (userId, query) => {
    capturedUserId = userId;
    capturedQuery = query;
    return {
      items: [
        {
          id: 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          resourceId,
          userId: student.id,
          resourceTitle: 'DBMS Notes',
          source: 'mobile',
          ipHash: null,
          userAgent: null,
          downloadedAt: '2026-04-02T00:00:00.000Z',
          resourceType: 'note',
          subjectId
        }
      ],
      page: 2,
      pageSize: 5,
      total: 1
    };
  };

  await withServer(createApp(student), async (baseUrl) => {
    const { response, json } = await request(
      baseUrl,
      `/v1/downloads/me?page=2&pageSize=5&resourceType=note&subjectId=${subjectId}&startDate=2026-04-01T00:00:00.000Z&endDate=2026-04-02T00:00:00.000Z`
    );

    assert.equal(response.status, 200);
    assert.equal(json.success, true);
    assert.equal(json.data.items.length, 1);
    assert.equal(json.data.pageInfo.page, 2);
    assert.equal(json.data.pageInfo.pageSize, 5);
    assert.equal(json.data.pageInfo.total, 1);
    assert.equal(capturedUserId, student.id);
    assert.equal(capturedQuery.resourceType, 'note');
    assert.equal(capturedQuery.subjectId, subjectId);
  });
});

test('GET /v1/admin/downloads returns audit downloads for admin users', async () => {
  const admin: User = {
    id: '33333333-3333-3333-3333-333333333333',
    email: 'admin@example.com',
    fullName: 'Admin',
    role: 'admin'
  };

  usersRepository.findAccessContextById = async () => ({
    id: admin.id,
    role: 'admin',
    isActive: true
  });

  let capturedQuery: any = null;
  downloadsRepository.listAdminDownloads = async (query) => {
    capturedQuery = query;
    return {
      items: [
        {
          id: 'aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          resourceId,
          userId: '11111111-1111-1111-1111-111111111111',
          resourceTitle: 'DBMS Notes',
          source: 'web',
          ipHash: null,
          userAgent: null,
          downloadedAt: '2026-04-02T00:00:00.000Z',
          resourceType: 'note',
          subjectId
        }
      ],
      page: 1,
      pageSize: 20,
      total: 1
    };
  };

  await withServer(createApp(admin), async (baseUrl) => {
    const { response, json } = await request(
      baseUrl,
      `/v1/admin/downloads?page=1&pageSize=20&userId=11111111-1111-1111-1111-111111111111&resourceId=${resourceId}&startDate=2026-04-01T00:00:00.000Z&endDate=2026-04-02T00:00:00.000Z`
    );

    assert.equal(response.status, 200);
    assert.equal(json.success, true);
    assert.equal(json.data.items.length, 1);
    assert.equal(json.data.pageInfo.total, 1);
    assert.equal(capturedQuery.userId, '11111111-1111-1111-1111-111111111111');
    assert.equal(capturedQuery.resourceId, resourceId);
  });
});

test('GET /v1/admin/downloads forbids non-admin users', async () => {
  const faculty: User = {
    id: '22222222-2222-2222-2222-222222222222',
    email: 'faculty@example.com',
    fullName: 'Faculty',
    role: 'faculty'
  };

  usersRepository.findAccessContextById = async () => ({
    id: faculty.id,
    role: 'faculty',
    isActive: true
  });

  await withServer(createApp(faculty), async (baseUrl) => {
    const { response, json } = await request(baseUrl, '/v1/admin/downloads?page=1&pageSize=20');

    assert.equal(response.status, 403);
    assert.equal(json.success, false);
    assert.equal(json.error.code, 'FORBIDDEN');
  });
});

