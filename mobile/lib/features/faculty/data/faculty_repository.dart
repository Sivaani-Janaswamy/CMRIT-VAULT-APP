import '../../../core/services/backend_api_service.dart';
import '../../subjects/domain/paginated_result.dart';
import '../../subjects/domain/resource_item.dart';
import '../domain/faculty_dashboard_summary.dart';
import '../domain/faculty_query_filters.dart';

class FacultyRepository {
  FacultyRepository({
    required this.apiService,
  });

  final BackendApiService apiService;

  Future<FacultyDashboardSummary> fetchDashboardSummary({
    String period = '30d',
  }) async {
    final response = await apiService.fetchFacultyDashboardSummary(period: period);
    final data = _extractData(response);
    final summaryJson = data['summary'];
    if (summaryJson is Map) {
      return FacultyDashboardSummary.fromJson(
        Map<String, dynamic>.from(summaryJson),
      );
    }
    throw const FormatException('Invalid /v1/faculty/dashboard/summary response');
  }

  Future<PaginatedResult<ResourceItem>> fetchFacultyResources({
    required FacultyResourcesFilters filters,
  }) async {
    final response = await apiService.fetchFacultyResources(
      filters: filters.toQueryParameters(),
    );
    final data = _extractData(response);
    return PaginatedResult<ResourceItem>.fromJson(data, ResourceItem.fromJson);
  }

  Map<String, dynamic> _extractData(Map<String, dynamic> response) {
    final data = response['data'];
    if (data is Map) {
      return Map<String, dynamic>.from(data);
    }
    throw const FormatException('Invalid API response');
  }
}
