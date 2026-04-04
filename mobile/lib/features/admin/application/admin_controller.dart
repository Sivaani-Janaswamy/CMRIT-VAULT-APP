import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/services/backend_api_service.dart';
import '../../subjects/domain/paginated_result.dart';
import '../../subjects/domain/subject.dart';
import '../data/admin_repository.dart';
import '../domain/admin_dashboard_summary.dart';
import '../domain/admin_download_overview_item.dart';
import '../domain/admin_query_filters.dart';
import '../domain/admin_resource_overview_item.dart';
import '../domain/admin_search_reindex_result.dart';
import '../domain/admin_user_item.dart';

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

final adminSubjectsProvider = FutureProvider.autoDispose<PaginatedResult<Subject>>(
  (ref) async {
    final repository = ref.watch(adminRepositoryProvider);
    return repository.fetchSubjects();
  },
);

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

final adminDownloadsAuditProvider = FutureProvider.autoDispose
    .family<PaginatedResult<AdminDownloadOverviewItem>, AdminDownloadsAuditFilters>(
  (ref, filters) async {
    final repository = ref.watch(adminRepositoryProvider);
    return repository.fetchDownloadsAudit(filters: filters);
  },
);

final adminUsersProvider = FutureProvider.autoDispose
    .family<PaginatedResult<AdminUserItem>, AdminUsersFilters>(
  (ref, filters) async {
    final repository = ref.watch(adminRepositoryProvider);
    return repository.fetchUsers(filters: filters);
  },
);

final adminUserDetailProvider =
    FutureProvider.autoDispose.family<AdminUserItem, String>((ref, userId) async {
  final repository = ref.watch(adminRepositoryProvider);
  return repository.fetchUserById(userId: userId);
});

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

final adminUserManagementControllerProvider =
    AutoDisposeAsyncNotifierProvider<AdminUserManagementController, void>(
  AdminUserManagementController.new,
);

class AdminUserManagementController extends AutoDisposeAsyncNotifier<void> {
  @override
  Future<void> build() async {}

  Future<void> updateUserRole({
    required String userId,
    required String role,
  }) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      await ref.read(adminRepositoryProvider).updateUserRole(
            userId: userId,
            role: role,
          );
    });
  }

  Future<void> updateUserStatus({
    required String userId,
    required bool isActive,
  }) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      await ref.read(adminRepositoryProvider).updateUserStatus(
            userId: userId,
            isActive: isActive,
          );
    });
  }
}

final adminSubjectManagementControllerProvider =
    AutoDisposeAsyncNotifierProvider<AdminSubjectManagementController, void>(
  AdminSubjectManagementController.new,
);

class AdminSubjectManagementController extends AutoDisposeAsyncNotifier<void> {
  @override
  Future<void> build() async {}

  Future<void> createSubject({
    required String code,
    required String name,
    required String department,
    required int semester,
    bool? isActive,
  }) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      await ref.read(adminRepositoryProvider).createSubject(
            code: code,
            name: name,
            department: department,
            semester: semester,
            isActive: isActive,
          );
    });
  }

  Future<void> updateSubject({
    required String subjectId,
    required String code,
    required String name,
    required String department,
    required int semester,
    required bool isActive,
  }) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      await ref.read(adminRepositoryProvider).updateSubject(
            subjectId: subjectId,
            code: code,
            name: name,
            department: department,
            semester: semester,
            isActive: isActive,
          );
    });
  }

  Future<void> deleteSubject({
    required String subjectId,
  }) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      await ref.read(adminRepositoryProvider).deleteSubject(
            subjectId: subjectId,
          );
    });
  }
}

final adminSearchReindexControllerProvider =
    AutoDisposeAsyncNotifierProvider<AdminSearchReindexController, AdminSearchReindexResult?>(
  AdminSearchReindexController.new,
);

class AdminSearchReindexController
    extends AutoDisposeAsyncNotifier<AdminSearchReindexResult?> {
  @override
  Future<AdminSearchReindexResult?> build() async {
    return null;
  }

  Future<void> triggerReindex() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      return ref.read(adminRepositoryProvider).triggerSearchReindex();
    });
  }
}
