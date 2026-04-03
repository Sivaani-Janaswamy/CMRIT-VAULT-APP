import express from 'express';
import { afterEach, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';

import { errorHandler } from '../src/common/middleware/errorHandler';
import { validateQuery } from '../src/common/middleware/validate';
import type { AuthenticatedRequest } from '../src/common/types/authenticated-request';
import type { User } from '../src/common/types/user';
import { adminRepository } from '../src/modules/admin/admin.repository';
import {
  getAdminDashboardSummaryHandler,
  listAdminDownloadsOverviewHandler,
  listAdminResourcesOverviewHandler
} from '../src/modules/admin/admin.controller';
import {
  adminDashboardQuerySchema,
  adminDownloadsOverviewQuerySchema,
  adminResourcesOverviewQuerySchema
} from '../src/modules/admin/admin.schemas';
import { usersRepository } from '../src/modules/users/users.repository';

type RepoStubs = {
  findAccessContextById: typeof usersRepository.findAccessContextById;
  getDashboardSummary: typeof adminRepository.getDashboardSummary;
  listResourcesOverview: typeof adminRepository.listResourcesOverview;
  listDownloadsOverview: typeof adminRepository.listDownloadsOverview;
};

const originalRepoMethods: RepoStubs = {
  findAccessContextById: usersRepository.findAccessContextById.bind(usersRepository),
  getDashboardSummary: adminRepository.getDashboardSummary.bind(adminRepository),
  listResourcesOverview: adminRepository.listResourcesOverview.bind(adminRepository),
  listDownloadsOverview: adminRepository.listDownloadsOverview.bind(adminRepository)
};

function restoreRepositoryMocks() {
  usersRepository.findAccessContextById = originalRepoMethods.findAccessContextById;
  adminRepository.getDashboardSummary = originalRepoMethods.getDashboardSummary;
  adminRepository.listResourcesOverview = originalRepoMethods.listResourcesOverview;
  adminRepository.listDownloadsOverview = originalRepoMethods.listDownloadsOverview;
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
    '/v1/admin/dashboard/summary',
    attachUser(user),
    validateQuery(adminDashboardQuerySchema),
    getAdminDashboardSummaryHandler
  );
  app.get(
    '/v1/admin/resources/overview',
    attachUser(user),
    validateQuery(adminResourcesOverviewQuerySchema),
    listAdminResourcesOverviewHandler
  );
  app.get(
    '/v1/admin/downloads/overview',
    attachUser(user),
    validateQuery(adminDownloadsOverviewQuerySchema),
    listAdminDownloadsOverviewHandler
  );

  app.use(errorHandler);
  return app;
}

async function request(
  baseUrl: string,
  path: string
) {
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

test('GET /v1/admin/dashboard/summary returns admin summary data', async () => {
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
  adminRepository.getDashboardSummary = async () => ({
    period: '30d',
    startDate: '2026-03-04T00:00:00.000Z',
    endDate: '2026-04-03T00:00:00.000Z',
    users: {
      total: 12,
      active: 11,
      inactive: 1,
      byRole: {
        student: 8,
        faculty: 3,
        admin: 1
      }
    },
    subjects: {
      total: 6,
      active: 6
    },
    resources: {
      total: 9,
      byStatus: {
        draft: 1,
        pending_review: 2,
        published: 4,
        rejected: 1,
        archived: 1
      }
    },
    downloads: {
      total: 30,
      inPeriod: 8,
      bySource: {
        mobile: 5,
        web: 2,
        admin: 1
      }
    }
  });

  await withServer(createApp(admin), async (baseUrl) => {
    const { response, json } = await request(baseUrl, '/v1/admin/dashboard/summary?period=30d');
    assert.equal(response.status, 200);
    assert.equal(json.success, true);
    assert.equal(json.data.summary.downloads.total, 30);
  });
});

test('GET /v1/admin/dashboard/summary forbids faculty users', async () => {
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
    const { response, json } = await request(baseUrl, '/v1/admin/dashboard/summary?period=30d');
    assert.equal(response.status, 403);
    assert.equal(json.success, false);
    assert.equal(json.error.code, 'FORBIDDEN');
  });
});

