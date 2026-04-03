import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';

import { ForbiddenError } from '../src/common/errors/ForbiddenError';
import { NotFoundError } from '../src/common/errors/NotFoundError';
import type { Resource } from '../src/modules/resources/resources.types';
import { facultyRepository } from '../src/modules/faculty/faculty.repository';
import { facultyService } from '../src/modules/faculty/faculty.service';
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

function baseResource(overrides: Partial<Resource> = {}): Resource {
  return {
    id: '44444444-4444-4444-4444-444444444444',
    subjectId: '33333333-3333-3333-3333-333333333333',
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

test('faculty summary uses faculty scope and returns aggregate data', async () => {
  const facultyId = '22222222-2222-2222-2222-222222222222';

  usersRepository.findAccessContextById = async () => ({
    id: facultyId,
    role: 'faculty',
    isActive: true
  });

  facultyRepository.getDashboardSummary = async (scope, period) => {
    assert.equal(scope.role, 'faculty');
    assert.equal(scope.userId, facultyId);
    assert.equal(period, '30d');
    return {
      period,
      startDate: '2026-03-04T00:00:00.000Z',
      endDate: '2026-04-03T00:00:00.000Z',
      resources: {
        total: 5,
        draft: 1,
        pendingReview: 1,
        published: 2,
        rejected: 1,
        archived: 0
      },
      downloads: {
        total: 20,
        inPeriod: 8,
        bySource: {
          mobile: 4,
          web: 3,
          admin: 1
        }
      }
    };
  };

  const summary = await facultyService.getDashboardSummary(facultyId, { period: '30d' });
  assert.equal(summary.resources.total, 5);
  assert.equal(summary.downloads.total, 20);
});

test('student access is forbidden for faculty summary', async () => {
  const studentId = '11111111-1111-1111-1111-111111111111';
  usersRepository.findAccessContextById = async () => ({
    id: studentId,
    role: 'student',
    isActive: true
  });

  await assert.rejects(
    () => facultyService.getDashboardSummary(studentId, { period: '30d' }),
    (error: unknown) => error instanceof ForbiddenError
  );
});

test('faculty resource stats require ownership and return download metrics', async () => {
  const facultyId = '22222222-2222-2222-2222-222222222222';
  usersRepository.findAccessContextById = async () => ({
    id: facultyId,
    role: 'faculty',
    isActive: true
  });

  facultyRepository.findResourceById = async () => baseResource({ uploadedBy: facultyId, downloadCount: 0 });
  facultyRepository.getResourceDownloadMetricsById = async () => ({
    total: 12,
    bySource: {
      mobile: 6,
      web: 4,
      admin: 2
    },
    firstDownloadedAt: '2026-04-01T00:00:00.000Z',
    lastDownloadedAt: '2026-04-03T00:00:00.000Z'
  });

  const stats = await facultyService.getResourceStats(facultyId, '44444444-4444-4444-4444-444444444444');
  assert.equal(stats.resource.downloadCount, 12);
  assert.equal(stats.downloads.bySource.mobile, 6);
});

test('faculty resource stats return not found for ownership mismatch', async () => {
  const facultyId = '22222222-2222-2222-2222-222222222222';
  usersRepository.findAccessContextById = async () => ({
    id: facultyId,
    role: 'faculty',
    isActive: true
  });
  facultyRepository.findResourceById = async () => baseResource({ uploadedBy: '99999999-9999-9999-9999-999999999999' });

  await assert.rejects(
    () => facultyService.getResourceStats(facultyId, '44444444-4444-4444-4444-444444444444'),
    (error: unknown) => error instanceof NotFoundError
  );
});

test('admin resources list uses admin scope', async () => {
  const adminId = '33333333-3333-3333-3333-333333333333';
  usersRepository.findAccessContextById = async () => ({
    id: adminId,
    role: 'admin',
    isActive: true
  });
  facultyRepository.listResources = async (scope, query) => {
    assert.equal(scope.role, 'admin');
    assert.equal(scope.userId, adminId);
    assert.equal(query.page, 1);
    return {
      items: [baseResource({ status: 'archived' })],
      page: 1,
      pageSize: 20,
      total: 1
    };
  };

  const result = await facultyService.listResources(adminId, { page: 1, pageSize: 20 });
  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].status, 'archived');
});

test('admin summary uses admin scope', async () => {
  const adminId = '33333333-3333-3333-3333-333333333333';
  usersRepository.findAccessContextById = async () => ({
    id: adminId,
    role: 'admin',
    isActive: true
  });

  facultyRepository.getDashboardSummary = async (scope, period) => {
    assert.equal(scope.role, 'admin');
    assert.equal(scope.userId, adminId);
    assert.equal(period, '90d');
    return {
      period,
      startDate: '2026-01-03T00:00:00.000Z',
      endDate: '2026-04-03T00:00:00.000Z',
      resources: {
        total: 10,
        draft: 2,
        pendingReview: 2,
        published: 4,
        rejected: 1,
        archived: 1
      },
      downloads: {
        total: 44,
        inPeriod: 14,
        bySource: {
          mobile: 7,
          web: 4,
          admin: 3
        }
      }
    };
  };

  const summary = await facultyService.getDashboardSummary(adminId, { period: '90d' });
  assert.equal(summary.resources.total, 10);
  assert.equal(summary.downloads.total, 44);
});
