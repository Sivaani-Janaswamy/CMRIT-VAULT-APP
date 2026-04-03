import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/services/backend_api_service.dart';
import '../../subjects/domain/paginated_result.dart';
import '../../subjects/domain/resource_item.dart';
import '../data/faculty_repository.dart';
import '../domain/faculty_dashboard_summary.dart';
import '../domain/faculty_query_filters.dart';

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
