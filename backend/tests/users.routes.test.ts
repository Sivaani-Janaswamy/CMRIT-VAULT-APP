import express from 'express';
import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import { errorHandler } from '../src/common/middleware/errorHandler';
import { validateBody, validateParams, validateQuery } from '../src/common/middleware/validate';
import type { AuthenticatedRequest } from '../src/common/types/authenticated-request';
import { getMeHandler, getAdminUserHandler, listAdminUsersHandler, updateAdminUserRoleHandler, updateAdminUserStatusHandler, updateMeHandler } from '../src/modules/users/users.controller';
import {
  adminUsersQuerySchema,
  updateOwnUserSchema,
  updateUserRoleSchema,
  updateUserStatusSchema,
  userIdParamSchema
} from '../src/modules/users/users.schemas';
import { usersRepository } from '../src/modules/users/users.repository';
import type { User } from '../src/common/types/user';

type RepoStubs = {
  findById: typeof usersRepository.findById;
  findAccessContextById: typeof usersRepository.findAccessContextById;
  findAdminUserById: typeof usersRepository.findAdminUserById;
  listUsers: typeof usersRepository.listUsers;
  updateOwnProfile: typeof usersRepository.updateOwnProfile;
  updateUserRole: typeof usersRepository.updateUserRole;
  updateUserStatus: typeof usersRepository.updateUserStatus;
};

const originalRepoMethods: RepoStubs = {
  findById: usersRepository.findById.bind(usersRepository),
  findAccessContextById: usersRepository.findAccessContextById.bind(usersRepository),
  findAdminUserById: usersRepository.findAdminUserById.bind(usersRepository),
  listUsers: usersRepository.listUsers.bind(usersRepository),
  updateOwnProfile: usersRepository.updateOwnProfile.bind(usersRepository),
  updateUserRole: usersRepository.updateUserRole.bind(usersRepository),
  updateUserStatus: usersRepository.updateUserStatus.bind(usersRepository)
};