test('GET /v1/admin/dashboard/summary rejects invalid periods', async () => {
  const admin: User = {
    id: '33333333-3333-3333-3333-333333333333',
    email: 'admin@example.com',
    fullName: 'Admin',
    role: 'admin'
  };

  await withServer(createApp(admin), async (baseUrl) => {
    const { response, json } = await request(baseUrl, '/v1/admin/dashboard/summary?period=invalid');
    assert.equal(response.status, 422);
    assert.equal(json.success, false);
    assert.equal(json.error.code, 'VALIDATION_ERROR');
  });
});

test('GET /v1/admin/resources/overview returns paginated data for admin users', async () => {
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
  adminRepository.listResourcesOverview = async (filters) => {
    assert.equal(filters.page, 2);
    assert.equal(filters.pageSize, 10);
    assert.equal(filters.department, 'CSE');
    assert.equal(filters.resourceType, 'note');
    assert.equal(filters.academicYear, '2025-2026');
    return {
      items: [
        {
          id: '44444444-4444-4444-4444-444444444444',
          subjectId: '33333333-3333-3333-3333-333333333333',
          uploadedBy: admin.id,
          title: 'DBMS Notes',
          description: null,
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
          updatedAt: '2026-04-02T00:00:00.000Z'
        }
      ],
      page: 2,
      pageSize: 10,
      total: 1
    };
  };

  await withServer(createApp(admin), async (baseUrl) => {
    const { response, json } = await request(
      baseUrl,
      '/v1/admin/resources/overview?page=2&pageSize=10&department=CSE&resourceType=note&academicYear=2025-2026'
    );
    assert.equal(response.status, 200);
    assert.equal(json.success, true);
    assert.equal(json.data.items.length, 1);
    assert.equal(json.data.pageInfo.total, 1);
  });
});

test('GET /v1/admin/resources/overview forbids student users', async () => {
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
    const { response, json } = await request(baseUrl, '/v1/admin/resources/overview?page=1&pageSize=20');
    assert.equal(response.status, 403);
    assert.equal(json.success, false);
    assert.equal(json.error.code, 'FORBIDDEN');
  });
});

test('GET /v1/admin/resources/overview rejects invalid UUID filters', async () => {
  const admin: User = {
    id: '33333333-3333-3333-3333-333333333333',
    email: 'admin@example.com',
    fullName: 'Admin',
    role: 'admin'
  };

  await withServer(createApp(admin), async (baseUrl) => {
    const { response, json } = await request(baseUrl, '/v1/admin/resources/overview?page=1&pageSize=20&subjectId=not-a-uuid');
    assert.equal(response.status, 422);
    assert.equal(json.success, false);
    assert.equal(json.error.code, 'VALIDATION_ERROR');
  });
});

test('GET /v1/admin/downloads/overview returns paginated data for admin users', async () => {
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
  adminRepository.listDownloadsOverview = async (filters) => {
    assert.equal(filters.page, 1);
    assert.equal(filters.pageSize, 20);
    assert.equal(filters.userId, '11111111-1111-1111-1111-111111111111');
    assert.equal(filters.resourceId, '44444444-4444-4444-4444-444444444444');
    assert.equal(filters.source, 'web');
    return {
      items: [
        {
          id: 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          resourceId: '44444444-4444-4444-4444-444444444444',
          userId: '11111111-1111-1111-1111-111111111111',
          resourceTitle: 'DBMS Notes',
          source: 'web',
          ipHash: null,
          userAgent: null,
          downloadedAt: '2026-04-02T00:00:00.000Z',
          resourceType: 'note',
          subjectId: '33333333-3333-3333-3333-333333333333'
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
      '/v1/admin/downloads/overview?page=1&pageSize=20&userId=11111111-1111-1111-1111-111111111111&resourceId=44444444-4444-4444-4444-444444444444&source=web&fromDate=2026-04-01T00:00:00.000Z&toDate=2026-04-03T00:00:00.000Z'
    );
    assert.equal(response.status, 200);
    assert.equal(json.success, true);
    assert.equal(json.data.items.length, 1);
    assert.equal(json.data.pageInfo.total, 1);
  });
});

test('GET /v1/admin/downloads/overview forbids faculty users', async () => {
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
    const { response, json } = await request(baseUrl, '/v1/admin/downloads/overview?page=1&pageSize=20');
    assert.equal(response.status, 403);
    assert.equal(json.success, false);
    assert.equal(json.error.code, 'FORBIDDEN');
  });
});
