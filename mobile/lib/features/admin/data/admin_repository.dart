import '../../../core/services/backend_api_service.dart';
import '../../subjects/domain/paginated_result.dart';
import '../domain/admin_dashboard_summary.dart';
import '../domain/admin_download_overview_item.dart';
import '../domain/admin_query_filters.dart';
import '../domain/admin_resource_overview_item.dart';

class AdminRepository {
  AdminRepository({
    required this.apiService,
  });

  final BackendApiService apiService;

  Future<AdminDashboardSummary> fetchDashboardSummary({
    String period = '30d',
  }) async {
    final response = await apiService.fetchAdminDashboardSummary(period: period);
    final data = _extractData(response);
    final summaryJson = data['summary'];
    if (summaryJson is Map) {
      return AdminDashboardSummary.fromJson(Map<String, dynamic>.from(summaryJson));
    }
    throw const FormatException('Invalid /v1/admin/dashboard/summary response');
  }

  Future<PaginatedResult<AdminResourceOverviewItem>> fetchResourcesOverview({
    required AdminResourcesOverviewFilters filters,
  }) async {
    final response = await apiService.fetchAdminResourcesOverview(
      filters: filters.toQueryParameters(),
    );
    final data = _extractData(response);
    return PaginatedResult<AdminResourceOverviewItem>.fromJson(
      data,
      AdminResourceOverviewItem.fromJson,
    );
  }

  Future<PaginatedResult<AdminDownloadOverviewItem>> fetchDownloadsOverview({
    required AdminDownloadsOverviewFilters filters,
  }) async {
    final response = await apiService.fetchAdminDownloadsOverview(
      filters: filters.toQueryParameters(),
    );
    final data = _extractData(response);
    return PaginatedResult<AdminDownloadOverviewItem>.fromJson(
      data,
      AdminDownloadOverviewItem.fromJson,
    );
  }

  Future<AdminResourceOverviewItem> updateResourceStatus({
    required String resourceId,
    required String status,
  }) async {
    final response = await apiService.updateAdminResourceStatus(
      resourceId: resourceId,
      status: status,
    );
    final data = _extractData(response);
    final resourceJson = data['resource'];
    if (resourceJson is Map) {
      return AdminResourceOverviewItem.fromJson(
        Map<String, dynamic>.from(resourceJson),
      );
    }
    throw const FormatException('Invalid PATCH /v1/admin/resources/:id/status response');
  }

  Map<String, dynamic> _extractData(Map<String, dynamic> response) {
    final data = response['data'];
    if (data is Map) {
      return Map<String, dynamic>.from(data);
    }
    throw const FormatException('Invalid API response');
  }
}