function restoreRepositoryMocks() {
  usersRepository.findById = originalRepoMethods.findById;
  usersRepository.findAccessContextById = originalRepoMethods.findAccessContextById;
  usersRepository.findAdminUserById = originalRepoMethods.findAdminUserById;
  usersRepository.listUsers = originalRepoMethods.listUsers;
  usersRepository.updateOwnProfile = originalRepoMethods.updateOwnProfile;
  usersRepository.updateUserRole = originalRepoMethods.updateUserRole;
  usersRepository.updateUserStatus = originalRepoMethods.updateUserStatus;
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

  app.get('/v1/users/me', attachUser(user), getMeHandler);
  app.patch('/v1/users/me', attachUser(user), validateBody(updateOwnUserSchema), updateMeHandler);

  app.get(
    '/v1/admin/users',
    attachUser(user),
    validateQuery(adminUsersQuerySchema),
    listAdminUsersHandler
  );
  app.get(
    '/v1/admin/users/:id',
    attachUser(user),
    validateParams(userIdParamSchema),
    getAdminUserHandler
  );
  app.patch(
    '/v1/admin/users/:id/role',
    attachUser(user),
    validateParams(userIdParamSchema),
    validateBody(updateUserRoleSchema),
    updateAdminUserRoleHandler
  );
  app.patch(
    '/v1/admin/users/:id/status',
    attachUser(user),
    validateParams(userIdParamSchema),
    validateBody(updateUserStatusSchema),
    updateAdminUserStatusHandler
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

test('PATCH /v1/users/me updates the current user profile', async () => {
  const currentUser: User = {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'student@example.com',
    fullName: 'Student Name',
    role: 'student'
  };

  usersRepository.updateOwnProfile = async (_userId, input) => ({
    id: currentUser.id,
    email: currentUser.email,
    fullName: input.fullName ?? currentUser.fullName,
    role: currentUser.role
  });

  await withServer(createApp(currentUser), async (baseUrl) => {
    const { response, json } = await request(baseUrl, '/v1/users/me', {
      method: 'PATCH',
      body: {
        fullName: 'Updated Student',
        rollNo: 'R-101',
        department: 'CSE',
        semester: 3
      }
    });

    assert.equal(response.status, 200);
    assert.equal(json.success, true);
    assert.equal(json.data.user.fullName, 'Updated Student');
  });
});

test('GET /v1/users/me keeps the existing envelope and profile shape', async () => {
  const currentUser: User = {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'student@example.com',
    fullName: 'Student Name',
    role: 'student'
  };

  usersRepository.findById = async () => ({
    id: currentUser.id,
    email: currentUser.email,
    fullName: currentUser.fullName,
    role: currentUser.role
  });

  await withServer(createApp(currentUser), async (baseUrl) => {
    const { response, json } = await request(baseUrl, '/v1/users/me');

    assert.equal(response.status, 200);
    assert.equal(json.success, true);
    assert.equal(json.data.user.role, 'student');
    assert.equal(json.data.user.fullName, 'Student Name');
  });
});

test('PATCH /v1/users/me rejects empty payloads', async () => {
  const currentUser: User = {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'student@example.com',
    fullName: 'Student Name',
    role: 'student'
  };

  await withServer(createApp(currentUser), async (baseUrl) => {
    const { response, json } = await request(baseUrl, '/v1/users/me', {
      method: 'PATCH',
      body: {}
    });

    assert.equal(response.status, 422);
    assert.equal(json.success, false);
    assert.equal(json.error.code, 'VALIDATION_ERROR');
  });
});

test('GET /v1/admin/users returns a paginated list for admin users', async () => {
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
  usersRepository.listUsers = async () => ({
    items: [
      {
        id: '33333333-3333-3333-3333-333333333333',
        email: 'user@example.com',
        fullName: 'User One',
        role: 'student',
        rollNo: 'R-1',
        department: 'CSE',
        semester: 3,
        isActive: true
      }
    ],
    page: 2,
    pageSize: 10,
    total: 11,
    totalPages: 2
  });

  await withServer(createApp(adminUser), async (baseUrl) => {
    const { response, json } = await request(
      baseUrl,
      '/v1/admin/users?page=2&pageSize=10&role=student&department=CSE&semester=3'
    );

    assert.equal(response.status, 200);
    assert.equal(json.success, true);
    assert.equal(json.data.items.length, 1);
    assert.equal(json.data.pageInfo.page, 2);
    assert.equal(json.data.pageInfo.total, 11);
  });
});

test('GET /v1/admin/users/:id returns a user for admin users', async () => {
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
  usersRepository.findAdminUserById = async (id) => ({
    id,
    email: 'user@example.com',
    fullName: 'User One',
    role: 'faculty',
    rollNo: null,
    department: 'ECE',
    semester: 5,
    isActive: true
  });

  await withServer(createApp(adminUser), async (baseUrl) => {
    const { response, json } = await request(
      baseUrl,
      '/v1/admin/users/33333333-3333-3333-3333-333333333333'
    );

    assert.equal(response.status, 200);
    assert.equal(json.success, true);
    assert.equal(json.data.user.role, 'faculty');
    assert.equal(json.data.user.department, 'ECE');
  });
});

test('PATCH /v1/admin/users/:id/role enforces admin access', async () => {
  const nonAdminUser: User = {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'student@example.com',
    fullName: 'Student Name',
    role: 'student'
  };

  usersRepository.findAccessContextById = async () => ({
    id: nonAdminUser.id,
    role: 'student',
    isActive: true
  });

  await withServer(createApp(nonAdminUser), async (baseUrl) => {
    const { response, json } = await request(
      baseUrl,
      '/v1/admin/users/33333333-3333-3333-3333-333333333333/role',
      {
        method: 'PATCH',
        body: { role: 'faculty' }
      }
    );

    assert.equal(response.status, 403);
    assert.equal(json.success, false);
    assert.equal(json.error.code, 'FORBIDDEN');
  });
});

test('PATCH /v1/admin/users/:id/role updates the user role for admin users', async () => {
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
  usersRepository.updateUserRole = async (id, role) => ({
    id,
    email: 'user@example.com',
    fullName: 'User One',
    role,
    rollNo: 'R-1',
    department: 'CSE',
    semester: 3,
    isActive: true
  });

  await withServer(createApp(adminUser), async (baseUrl) => {
    const { response, json } = await request(
      baseUrl,
      '/v1/admin/users/33333333-3333-3333-3333-333333333333/role',
      {
        method: 'PATCH',
        body: { role: 'faculty' }
      }
    );

    assert.equal(response.status, 200);
    assert.equal(json.success, true);
    assert.equal(json.data.user.role, 'faculty');
  });
});

test('PATCH /v1/admin/users/:id/status updates active state for admin users', async () => {
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
  usersRepository.updateUserStatus = async (id, isActive) => ({
    id,
    email: 'user@example.com',
    fullName: 'User One',
    role: 'student',
    rollNo: 'R-1',
    department: 'CSE',
    semester: 3,
    isActive
  });

  await withServer(createApp(adminUser), async (baseUrl) => {
    const { response, json } = await request(
      baseUrl,
      '/v1/admin/users/33333333-3333-3333-3333-333333333333/status',
      {
        method: 'PATCH',
        body: { isActive: false }
      }
    );

    assert.equal(response.status, 200);
    assert.equal(json.success, true);
    assert.equal(json.data.user.isActive, false);
  });
});
