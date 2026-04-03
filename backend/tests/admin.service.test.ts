import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';

import { ForbiddenError } from '../src/common/errors/ForbiddenError';
import type { AdminDashboardSummary, AdminDownloadPage, AdminResourcePage } from '../src/modules/admin/admin.types';
import { adminRepository } from '../src/modules/admin/admin.repository';
import { adminService } from '../src/modules/admin/admin.service';
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

test('admin dashboard summary uses admin scope and repository summary', async () => {
  const adminId = '33333333-3333-3333-3333-333333333333';
  usersRepository.findAccessContextById = async () => ({
    id: adminId,
    role: 'admin',
    isActive: true
  });
  adminRepository.getDashboardSummary = async (query) => {
    assert.equal(query.period, '30d');
    return {
      period: '30d',
      startDate: '2026-03-04T00:00:00.000Z',
      endDate: '2026-04-03T00:00:00.000Z',
      users: {
        total: 10,
        active: 9,
        inactive: 1,
        byRole: {
          student: 6,
          faculty: 3,
          admin: 1
        }
      },
      subjects: {
        total: 5,
        active: 5
      },
      resources: {
        total: 8,
        byStatus: {
          draft: 1,
          pending_review: 2,
          published: 3,
          rejected: 1,
          archived: 1
        }
      },
      downloads: {
        total: 21,
        inPeriod: 7,
        bySource: {
          mobile: 4,
          web: 2,
          admin: 1
        }
      }
    } satisfies AdminDashboardSummary;
  };

  const summary = await adminService.getDashboardSummary(adminId, { period: '30d' });
  assert.equal(summary.users.total, 10);
  assert.equal(summary.downloads.total, 21);
});

test('student users are forbidden from admin summary', async () => {
  const studentId = '11111111-1111-1111-1111-111111111111';
  usersRepository.findAccessContextById = async () => ({
    id: studentId,
    role: 'student',
    isActive: true
  });

  await assert.rejects(
    () => adminService.getDashboardSummary(studentId, { period: '30d' }),
    (error: unknown) => error instanceof ForbiddenError
  );
});

test('admin resources overview passes filters to repository', async () => {
  const adminId = '33333333-3333-3333-3333-333333333333';
  usersRepository.findAccessContextById = async () => ({
    id: adminId,
    role: 'admin',
    isActive: true
  });
  adminRepository.listResourcesOverview = async (filters) => {
    assert.equal(filters.page, 2);
    assert.equal(filters.pageSize, 10);
    assert.equal(filters.department, 'CSE');
    assert.equal(filters.resourceType, 'note');
    return {
      items: [],
      page: 2,
      pageSize: 10,
      total: 0
    } satisfies AdminResourcePage;
  };

  const result = await adminService.listResourcesOverview(adminId, {
    page: 2,
    pageSize: 10,
    department: 'CSE',
    resourceType: 'note'
  });

  assert.equal(result.page, 2);
  assert.equal(result.pageSize, 10);
});

test('admin downloads overview passes source filter to repository', async () => {
  const adminId = '33333333-3333-3333-3333-333333333333';
  usersRepository.findAccessContextById = async () => ({
    id: adminId,
    role: 'admin',
    isActive: true
  });
  adminRepository.listDownloadsOverview = async (filters) => {
    assert.equal(filters.page, 1);
    assert.equal(filters.pageSize, 20);
    assert.equal(filters.userId, '11111111-1111-1111-1111-111111111111');
    assert.equal(filters.source, 'web');
    return {
      items: [],
      page: 1,
      pageSize: 20,
      total: 0
    } satisfies AdminDownloadPage;
  };

  const result = await adminService.listDownloadsOverview(adminId, {
    page: 1,
    pageSize: 20,
    userId: '11111111-1111-1111-1111-111111111111',
    source: 'web'
  });

  assert.equal(result.total, 0);
});

test('faculty users are forbidden from admin downloads overview', async () => {
  const facultyId = '22222222-2222-2222-2222-222222222222';
  usersRepository.findAccessContextById = async () => ({
    id: facultyId,
    role: 'faculty',
    isActive: true
  });

  await assert.rejects(
    () =>
      adminService.listDownloadsOverview(facultyId, {
        page: 1,
        pageSize: 20
      }),
    (error: unknown) => error instanceof ForbiddenError
  );
});
