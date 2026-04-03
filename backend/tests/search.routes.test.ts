import express from 'express';
import { afterEach, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';

import { errorHandler } from '../src/common/middleware/errorHandler';
import { validateParams, validateQuery } from '../src/common/middleware/validate';
import type { AuthenticatedRequest } from '../src/common/types/authenticated-request';
import type { User } from '../src/common/types/user';
import { algoliaIntegration } from '../src/integrations/algolia.integration';
import {
  reindexAllResourcesHandler,
  reindexSingleResourceHandler,
  searchResourcesHandler,
  suggestResourcesHandler
} from '../src/modules/search/search.controller';
import {
  reindexResourceParamSchema,
  searchResourcesQuerySchema,
  suggestQuerySchema
} from '../src/modules/search/search.schemas';
import { searchRepository } from '../src/modules/search/search.repository';
import { usersRepository } from '../src/modules/users/users.repository';

type RepoStubs = {
  fetchAllResources: typeof searchRepository.fetchAllResources;
  fetchResourceById: typeof searchRepository.fetchResourceById;
  fetchSubjectsByIds: typeof searchRepository.fetchSubjectsByIds;
  fetchSubjectById: typeof searchRepository.fetchSubjectById;
  findAccessContextById: typeof usersRepository.findAccessContextById;
};

type AlgoliaStubs = {
  searchResources: typeof algoliaIntegration.searchResources;
  suggestResources: typeof algoliaIntegration.suggestResources;
  reindexAllResources: typeof algoliaIntegration.reindexAllResources;
  reindexResource: typeof algoliaIntegration.reindexResource;
};

const originalRepoMethods: RepoStubs = {
  fetchAllResources: searchRepository.fetchAllResources.bind(searchRepository),
  fetchResourceById: searchRepository.fetchResourceById.bind(searchRepository),
  fetchSubjectsByIds: searchRepository.fetchSubjectsByIds.bind(searchRepository),
  fetchSubjectById: searchRepository.fetchSubjectById.bind(searchRepository),
  findAccessContextById: usersRepository.findAccessContextById.bind(usersRepository)
};

const originalAlgoliaMethods: AlgoliaStubs = {
  searchResources: algoliaIntegration.searchResources.bind(algoliaIntegration),
  suggestResources: algoliaIntegration.suggestResources.bind(algoliaIntegration),
  reindexAllResources: algoliaIntegration.reindexAllResources.bind(algoliaIntegration),
  reindexResource: algoliaIntegration.reindexResource.bind(algoliaIntegration)
};

function restoreRepositoryMocks() {
  searchRepository.fetchAllResources = originalRepoMethods.fetchAllResources;
  searchRepository.fetchResourceById = originalRepoMethods.fetchResourceById;
  searchRepository.fetchSubjectsByIds = originalRepoMethods.fetchSubjectsByIds;
  searchRepository.fetchSubjectById = originalRepoMethods.fetchSubjectById;
  usersRepository.findAccessContextById = originalRepoMethods.findAccessContextById;
  algoliaIntegration.searchResources = originalAlgoliaMethods.searchResources;
  algoliaIntegration.suggestResources = originalAlgoliaMethods.suggestResources;
  algoliaIntegration.reindexAllResources = originalAlgoliaMethods.reindexAllResources;
  algoliaIntegration.reindexResource = originalAlgoliaMethods.reindexResource;
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
    '/v1/search/resources',
    attachUser(user),
    validateQuery(searchResourcesQuerySchema),
    searchResourcesHandler
  );
  app.get(
    '/v1/search/suggest',
    attachUser(user),
    validateQuery(suggestQuerySchema),
    suggestResourcesHandler
  );
  app.post('/v1/admin/search/reindex', attachUser(user), reindexAllResourcesHandler);
  app.post(
    '/v1/admin/search/resources/:id/reindex',
    attachUser(user),
    validateParams(reindexResourceParamSchema),
    reindexSingleResourceHandler
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

test('GET /v1/search/resources returns search results for authenticated users', async () => {
  const user: User = {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'student@example.com',
    fullName: 'Student',
    role: 'student'
  };

  usersRepository.findAccessContextById = async () => ({
    id: user.id,
    role: 'student',
    isActive: true
  });
  let capturedInput: Parameters<typeof algoliaIntegration.searchResources>[0] | null = null;
  algoliaIntegration.searchResources = async (input) => {
    capturedInput = input;
    return {
      hits: [
        {
          objectID: 'r1',
          resourceId: 'r1',
          subjectId: 's1',
          subjectCode: 'CSE101',
          subjectName: 'Programming in C',
          department: 'CSE',
          semester: 1,
          resourceType: 'note',
          title: 'Search Result',
          description: null,
          academicYear: '2025-2026',
          fileName: 'result.pdf',
          status: 'published',
          downloadCount: 0,
          publishedAt: null,
          createdAt: '2026-04-03T00:00:00.000Z',
          updatedAt: '2026-04-03T00:00:00.000Z',
          ownerId: 'other-user',
          searchableText: 'search result'
        } as const
      ],
      nbHits: 1
    };
  };

  await withServer(createApp(user), async (baseUrl) => {
    const { response, json } = await request(
      baseUrl,
      '/v1/search/resources?q=dbms&page=1&pageSize=20&resourceType=note&subjectId=33333333-3333-3333-3333-333333333333'
    );

    assert.equal(response.status, 200);
    assert.equal(json.success, true);
    assert.equal(json.data.items.length, 1);
    assert.equal(json.data.pageInfo.total, 1);
    assert.deepEqual(capturedInput, {
      query: 'dbms',
      page: 1,
      pageSize: 20,
      filters: 'status:published AND resourceType:note AND subjectId:"33333333-3333-3333-3333-333333333333"'
    });
  });
});

test('GET /v1/search/resources rejects invalid UUID filters', async () => {
  const user: User = {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'student@example.com',
    fullName: 'Student',
    role: 'student'
  };

  await withServer(createApp(user), async (baseUrl) => {
    const { response, json } = await request(baseUrl, '/v1/search/resources?q=dbms&subjectId=not-a-uuid');

    assert.equal(response.status, 422);
    assert.equal(json.success, false);
    assert.equal(json.error.code, 'VALIDATION_ERROR');
  });
});

test('GET /v1/search/suggest returns suggestions for authenticated users', async () => {
  const user: User = {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'student@example.com',
    fullName: 'Student',
    role: 'student'
  };

  usersRepository.findAccessContextById = async () => ({
    id: user.id,
    role: 'student',
    isActive: true
  });
  algoliaIntegration.suggestResources = async () => [
    {
      resourceId: 'r1',
      title: 'DBMS Notes',
      subjectName: 'Database Management Systems',
      resourceType: 'note',
      academicYear: '2025-2026',
      status: 'published',
      ownerId: 'other-user'
    }
  ];

  await withServer(createApp(user), async (baseUrl) => {
    const { response, json } = await request(baseUrl, '/v1/search/suggest?q=dbms&limit=5');

    assert.equal(response.status, 200);
    assert.equal(json.success, true);
    assert.equal(json.data.items.length, 1);
  });
});

test('POST /v1/admin/search/reindex requires admin access', async () => {
  const user: User = {
    id: '22222222-2222-2222-2222-222222222222',
    email: 'faculty@example.com',
    fullName: 'Faculty',
    role: 'faculty'
  };

  usersRepository.findAccessContextById = async () => ({
    id: user.id,
    role: 'faculty',
    isActive: true
  });

  await withServer(createApp(user), async (baseUrl) => {
    const { response, json } = await request(baseUrl, '/v1/admin/search/reindex', {
      method: 'POST'
    });

    assert.equal(response.status, 403);
    assert.equal(json.success, false);
    assert.equal(json.error.code, 'FORBIDDEN');
  });
});

test('POST /v1/admin/search/reindex starts a reindex job for admin users', async () => {
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
  searchRepository.fetchAllResources = async () => [
    {
      id: 'r1',
      subject_id: 's1',
      uploaded_by: admin.id,
      title: 'DBMS Notes',
      description: null,
      resource_type: 'note',
      academic_year: '2025-2026',
      semester: 5,
      file_name: 'dbms.pdf',
      status: 'published',
      download_count: 0,
      published_at: null,
      created_at: '2026-04-03T00:00:00.000Z',
      updated_at: '2026-04-03T00:00:00.000Z'
    }
  ];
  searchRepository.fetchSubjectsByIds = async () =>
    new Map([
      [
        's1',
        {
          id: 's1',
          code: 'CSE301',
          name: 'Database Management Systems',
          department: 'CSE',
          semester: 5
        }
      ]
    ]);
  algoliaIntegration.reindexAllResources = async () => 1;

  await withServer(createApp(admin), async (baseUrl) => {
    const { response, json } = await request(baseUrl, '/v1/admin/search/reindex', {
      method: 'POST'
    });

    assert.equal(response.status, 200);
    assert.equal(json.success, true);
    assert.equal(json.data.status, 'completed');
  });
});

test('POST /v1/admin/search/resources/:id/reindex rejects invalid UUIDs', async () => {
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
    const { response, json } = await request(baseUrl, '/v1/admin/search/resources/not-a-uuid/reindex', {
      method: 'POST'
    });

    assert.equal(response.status, 422);
    assert.equal(json.success, false);
    assert.equal(json.error.code, 'VALIDATION_ERROR');
  });
});

