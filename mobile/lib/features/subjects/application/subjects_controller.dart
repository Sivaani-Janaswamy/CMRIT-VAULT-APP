import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/services/backend_api_service.dart';
import '../data/subjects_repository.dart';
import '../domain/download_url_result.dart';
import '../domain/paginated_result.dart';
import '../domain/resource_item.dart';
import '../domain/subject.dart';

final subjectsRepositoryProvider = Provider<SubjectsRepository>((ref) {
  return SubjectsRepository(
    apiService: ref.watch(backendApiServiceProvider),
  );
});

final subjectsListProvider =
    FutureProvider.autoDispose<PaginatedResult<Subject>>((ref) async {
  final repository = ref.watch(subjectsRepositoryProvider);
  return repository.fetchSubjects();
});

final subjectsSelectionProvider =
    FutureProvider.autoDispose<PaginatedResult<Subject>>((ref) async {
  final repository = ref.watch(subjectsRepositoryProvider);
  return repository.fetchSubjects(page: 1, pageSize: 200);
});

final subjectDetailProvider =
    FutureProvider.autoDispose.family<Subject, String>((ref, subjectId) async {
  final repository = ref.watch(subjectsRepositoryProvider);
  return repository.fetchSubjectById(subjectId);
});

final subjectResourcesProvider = FutureProvider.autoDispose
    .family<PaginatedResult<ResourceItem>, String>((ref, subjectId) async {
  final repository = ref.watch(subjectsRepositoryProvider);
  return repository.fetchResources(subjectId: subjectId);
});

final resourceDetailProvider =
    FutureProvider.autoDispose.family<ResourceItem, String>((ref, resourceId) async {
  final repository = ref.watch(subjectsRepositoryProvider);
  return repository.fetchResourceById(resourceId);
});

final downloadUrlProvider = FutureProvider.autoDispose
    .family<DownloadUrlResult, String>((ref, resourceId) async {
  final repository = ref.watch(subjectsRepositoryProvider);
  return repository.createDownloadUrl(resourceId);
});
