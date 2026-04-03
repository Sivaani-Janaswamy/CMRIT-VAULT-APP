import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'dart:typed_data';

import '../../../core/services/backend_api_service.dart';
import '../../../core/utils/app_logger.dart';
import '../../subjects/domain/paginated_result.dart';
import '../../subjects/domain/resource_item.dart';
import '../data/faculty_repository.dart';
import '../domain/faculty_dashboard_summary.dart';
import '../domain/faculty_query_filters.dart';
import '../domain/faculty_resource_form_input.dart';
import '../domain/faculty_resource_stats.dart';
import '../domain/faculty_upload_flow_error.dart';

final facultyRepositoryProvider = Provider<FacultyRepository>((ref) {
  return FacultyRepository(
    apiService: ref.watch(backendApiServiceProvider),
  );
});

final facultyDashboardSummaryProvider = FutureProvider.autoDispose
    .family<FacultyDashboardSummary, String>((ref, period) async {
  final repository = ref.watch(facultyRepositoryProvider);
  return repository.fetchDashboardSummary(period: period);
});

final facultyResourcesProvider = FutureProvider.autoDispose
    .family<PaginatedResult<ResourceItem>, FacultyResourcesFilters>((
  ref,
  filters,
) async {
  final repository = ref.watch(facultyRepositoryProvider);
  return repository.fetchFacultyResources(filters: filters);
});

final facultyResourceStatsProvider =
    FutureProvider.autoDispose.family<FacultyResourceStats, String>((
  ref,
  resourceId,
) async {
  final repository = ref.watch(facultyRepositoryProvider);
  return repository.fetchResourceStats(resourceId);
});

final facultyResourceActionControllerProvider =
    AutoDisposeAsyncNotifierProvider<FacultyResourceActionController, void>(
  FacultyResourceActionController.new,
);

class FacultyResourceActionController extends AutoDisposeAsyncNotifier<void> {
  @override
  Future<void> build() async {}

  Future<ResourceItem> createAndUploadResource({
    required FacultyResourceFormInput input,
    required Uint8List fileBytes,
    required String mimeType,
  }) async {
    state = const AsyncLoading();
    try {
      appLog('FacultyResourceActionController.createAndUploadResource(): start');
      final resource = await ref
          .read(facultyRepositoryProvider)
          .createUploadAndComplete(
            input: input,
            fileBytes: fileBytes,
            mimeType: mimeType,
          );
      state = const AsyncData(null);
      return resource;
    } catch (error, stackTrace) {
      state = AsyncError(error, stackTrace);
      rethrow;
    }
  }

  Future<ResourceItem> retryUploadFlow({
    required FacultyUploadFlowError failedFlow,
    required Uint8List fileBytes,
    required String mimeType,
  }) async {
    state = const AsyncLoading();
    try {
      appLog('FacultyResourceActionController.retryUploadFlow(): phase=${failedFlow.phase.name}');
      final resource = await ref
          .read(facultyRepositoryProvider)
          .retryUploadFlow(
            failedFlow: failedFlow,
            fileBytes: fileBytes,
            mimeType: mimeType,
          );
      state = const AsyncData(null);
      return resource;
    } catch (error, stackTrace) {
      state = AsyncError(error, stackTrace);
      rethrow;
    }
  }

  Future<ResourceItem> createResource({
    required FacultyResourceFormInput input,
  }) async {
    state = const AsyncLoading();
    try {
      appLog('FacultyResourceActionController.createResource(): start');
      final resource = await ref
          .read(facultyRepositoryProvider)
          .createResource(input: input);
      state = const AsyncData(null);
      return resource;
    } catch (error, stackTrace) {
      state = AsyncError(error, stackTrace);
      rethrow;
    }
  }

  Future<ResourceItem> updateResource({
    required String resourceId,
    required FacultyResourceFormInput input,
  }) async {
    state = const AsyncLoading();
    try {
      appLog('FacultyResourceActionController.updateResource(): start resourceId=$resourceId');
      final resource = await ref.read(facultyRepositoryProvider).updateResource(
            resourceId: resourceId,
            input: input,
          );
      state = const AsyncData(null);
      return resource;
    } catch (error, stackTrace) {
      state = AsyncError(error, stackTrace);
      rethrow;
    }
  }

  Future<ResourceItem> submitResource({
    required String resourceId,
  }) async {
    state = const AsyncLoading();
    try {
      appLog('FacultyResourceActionController.submitResource(): start resourceId=$resourceId');
      final resource = await ref.read(facultyRepositoryProvider).submitResource(
            resourceId: resourceId,
          );
      state = const AsyncData(null);
      return resource;
    } catch (error, stackTrace) {
      state = AsyncError(error, stackTrace);
      rethrow;
    }
  }

  Future<ResourceItem> archiveResource({
    required String resourceId,
  }) async {
    state = const AsyncLoading();
    try {
      appLog('FacultyResourceActionController.archiveResource(): start resourceId=$resourceId');
      final resource = await ref.read(facultyRepositoryProvider).archiveResource(
            resourceId: resourceId,
          );
      state = const AsyncData(null);
      return resource;
    } catch (error, stackTrace) {
      state = AsyncError(error, stackTrace);
      rethrow;
    }
  }
}