test('POST /v1/admin/search/resources/:id/reindex starts a job for admin users', async () => {
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
  searchRepository.fetchResourceById = async () => ({
    id: 'r1',
    subject_id: 's1',
    uploaded_by: admin.id,
    title: 'DBMS Notes',
    description: null,
    resource_type: 'note',
    academic_year: '2025-2026',
    semester: 5,
    file_name: 'dbms.pdf',
    status: 'pending_review',
    download_count: 0,
    published_at: null,
    created_at: '2026-04-03T00:00:00.000Z',
    updated_at: '2026-04-03T00:00:00.000Z'
  });
  searchRepository.fetchSubjectById = async () => ({
    id: 's1',
    code: 'CSE301',
    name: 'Database Management Systems',
    department: 'CSE',
    semester: 5
  });
  algoliaIntegration.reindexResource = async () => undefined;

  await withServer(createApp(admin), async (baseUrl) => {
    const { response, json } = await request(baseUrl, '/v1/admin/search/resources/44444444-4444-4444-4444-444444444444/reindex', {
      method: 'POST'
    });

    assert.equal(response.status, 200);
    assert.equal(json.success, true);
    assert.equal(json.data.status, 'completed');
  });
});

test('POST /v1/admin/search/resources/:id/reindex forbids non-admin users', async () => {
  const user: User = {
    id: '22222222-2222-2222-2222-222222222222',
    email: 'faculty@example.com',
    fullName: 'Faculty',
    role: 'faculty'
  };

  usersRepository.findAccessContextById = async () => ({
    id: user.id,
    role: 'faculty',
    isActive: true
  });

  await withServer(createApp(user), async (baseUrl) => {
    const { response, json } = await request(baseUrl, '/v1/admin/search/resources/44444444-4444-4444-4444-444444444444/reindex', {
      method: 'POST'
    });

    assert.equal(response.status, 403);
    assert.equal(json.success, false);
    assert.equal(json.error.code, 'FORBIDDEN');
  });
});
