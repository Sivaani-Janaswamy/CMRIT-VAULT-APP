import { afterEach, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';

import { algoliaIntegration } from '../src/integrations/algolia.integration';
import { searchRepository } from '../src/modules/search/search.repository';
import { searchService } from '../src/modules/search/search.service';
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

test('searchResources filters items through shared visibility helper', async () => {
  const studentId = '11111111-1111-1111-1111-111111111111';

  usersRepository.findAccessContextById = async () => ({
    id: studentId,
    role: 'student',
    isActive: true
  });
  algoliaIntegration.searchResources = async () => ({
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
        title: 'Visible',
        description: null,
        academicYear: '2025-2026',
        fileName: 'visible.pdf',
        status: 'published',
        downloadCount: 0,
        publishedAt: null,
        createdAt: '2026-04-03T00:00:00.000Z',
        updatedAt: '2026-04-03T00:00:00.000Z',
        ownerId: 'other-user',
        searchableText: 'visible'
      } as const,
      {
        objectID: 'r2',
        resourceId: 'r2',
        subjectId: 's1',
        subjectCode: 'CSE101',
        subjectName: 'Programming in C',
        department: 'CSE',
        semester: 1,
        resourceType: 'note',
        title: 'Hidden',
        description: null,
        academicYear: '2025-2026',
        fileName: 'hidden.pdf',
        status: 'draft',
        downloadCount: 0,
        publishedAt: null,
        createdAt: '2026-04-03T00:00:00.000Z',
        updatedAt: '2026-04-03T00:00:00.000Z',
        ownerId: 'other-user',
        searchableText: 'hidden'
      } as const
    ],
    nbHits: 2
  });

  const result = await searchService.searchResources(studentId, {
    q: 'dbms',
    page: 1,
    pageSize: 10,
    filters: {}
  });

  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].title, 'Visible');
});

test('suggestResources filters suggestions through shared visibility helper', async () => {
  const facultyId = '22222222-2222-2222-2222-222222222222';

  usersRepository.findAccessContextById = async () => ({
    id: facultyId,
    role: 'faculty',
    isActive: true
  });
  algoliaIntegration.suggestResources = async () => [
    {
      resourceId: 'r1',
      title: 'Faculty Visible',
      subjectName: 'Programming in C',
      resourceType: 'note',
      academicYear: '2025-2026',
      status: 'published',
      ownerId: 'other-user'
    },
    {
      resourceId: 'r2',
      title: 'Faculty Own Draft',
      subjectName: 'Programming in C',
      resourceType: 'note',
      academicYear: '2025-2026',
      status: 'draft',
      ownerId: facultyId
    }
  ];

  const items = await searchService.suggestResources(facultyId, {
    q: 'db',
    limit: 5
  });

  assert.equal(items.length, 2);
});

test('reindexAll completes for admin users', async () => {
  const adminId = '33333333-3333-3333-3333-333333333333';

  usersRepository.findAccessContextById = async () => ({
    id: adminId,
    role: 'admin',
    isActive: true
  });
  searchRepository.fetchAllResources = async () => [
    {
      id: 'r1',
      subject_id: 's1',
      uploaded_by: adminId,
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

  const result = await searchService.reindexAll(adminId);

  assert.equal(result.status, 'completed');
  assert.equal(typeof result.jobId, 'string');
});

test('reindexResource completes for admin users', async () => {
  const adminId = '33333333-3333-3333-3333-333333333333';

  usersRepository.findAccessContextById = async () => ({
    id: adminId,
    role: 'admin',
    isActive: true
  });
  searchRepository.fetchResourceById = async () => ({
    id: 'r1',
    subject_id: 's1',
    uploaded_by: adminId,
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

  const result = await searchService.reindexResource(adminId, '44444444-4444-4444-4444-444444444444');

  assert.equal(result.status, 'completed');
  assert.equal(typeof result.jobId, 'string');
});
