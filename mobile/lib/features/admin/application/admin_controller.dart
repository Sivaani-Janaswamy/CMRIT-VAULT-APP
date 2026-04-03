import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/services/backend_api_service.dart';
import '../../subjects/domain/paginated_result.dart';
import '../data/admin_repository.dart';
import '../domain/admin_dashboard_summary.dart';
import '../domain/admin_download_overview_item.dart';
import '../domain/admin_query_filters.dart';
import '../domain/admin_resource_overview_item.dart';

final adminRepositoryProvider = Provider<AdminRepository>((ref) {
  return AdminRepository(
    apiService: ref.watch(backendApiServiceProvider),
  );
});

final adminDashboardSummaryProvider = FutureProvider.autoDispose
    .family<AdminDashboardSummary, String>((ref, period) async {
  final repository = ref.watch(adminRepositoryProvider);
  return repository.fetchDashboardSummary(period: period);
});

final adminResourcesOverviewProvider = FutureProvider.autoDispose
    .family<PaginatedResult<AdminResourceOverviewItem>, AdminResourcesOverviewFilters>(
  (ref, filters) async {
    final repository = ref.watch(adminRepositoryProvider);
    return repository.fetchResourcesOverview(filters: filters);
  },
);

final adminDownloadsOverviewProvider = FutureProvider.autoDispose
    .family<PaginatedResult<AdminDownloadOverviewItem>, AdminDownloadsOverviewFilters>(
  (ref, filters) async {
    final repository = ref.watch(adminRepositoryProvider);
    return repository.fetchDownloadsOverview(filters: filters);
  },
);

final adminModerationControllerProvider =
    AutoDisposeAsyncNotifierProvider<AdminModerationController, void>(
  AdminModerationController.new,
);

class AdminModerationController extends AutoDisposeAsyncNotifier<void> {
  @override
  Future<void> build() async {}

  Future<void> updateResourceStatus({
    required String resourceId,
    required String status,
  }) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      await ref.read(adminRepositoryProvider).updateResourceStatus(
            resourceId: resourceId,
            status: status,
          );
    });
  }
}
