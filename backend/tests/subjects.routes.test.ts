import express from 'express';
import { afterEach, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';

import { errorHandler } from '../src/common/middleware/errorHandler';
import { validateBody, validateParams } from '../src/common/middleware/validate';
import type { AuthenticatedRequest } from '../src/common/types/authenticated-request';
import type { User } from '../src/common/types/user';
import {
  createAdminSubjectHandler,
  deleteAdminSubjectHandler,
  getSubjectHandler,
  updateAdminSubjectHandler
} from '../src/modules/subjects/subjects.controller';
import {
  createSubjectSchema,
  subjectIdParamSchema,
  updateSubjectSchema
} from '../src/modules/subjects/subjects.schemas';
import { subjectsRepository } from '../src/modules/subjects/subjects.repository';
import { usersRepository } from '../src/modules/users/users.repository';

type SubjectStub = {
  id: string;
  code: string;
  name: string;
  department: string;
  semester: number;
  isActive: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};

type RepoStubs = {
  findById: typeof subjectsRepository.findById;
  createSubject: typeof subjectsRepository.createSubject;
  updateSubject: typeof subjectsRepository.updateSubject;
  softDeleteSubject: typeof subjectsRepository.softDeleteSubject;
  findAccessContextById: typeof usersRepository.findAccessContextById;
};

const originalRepoMethods: RepoStubs = {
  findById: subjectsRepository.findById.bind(subjectsRepository),
  createSubject: subjectsRepository.createSubject.bind(subjectsRepository),
  updateSubject: subjectsRepository.updateSubject.bind(subjectsRepository),
  softDeleteSubject: subjectsRepository.softDeleteSubject.bind(subjectsRepository),
  findAccessContextById: usersRepository.findAccessContextById.bind(usersRepository)
};

function restoreRepositoryMocks() {
  subjectsRepository.findById = originalRepoMethods.findById;
  subjectsRepository.createSubject = originalRepoMethods.createSubject;
  subjectsRepository.updateSubject = originalRepoMethods.updateSubject;
  subjectsRepository.softDeleteSubject = originalRepoMethods.softDeleteSubject;
  usersRepository.findAccessContextById = originalRepoMethods.findAccessContextById;
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
    '/v1/subjects/:id',
    attachUser(user),
    validateParams(subjectIdParamSchema),
    getSubjectHandler
  );

  app.post('/v1/admin/subjects', attachUser(user), validateBody(createSubjectSchema), createAdminSubjectHandler);
  app.patch(
    '/v1/admin/subjects/:id',
    attachUser(user),
    validateParams(subjectIdParamSchema),
    validateBody(updateSubjectSchema),
    updateAdminSubjectHandler
  );
  app.delete(
    '/v1/admin/subjects/:id',
    attachUser(user),
    validateParams(subjectIdParamSchema),
    deleteAdminSubjectHandler
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

test('GET /v1/subjects/:id returns a subject for authenticated users', async () => {
  const user: User = {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'student@example.com',
    fullName: 'Student Name',
    role: 'student'
  };

  subjectsRepository.findById = async (id): Promise<SubjectStub | null> =>
    id === '33333333-3333-3333-3333-333333333333'
      ? {
          id,
          code: 'CSE101',
          name: 'Programming in C',
          department: 'CSE',
          semester: 1,
          isActive: true,
          createdBy: user.id,
          createdAt: '2026-04-02T00:00:00.000Z',
          updatedAt: '2026-04-02T00:00:00.000Z'
        }
      : null;

  await withServer(createApp(user), async (baseUrl) => {
    const { response, json } = await request(baseUrl, '/v1/subjects/33333333-3333-3333-3333-333333333333');

    assert.equal(response.status, 200);
    assert.equal(json.success, true);
    assert.equal(json.data.subject.code, 'CSE101');
  });
});

test('GET /v1/subjects/:id rejects invalid UUIDs', async () => {
  const user: User = {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'student@example.com',
    fullName: 'Student Name',
    role: 'student'
  };

  await withServer(createApp(user), async (baseUrl) => {
    const { response, json } = await request(baseUrl, '/v1/subjects/not-a-uuid');

    assert.equal(response.status, 422);
    assert.equal(json.success, false);
    assert.equal(json.error.code, 'VALIDATION_ERROR');
  });
});

test('GET /v1/subjects/:id returns 404 when missing', async () => {
  const user: User = {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'student@example.com',
    fullName: 'Student Name',
    role: 'student'
  };

  subjectsRepository.findById = async () => null;

  await withServer(createApp(user), async (baseUrl) => {
    const { response, json } = await request(baseUrl, '/v1/subjects/33333333-3333-3333-3333-333333333333');

    assert.equal(response.status, 404);
    assert.equal(json.success, false);
    assert.equal(json.error.code, 'NOT_FOUND');
  });
});

test('POST /v1/admin/subjects creates a subject for admin users', async () => {
  const adminUser: User = {
    id: '22222222-2222-2222-2222-222222222222',
    email: 'admin@example.com',
    fullName: 'Admin Name',
    role: 'admin'
  };

  usersRepository.findAccessContextById = async () => ({
    id: adminUser.id,
    role: 'admin',
    isActive: true
  });
  subjectsRepository.createSubject = async (input, createdBy) => ({
    id: '44444444-4444-4444-4444-444444444444',
    code: input.code,
    name: input.name,
    department: input.department,
    semester: input.semester,
    isActive: input.isActive ?? true,
    createdBy,
    createdAt: '2026-04-02T00:00:00.000Z',
    updatedAt: '2026-04-02T00:00:00.000Z'
  });

  await withServer(createApp(adminUser), async (baseUrl) => {
    const { response, json } = await request(baseUrl, '/v1/admin/subjects', {
      method: 'POST',
      body: {
        code: 'CSE999',
        name: 'Test Subject',
        department: 'CSE',
        semester: 5
      }
    });

    assert.equal(response.status, 201);
    assert.equal(json.success, true);
    assert.equal(json.data.subject.code, 'CSE999');
  });
});

test('POST /v1/admin/subjects forbids non-admin users', async () => {
  const user: User = {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'student@example.com',
    fullName: 'Student Name',
    role: 'student'
  };

  usersRepository.findAccessContextById = async () => ({
    id: user.id,
    role: 'student',
    isActive: true
  });

  await withServer(createApp(user), async (baseUrl) => {
    const { response, json } = await request(baseUrl, '/v1/admin/subjects', {
      method: 'POST',
      body: {
        code: 'CSE999',
        name: 'Test Subject',
        department: 'CSE',
        semester: 5
      }
    });

    assert.equal(response.status, 403);
    assert.equal(json.success, false);
    assert.equal(json.error.code, 'FORBIDDEN');
  });
});

test('PATCH /v1/admin/subjects/:id forbids non-admin users', async () => {
  const user: User = {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'student@example.com',
    fullName: 'Student Name',
    role: 'student'
  };

  usersRepository.findAccessContextById = async () => ({
    id: user.id,
    role: 'student',
    isActive: true
  });

  await withServer(createApp(user), async (baseUrl) => {
    const { response, json } = await request(baseUrl, '/v1/admin/subjects/33333333-3333-3333-3333-333333333333', {
      method: 'PATCH',
      body: {
        name: 'Updated Subject'
      }
    });

    assert.equal(response.status, 403);
    assert.equal(json.success, false);
    assert.equal(json.error.code, 'FORBIDDEN');
  });
});

test('PATCH /v1/admin/subjects/:id updates a subject for admin users', async () => {
  const adminUser: User = {
    id: '22222222-2222-2222-2222-222222222222',
    email: 'admin@example.com',
    fullName: 'Admin Name',
    role: 'admin'
  };

  usersRepository.findAccessContextById = async () => ({
    id: adminUser.id,
    role: 'admin',
    isActive: true
  });
  subjectsRepository.updateSubject = async (id, input) => ({
    id,
    code: input.code ?? 'CSE101',
    name: input.name ?? 'Programming in C',
    department: input.department ?? 'CSE',
    semester: input.semester ?? 1,
    isActive: input.isActive ?? true,
    createdBy: adminUser.id,
    createdAt: '2026-04-02T00:00:00.000Z',
    updatedAt: '2026-04-02T00:00:00.000Z'
  });

  await withServer(createApp(adminUser), async (baseUrl) => {
    const { response, json } = await request(baseUrl, '/v1/admin/subjects/33333333-3333-3333-3333-333333333333', {
      method: 'PATCH',
      body: {
        name: 'Updated Subject'
      }
    });

    assert.equal(response.status, 200);
    assert.equal(json.success, true);
    assert.equal(json.data.subject.name, 'Updated Subject');
  });
});

test('DELETE /v1/admin/subjects/:id soft deletes a subject for admin users', async () => {
  const adminUser: User = {
    id: '22222222-2222-2222-2222-222222222222',
    email: 'admin@example.com',
    fullName: 'Admin Name',
    role: 'admin'
  };

  usersRepository.findAccessContextById = async () => ({
    id: adminUser.id,
    role: 'admin',
    isActive: true
  });
  subjectsRepository.softDeleteSubject = async (id) => ({
    id,
    code: 'CSE101',
    name: 'Programming in C',
    department: 'CSE',
    semester: 1,
    isActive: false,
    createdBy: adminUser.id,
    createdAt: '2026-04-02T00:00:00.000Z',
    updatedAt: '2026-04-02T00:00:00.000Z'
  });

  await withServer(createApp(adminUser), async (baseUrl) => {
    const { response, json } = await request(baseUrl, '/v1/admin/subjects/33333333-3333-3333-3333-333333333333', {
      method: 'DELETE'
    });

    assert.equal(response.status, 200);
    assert.equal(json.success, true);
    assert.equal(json.data.subject.isActive, false);
  });
});

test('DELETE /v1/admin/subjects/:id forbids non-admin users', async () => {
  const user: User = {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'student@example.com',
    fullName: 'Student Name',
    role: 'student'
  };

  usersRepository.findAccessContextById = async () => ({
    id: user.id,
    role: 'student',
    isActive: true
  });

  await withServer(createApp(user), async (baseUrl) => {
    const { response, json } = await request(baseUrl, '/v1/admin/subjects/33333333-3333-3333-3333-333333333333', {
      method: 'DELETE'
    });

    assert.equal(response.status, 403);
    assert.equal(json.success, false);
    assert.equal(json.error.code, 'FORBIDDEN');
  });
});
