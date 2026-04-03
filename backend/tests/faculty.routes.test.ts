import assert from 'node:assert/strict';
import express from 'express';
import { afterEach, beforeEach, test } from 'node:test';

import { errorHandler } from '../src/common/middleware/errorHandler';
import { validateParams, validateQuery } from '../src/common/middleware/validate';
import type { AuthenticatedRequest } from '../src/common/types/authenticated-request';
import type { User } from '../src/common/types/user';
import { facultyRepository } from '../src/modules/faculty/faculty.repository';
import {
  getFacultyDashboardSummaryHandler,
  getFacultyResourceStatsHandler,
  listFacultyResourcesHandler
} from '../src/modules/faculty/faculty.controller';
import {
  facultyDashboardQuerySchema,
  facultyResourceIdParamSchema,
  facultyResourcesQuerySchema
} from '../src/modules/faculty/faculty.schemas';
import type { Resource } from '../src/modules/resources/resources.types';
import { usersRepository } from '../src/modules/users/users.repository';

type RepoStubs = {
  findAccessContextById: typeof usersRepository.findAccessContextById;
  getDashboardSummary: typeof facultyRepository.getDashboardSummary;
  listResources: typeof facultyRepository.listResources;
  findResourceById: typeof facultyRepository.findResourceById;
  getResourceDownloadMetricsById: typeof facultyRepository.getResourceDownloadMetricsById;
};

const originalRepoMethods: RepoStubs = {
  findAccessContextById: usersRepository.findAccessContextById.bind(usersRepository),
  getDashboardSummary: facultyRepository.getDashboardSummary.bind(facultyRepository),
  listResources: facultyRepository.listResources.bind(facultyRepository),
  findResourceById: facultyRepository.findResourceById.bind(facultyRepository),
  getResourceDownloadMetricsById: facultyRepository.getResourceDownloadMetricsById.bind(facultyRepository)
};

function restoreRepositoryMocks() {
  usersRepository.findAccessContextById = originalRepoMethods.findAccessContextById;
  facultyRepository.getDashboardSummary = originalRepoMethods.getDashboardSummary;
  facultyRepository.listResources = originalRepoMethods.listResources;
  facultyRepository.findResourceById = originalRepoMethods.findResourceById;
  facultyRepository.getResourceDownloadMetricsById = originalRepoMethods.getResourceDownloadMetricsById;
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

  app.get(
    '/v1/faculty/dashboard/summary',
    attachUser(user),
    validateQuery(facultyDashboardQuerySchema),
    getFacultyDashboardSummaryHandler
  );
  app.get(
    '/v1/faculty/resources',
    attachUser(user),
    validateQuery(facultyResourcesQuerySchema),
    listFacultyResourcesHandler
  );
  app.get(
    '/v1/faculty/resources/:id/stats',
    attachUser(user),
    validateParams(facultyResourceIdParamSchema),
    getFacultyResourceStatsHandler
  );

  app.use(errorHandler);
  return app;
}

async function request(baseUrl: string, path: string) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
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

function baseResource(overrides: Partial<Resource> = {}): Resource {
  return {
    id: '44444444-4444-4444-4444-444444444444',
    subjectId: '33333333-3333-3333-3333-333333333333',
    uploadedBy: '22222222-2222-2222-2222-222222222222',
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
    downloadCount: 12,
    publishedAt: '2026-04-02T00:00:00.000Z',
    createdAt: '2026-04-02T00:00:00.000Z',
    updatedAt: '2026-04-02T00:00:00.000Z',
    ...overrides
  };
}

test('GET /v1/faculty/dashboard/summary returns faculty summary data', async () => {
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
  facultyRepository.getDashboardSummary = async () => ({
    period: '30d',
    startDate: '2026-03-04T00:00:00.000Z',
    endDate: '2026-04-03T00:00:00.000Z',
    resources: {
      total: 3,
      draft: 1,
      pendingReview: 1,
      published: 1,
      rejected: 0,
      archived: 0
    },
    downloads: {
      total: 18,
      inPeriod: 6,
      bySource: {
        mobile: 4,
        web: 1,
        admin: 1
      }
    }
  });

  await withServer(createApp(faculty), async (baseUrl) => {
    const { response, json } = await request(baseUrl, '/v1/faculty/dashboard/summary');
    assert.equal(response.status, 200);
    assert.equal(json.success, true);
    assert.equal(json.data.summary.resources.total, 3);
    assert.equal(json.data.summary.downloads.total, 18);
  });
});

