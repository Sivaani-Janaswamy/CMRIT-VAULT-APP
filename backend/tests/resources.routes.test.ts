import express from 'express';
import { afterEach, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';

import { errorHandler } from '../src/common/middleware/errorHandler';
import { validateBody, validateParams, validateQuery } from '../src/common/middleware/validate';
import type { AuthenticatedRequest } from '../src/common/types/authenticated-request';
import type { User } from '../src/common/types/user';
import {
  archiveResourceHandler,
  completeResourceHandler,
  createResourceHandler,
  getResourceHandler,
  listResourcesHandler,
  submitResourceHandler,
  updateResourceStatusHandler,
  updateResourceHandler
} from '../src/modules/resources/resources.controller';
import {
  createResourceSchema,
  listResourcesQuerySchema,
  resourceIdParamSchema,
  updateResourceStatusSchema,
  updateResourceSchema
} from '../src/modules/resources/resources.schemas';
import { resourcesRepository } from '../src/modules/resources/resources.repository';
import { subjectsRepository } from '../src/modules/subjects/subjects.repository';
import { usersRepository } from '../src/modules/users/users.repository';
import type { Resource } from '../src/modules/resources/resources.types';

type RepoStubs = {
  listResources: typeof resourcesRepository.listResources;
  findById: typeof resourcesRepository.findById;
  createResource: typeof resourcesRepository.createResource;
  updateResource: typeof resourcesRepository.updateResource;
  updateResourceStatus: typeof resourcesRepository.updateResourceStatus;
  updateStatus: typeof resourcesRepository.updateStatus;
  archiveResource: typeof resourcesRepository.archiveResource;
  findAccessContextById: typeof usersRepository.findAccessContextById;
  findSubjectById: typeof subjectsRepository.findById;
};

const originalRepoMethods: RepoStubs = {
  listResources: resourcesRepository.listResources.bind(resourcesRepository),
  findById: resourcesRepository.findById.bind(resourcesRepository),
  createResource: resourcesRepository.createResource.bind(resourcesRepository),
  updateResource: resourcesRepository.updateResource.bind(resourcesRepository),
  updateResourceStatus: resourcesRepository.updateResourceStatus.bind(resourcesRepository),
  updateStatus: resourcesRepository.updateStatus.bind(resourcesRepository),
  archiveResource: resourcesRepository.archiveResource.bind(resourcesRepository),
  findAccessContextById: usersRepository.findAccessContextById.bind(usersRepository),
  findSubjectById: subjectsRepository.findById.bind(subjectsRepository)
};

function restoreRepositoryMocks() {
  resourcesRepository.listResources = originalRepoMethods.listResources;
  resourcesRepository.findById = originalRepoMethods.findById;
  resourcesRepository.createResource = originalRepoMethods.createResource;
  resourcesRepository.updateResource = originalRepoMethods.updateResource;
  resourcesRepository.updateResourceStatus = originalRepoMethods.updateResourceStatus;
  resourcesRepository.updateStatus = originalRepoMethods.updateStatus;
  resourcesRepository.archiveResource = originalRepoMethods.archiveResource;
  usersRepository.findAccessContextById = originalRepoMethods.findAccessContextById;
  subjectsRepository.findById = originalRepoMethods.findSubjectById;
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

  app.get('/v1/resources', attachUser(user), validateQuery(listResourcesQuerySchema), listResourcesHandler);
  app.get('/v1/resources/:id', attachUser(user), validateParams(resourceIdParamSchema), getResourceHandler);
  app.post('/v1/resources', attachUser(user), validateBody(createResourceSchema), createResourceHandler);
  app.patch(
    '/v1/resources/:id',
    attachUser(user),
    validateParams(resourceIdParamSchema),
    validateBody(updateResourceSchema),
    updateResourceHandler
  );
  app.post(
    '/v1/resources/:id/complete',
    attachUser(user),
    validateParams(resourceIdParamSchema),
    completeResourceHandler
  );
  app.post(
    '/v1/resources/:id/submit',
    attachUser(user),
    validateParams(resourceIdParamSchema),
    submitResourceHandler
  );
  app.delete('/v1/resources/:id', attachUser(user), validateParams(resourceIdParamSchema), archiveResourceHandler);
  app.patch(
    '/v1/admin/resources/:id/status',
    attachUser(user),
    validateParams(resourceIdParamSchema),
    validateBody(updateResourceStatusSchema),
    updateResourceStatusHandler
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

const subjectId = '33333333-3333-3333-3333-333333333333';
const resourceId = '44444444-4444-4444-4444-444444444444';

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
    status: 'draft',
    downloadCount: 0,
    publishedAt: null,
    createdAt: '2026-04-02T00:00:00.000Z',
    updatedAt: '2026-04-02T00:00:00.000Z',
    ...overrides
  };
}

test('GET /v1/resources returns list visibility for student users', async () => {
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
  resourcesRepository.listResources = async (_filters, role) => {
    assert.equal(role, 'student');
    return {
      items: [baseResource({ status: 'published' })],
      page: 1,
      pageSize: 20,
      total: 1
    };
  };

  await withServer(createApp(student), async (baseUrl) => {
    const { response, json } = await request(baseUrl, '/v1/resources');
    assert.equal(response.status, 200);
    assert.equal(json.success, true);
    assert.equal(json.data.items.length, 1);
    assert.equal(json.data.pageInfo.total, 1);
  });
});

test('GET /v1/resources returns list visibility for faculty users', async () => {
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
  resourcesRepository.listResources = async (_filters, role) => {
    assert.equal(role, 'faculty');
    return {
      items: [baseResource({ status: 'draft', uploadedBy: faculty.id })],
      page: 1,
      pageSize: 20,
      total: 1
    };
  };

  await withServer(createApp(faculty), async (baseUrl) => {
    const { response, json } = await request(baseUrl, '/v1/resources');
    assert.equal(response.status, 200);
    assert.equal(json.success, true);
    assert.equal(json.data.items.length, 1);
  });
});

test('GET /v1/resources returns list visibility for admin users', async () => {
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
  resourcesRepository.listResources = async (_filters, role) => {
    assert.equal(role, 'admin');
    return {
      items: [baseResource({ status: 'archived' })],
      page: 1,
      pageSize: 20,
      total: 1
    };
  };

  await withServer(createApp(admin), async (baseUrl) => {
    const { response, json } = await request(baseUrl, '/v1/resources');
    assert.equal(response.status, 200);
    assert.equal(json.success, true);
    assert.equal(json.data.items.length, 1);
  });
});

test('GET /v1/resources/:id rejects invalid UUIDs', async () => {
  const student: User = {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'student@example.com',
    fullName: 'Student',
    role: 'student'
  };

  await withServer(createApp(student), async (baseUrl) => {
    const { response, json } = await request(baseUrl, '/v1/resources/not-a-uuid');
    assert.equal(response.status, 422);
    assert.equal(json.success, false);
    assert.equal(json.error.code, 'VALIDATION_ERROR');
  });
});

test('GET /v1/resources/:id returns 404 when missing', async () => {
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
  resourcesRepository.findById = async () => null;

  await withServer(createApp(student), async (baseUrl) => {
    const { response, json } = await request(baseUrl, `/v1/resources/${resourceId}`);
    assert.equal(response.status, 404);
    assert.equal(json.success, false);
    assert.equal(json.error.code, 'NOT_FOUND');
  });
});

test('GET /v1/resources/:id returns resource for published content', async () => {
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
  resourcesRepository.findById = async () => baseResource({ status: 'published' });

  await withServer(createApp(student), async (baseUrl) => {
    const { response, json } = await request(baseUrl, `/v1/resources/${resourceId}`);
    assert.equal(response.status, 200);
    assert.equal(json.success, true);
    assert.equal(json.data.resource.status, 'published');
  });
});

test('GET /v1/resources/:id blocks student from non-published resources', async () => {
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
  resourcesRepository.findById = async () =>
    baseResource({ status: 'draft', uploadedBy: '99999999-9999-9999-9999-999999999999' });

  await withServer(createApp(student), async (baseUrl) => {
    const { response, json } = await request(baseUrl, `/v1/resources/${resourceId}`);
    assert.equal(response.status, 404);
    assert.equal(json.success, false);
    assert.equal(json.error.code, 'NOT_FOUND');
  });
});

test('GET /v1/resources/:id allows faculty to view own non-published resources', async () => {
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

  const ownStatuses: Array<Resource['status']> = ['draft', 'pending_review', 'rejected'];
  for (const status of ownStatuses) {
    resourcesRepository.findById = async () => baseResource({ status, uploadedBy: faculty.id });

    await withServer(createApp(faculty), async (baseUrl) => {
      const { response, json } = await request(baseUrl, `/v1/resources/${resourceId}`);
      assert.equal(response.status, 200);
      assert.equal(json.success, true);
      assert.equal(json.data.resource.status, status);
    });
  }
});

test('GET /v1/resources/:id blocks faculty from other users non-published resources', async () => {
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
  resourcesRepository.findById = async () =>
    baseResource({ status: 'pending_review', uploadedBy: '99999999-9999-9999-9999-999999999999' });

  await withServer(createApp(faculty), async (baseUrl) => {
    const { response, json } = await request(baseUrl, `/v1/resources/${resourceId}`);
    assert.equal(response.status, 404);
    assert.equal(json.success, false);
    assert.equal(json.error.code, 'NOT_FOUND');
  });
});

test('GET /v1/resources/:id blocks archived resources for student and allows admin', async () => {
  const student: User = {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'student@example.com',
    fullName: 'Student',
    role: 'student'
  };
  const admin: User = {
    id: '33333333-3333-3333-3333-333333333333',
    email: 'admin@example.com',
    fullName: 'Admin',
    role: 'admin'
  };

  resourcesRepository.findById = async () => baseResource({ status: 'archived' });

  usersRepository.findAccessContextById = async () => ({
    id: student.id,
    role: 'student',
    isActive: true
  });
  await withServer(createApp(student), async (baseUrl) => {
    const { response, json } = await request(baseUrl, `/v1/resources/${resourceId}`);
    assert.equal(response.status, 404);
    assert.equal(json.success, false);
    assert.equal(json.error.code, 'NOT_FOUND');
  });

  usersRepository.findAccessContextById = async () => ({
    id: admin.id,
    role: 'admin',
    isActive: true
  });
  await withServer(createApp(admin), async (baseUrl) => {
    const { response, json } = await request(baseUrl, `/v1/resources/${resourceId}`);
    assert.equal(response.status, 200);
    assert.equal(json.success, true);
    assert.equal(json.data.resource.status, 'archived');
  });
});

test('POST /v1/resources creates a draft resource for faculty users', async () => {
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
  subjectsRepository.findById = async () => ({
    id: subjectId,
    name: 'Database Management Systems',
    code: 'CSE301'
  } as never);
  resourcesRepository.createResource = async (_resourceId, _input, uploadedBy, status) =>
    baseResource({
      uploadedBy,
      status
    });

  await withServer(createApp(faculty), async (baseUrl) => {
    const { response, json } = await request(baseUrl, '/v1/resources', {
      method: 'POST',
      body: {
        subjectId,
        title: 'DBMS Notes',
        description: 'Unit 1 notes',
        resourceType: 'note',
        academicYear: '2025-2026',
        semester: 5,
        fileName: 'dbms.pdf',
        filePath: 'resources/note/44444444-4444-4444-4444-444444444444/dbms.pdf',
        fileSizeBytes: 1024,
        mimeType: 'application/pdf'
      }
    });

    assert.equal(response.status, 201);
    assert.equal(json.success, true);
    assert.equal(json.data.resource.status, 'draft');
    assert.equal(json.data.uploadSession.resourceId, resourceId);
    assert.match(json.data.uploadSession.uploadPath, /^resources\/note\/[0-9a-f-]+\/dbms\.pdf$/);
    assert.equal(typeof json.data.uploadSession.uploadToken, 'string');
    assert.equal(typeof json.data.uploadSession.signedUploadUrl, 'string');
    assert.equal(typeof json.data.uploadSession.expiresAt, 'string');
  });
});

test('POST /v1/resources rejects invalid enum values', async () => {
  const faculty: User = {
    id: '22222222-2222-2222-2222-222222222222',
    email: 'faculty@example.com',
    fullName: 'Faculty',
    role: 'faculty'
  };

  await withServer(createApp(faculty), async (baseUrl) => {
    const { response, json } = await request(baseUrl, '/v1/resources', {
      method: 'POST',
      body: {
        subjectId,
        title: 'DBMS Notes',
        resourceType: 'invalid',
        academicYear: '2025-2026',
        semester: 5,
        fileName: 'dbms.pdf',
        filePath: 'resources/note/44444444-4444-4444-4444-444444444444/dbms.pdf',
        fileSizeBytes: 1024,
        mimeType: 'application/pdf'
      }
    });

    assert.equal(response.status, 422);
    assert.equal(json.success, false);
    assert.equal(json.error.code, 'VALIDATION_ERROR');
  });
});

test('POST /v1/resources rejects status in request body', async () => {
  const faculty: User = {
    id: '22222222-2222-2222-2222-222222222222',
    email: 'faculty@example.com',
    fullName: 'Faculty',
    role: 'faculty'
  };

  await withServer(createApp(faculty), async (baseUrl) => {
    const { response, json } = await request(baseUrl, '/v1/resources', {
      method: 'POST',
      body: {
        subjectId,
        title: 'DBMS Notes',
        status: 'published',
        resourceType: 'note',
        academicYear: '2025-2026',
        semester: 5,
        fileName: 'dbms.pdf',
        filePath: 'resources/note/44444444-4444-4444-4444-444444444444/dbms.pdf',
        fileSizeBytes: 1024,
        mimeType: 'application/pdf'
      }
    });

    assert.equal(response.status, 422);
    assert.equal(json.success, false);
    assert.equal(json.error.code, 'VALIDATION_ERROR');
  });
});

test('POST /v1/resources forbids student users', async () => {
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

  await withServer(createApp(student), async (baseUrl) => {
    const { response, json } = await request(baseUrl, '/v1/resources', {
      method: 'POST',
      body: {
        subjectId,
        title: 'DBMS Notes',
        resourceType: 'note',
        academicYear: '2025-2026',
        semester: 5,
        fileName: 'dbms.pdf',
        filePath: 'resources/note/44444444-4444-4444-4444-444444444444/dbms.pdf',
        fileSizeBytes: 1024,
        mimeType: 'application/pdf'
      }
    });

    assert.equal(response.status, 403);
    assert.equal(json.success, false);
    assert.equal(json.error.code, 'FORBIDDEN');
  });
});

test('PATCH /v1/resources/:id updates a faculty-owned resource', async () => {
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
  resourcesRepository.findById = async () => baseResource({ uploadedBy: faculty.id, status: 'draft' });
  resourcesRepository.updateResource = async (_id, input) =>
    baseResource({
      title: input.title ?? 'DBMS Notes Updated'
    });

  await withServer(createApp(faculty), async (baseUrl) => {
    const { response, json } = await request(baseUrl, `/v1/resources/${resourceId}`, {
      method: 'PATCH',
      body: {
        title: 'DBMS Notes Updated'
      }
    });

    assert.equal(response.status, 200);
    assert.equal(json.success, true);
    assert.equal(json.data.resource.title, 'DBMS Notes Updated');
  });
});

test('POST /v1/resources/:id/complete keeps draft state for owner', async () => {
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
  resourcesRepository.findById = async () => baseResource({ uploadedBy: faculty.id, status: 'draft' });
  resourcesRepository.updateResource = async (_id, _input) =>
    baseResource({ uploadedBy: faculty.id, status: 'draft' });
  resourcesRepository.updateResourceStatus = async (_id, status) => baseResource({ uploadedBy: faculty.id, status });

  await withServer(createApp(faculty), async (baseUrl) => {
    const { response, json } = await request(baseUrl, `/v1/resources/${resourceId}/complete`, {
      method: 'POST'
    });

    assert.equal(response.status, 200);
    assert.equal(json.success, true);
    assert.equal(json.data.resource.status, 'draft');
  });
});

test('POST /v1/resources/:id/submit moves a faculty-owned resource to pending_review', async () => {
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
  resourcesRepository.findById = async () => baseResource({ uploadedBy: faculty.id, status: 'draft' });
  resourcesRepository.updateResource = async (_id, _input) =>
    baseResource({ uploadedBy: faculty.id, status: 'draft' });
  resourcesRepository.updateResourceStatus = async (_id, status) => baseResource({ uploadedBy: faculty.id, status });

  await withServer(createApp(faculty), async (baseUrl) => {
    const { response, json } = await request(baseUrl, `/v1/resources/${resourceId}/submit`, {
      method: 'POST'
    });

    assert.equal(response.status, 200);
    assert.equal(json.success, true);
    assert.equal(json.data.resource.status, 'pending_review');
  });
});

test('DELETE /v1/resources/:id archives a faculty-owned resource', async () => {
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
  resourcesRepository.findById = async () => baseResource({ uploadedBy: faculty.id, status: 'draft' });
  resourcesRepository.archiveResource = async (_id) => baseResource({ uploadedBy: faculty.id, status: 'archived' });

  await withServer(createApp(faculty), async (baseUrl) => {
    const { response, json } = await request(baseUrl, `/v1/resources/${resourceId}`, {
      method: 'DELETE'
    });

    assert.equal(response.status, 200);
    assert.equal(json.success, true);
    assert.equal(json.data.resource.status, 'archived');
  });
});

test('DELETE /v1/resources/:id forbids student users', async () => {
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
  resourcesRepository.findById = async () => baseResource({ uploadedBy: '55555555-5555-5555-5555-555555555555', status: 'draft' });

  await withServer(createApp(student), async (baseUrl) => {
    const { response, json } = await request(baseUrl, `/v1/resources/${resourceId}`, {
      method: 'DELETE'
    });

    assert.equal(response.status, 403);
    assert.equal(json.success, false);
    assert.equal(json.error.code, 'FORBIDDEN');
  });
});

test('PATCH /v1/admin/resources/:id/status publishes a pending_review resource for admin users', async () => {
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
  resourcesRepository.findById = async () => baseResource({ status: 'pending_review' });
  resourcesRepository.updateStatus = async (_id, status) =>
    baseResource({ status, publishedAt: status === 'published' ? '2026-04-02T00:00:00.000Z' : null });

  await withServer(createApp(admin), async (baseUrl) => {
    const { response, json } = await request(baseUrl, `/v1/admin/resources/${resourceId}/status`, {
      method: 'PATCH',
      body: {
        status: 'published'
      }
    });

    assert.equal(response.status, 200);
    assert.equal(json.success, true);
    assert.equal(json.data.resource.status, 'published');
  });
});

test('PATCH /v1/admin/resources/:id/status rejects a pending_review resource for admin users', async () => {
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
  resourcesRepository.findById = async () => baseResource({ status: 'pending_review' });
  resourcesRepository.updateStatus = async (_id, status) =>
    baseResource({ status, publishedAt: null });

  await withServer(createApp(admin), async (baseUrl) => {
    const { response, json } = await request(baseUrl, `/v1/admin/resources/${resourceId}/status`, {
      method: 'PATCH',
      body: {
        status: 'rejected'
      }
    });

    assert.equal(response.status, 200);
    assert.equal(json.success, true);
    assert.equal(json.data.resource.status, 'rejected');
  });
});

test('PATCH /v1/admin/resources/:id/status rejects invalid transitions', async () => {
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
  resourcesRepository.findById = async () => baseResource({ status: 'draft' });

  await withServer(createApp(admin), async (baseUrl) => {
    const { response, json } = await request(baseUrl, `/v1/admin/resources/${resourceId}/status`, {
      method: 'PATCH',
      body: {
        status: 'rejected'
      }
    });

    assert.equal(response.status, 400);
    assert.equal(json.success, false);
    assert.equal(json.error.code, 'INVALID_STATUS_TRANSITION');
  });
});

test('PATCH /v1/admin/resources/:id/status forbids non-admin users', async () => {
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
  resourcesRepository.findById = async () => baseResource({ status: 'pending_review' });

  await withServer(createApp(faculty), async (baseUrl) => {
    const { response, json } = await request(baseUrl, `/v1/admin/resources/${resourceId}/status`, {
      method: 'PATCH',
      body: {
        status: 'published'
      }
    });

    assert.equal(response.status, 403);
    assert.equal(json.success, false);
    assert.equal(json.error.code, 'FORBIDDEN');
  });
});

test('PATCH /v1/admin/resources/:id/status rejects invalid status values', async () => {
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

  await withServer(createApp(admin), async (baseUrl) => {
    const { response, json } = await request(baseUrl, `/v1/admin/resources/${resourceId}/status`, {
      method: 'PATCH',
      body: {
        status: 'archived'
      }
    });

    assert.equal(response.status, 422);
    assert.equal(json.success, false);
    assert.equal(json.error.code, 'VALIDATION_ERROR');
  });
});