test('GET /v1/faculty/dashboard/summary forbids students', async () => {
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
    const { response, json } = await request(baseUrl, '/v1/faculty/dashboard/summary');
    assert.equal(response.status, 403);
    assert.equal(json.success, false);
    assert.equal(json.error.code, 'FORBIDDEN');
  });
});

test('GET /v1/faculty/resources forbids students', async () => {
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
    const { response, json } = await request(baseUrl, '/v1/faculty/resources?page=1&pageSize=20');
    assert.equal(response.status, 403);
    assert.equal(json.success, false);
    assert.equal(json.error.code, 'FORBIDDEN');
  });
});

test('GET /v1/faculty/resources returns paginated faculty resources', async () => {
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
  facultyRepository.listResources = async (scope, query) => {
    assert.equal(scope.role, 'admin');
    assert.equal(query.page, 1);
    return {
      items: [baseResource({ status: 'archived' })],
      page: 1,
      pageSize: 20,
      total: 1
    };
  };

  await withServer(createApp(admin), async (baseUrl) => {
    const { response, json } = await request(baseUrl, '/v1/faculty/resources?page=1&pageSize=20');
    assert.equal(response.status, 200);
    assert.equal(json.success, true);
    assert.equal(json.data.items.length, 1);
    assert.equal(json.data.pageInfo.total, 1);
  });
});

test('GET /v1/faculty/resources/:id/stats rejects invalid UUIDs', async () => {
  const faculty: User = {
    id: '22222222-2222-2222-2222-222222222222',
    email: 'faculty@example.com',
    fullName: 'Faculty',
    role: 'faculty'
  };

  await withServer(createApp(faculty), async (baseUrl) => {
    const { response, json } = await request(baseUrl, '/v1/faculty/resources/not-a-uuid/stats');
    assert.equal(response.status, 422);
    assert.equal(json.success, false);
    assert.equal(json.error.code, 'VALIDATION_ERROR');
  });
});

test('GET /v1/faculty/resources/:id/stats forbids students', async () => {
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
    const { response, json } = await request(baseUrl, '/v1/faculty/resources/44444444-4444-4444-4444-444444444444/stats');
    assert.equal(response.status, 403);
    assert.equal(json.success, false);
    assert.equal(json.error.code, 'FORBIDDEN');
  });
});

test('GET /v1/faculty/resources/:id/stats returns 404 when resource is not owned', async () => {
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
  facultyRepository.findResourceById = async () => baseResource({ uploadedBy: '99999999-9999-9999-9999-999999999999' });

  await withServer(createApp(faculty), async (baseUrl) => {
    const { response, json } = await request(baseUrl, '/v1/faculty/resources/44444444-4444-4444-4444-444444444444/stats');
    assert.equal(response.status, 404);
    assert.equal(json.success, false);
    assert.equal(json.error.code, 'NOT_FOUND');
  });
});

test('GET /v1/faculty/resources/:id/stats returns stats for admin users', async () => {
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
  facultyRepository.findResourceById = async () => baseResource({ uploadedBy: '99999999-9999-9999-9999-999999999999' });
  facultyRepository.getResourceDownloadMetricsById = async () => ({
    total: 9,
    bySource: {
      mobile: 4,
      web: 3,
      admin: 2
    },
    firstDownloadedAt: '2026-04-01T00:00:00.000Z',
    lastDownloadedAt: '2026-04-03T00:00:00.000Z'
  });

  await withServer(createApp(admin), async (baseUrl) => {
    const { response, json } = await request(baseUrl, '/v1/faculty/resources/44444444-4444-4444-4444-444444444444/stats');
    assert.equal(response.status, 200);
    assert.equal(json.success, true);
    assert.equal(json.data.stats.downloads.total, 9);
  });
});
