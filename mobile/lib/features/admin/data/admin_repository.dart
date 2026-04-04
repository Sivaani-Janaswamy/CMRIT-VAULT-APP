import '../../../core/services/backend_api_service.dart';
import '../../subjects/domain/paginated_result.dart';
import '../../subjects/domain/subject.dart';
import '../domain/admin_dashboard_summary.dart';
import '../domain/admin_download_overview_item.dart';
import '../domain/admin_query_filters.dart';
import '../domain/admin_resource_overview_item.dart';
import '../domain/admin_search_reindex_result.dart';
import '../domain/admin_user_item.dart';

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

  Future<PaginatedResult<AdminDownloadOverviewItem>> fetchDownloadsAudit({
    required AdminDownloadsAuditFilters filters,
  }) async {
    final response = await apiService.fetchAdminDownloadsAudit(
      filters: filters.toQueryParameters(),
    );
    final data = _extractData(response);
    return PaginatedResult<AdminDownloadOverviewItem>.fromJson(
      data,
      AdminDownloadOverviewItem.fromJson,
    );
  }

  Future<PaginatedResult<AdminUserItem>> fetchUsers({
    required AdminUsersFilters filters,
  }) async {
    final response = await apiService.fetchAdminUsers(
      filters: filters.toQueryParameters(),
    );
    final data = _extractData(response);
    return PaginatedResult<AdminUserItem>.fromJson(
      data,
      AdminUserItem.fromJson,
    );
  }

  Future<AdminUserItem> fetchUserById({
    required String userId,
  }) async {
    final response = await apiService.fetchAdminUserById(userId: userId);
    final data = _extractData(response);
    final userJson = data['user'];
    if (userJson is Map) {
      return AdminUserItem.fromJson(Map<String, dynamic>.from(userJson));
    }
    throw const FormatException('Invalid GET /v1/admin/users/:id response');
  }

  Future<AdminUserItem> updateUserRole({
    required String userId,
    required String role,
  }) async {
    final response = await apiService.updateAdminUserRole(
      userId: userId,
      role: role,
    );
    final data = _extractData(response);
    final userJson = data['user'];
    if (userJson is Map) {
      return AdminUserItem.fromJson(Map<String, dynamic>.from(userJson));
    }
    throw const FormatException('Invalid PATCH /v1/admin/users/:id/role response');
  }

  Future<AdminUserItem> updateUserStatus({
    required String userId,
    required bool isActive,
  }) async {
    final response = await apiService.updateAdminUserStatus(
      userId: userId,
      isActive: isActive,
    );
    final data = _extractData(response);
    final userJson = data['user'];
    if (userJson is Map) {
      return AdminUserItem.fromJson(Map<String, dynamic>.from(userJson));
    }
    throw const FormatException('Invalid PATCH /v1/admin/users/:id/status response');
  }

  Future<Subject> createSubject({
    required String code,
    required String name,
    required String department,
    required int semester,
    bool? isActive,
  }) async {
    final response = await apiService.createAdminSubject(
      code: code,
      name: name,
      department: department,
      semester: semester,
      isActive: isActive,
    );

    final data = _extractData(response);
    final subjectJson = data['subject'];
    if (subjectJson is Map) {
      return Subject.fromJson(Map<String, dynamic>.from(subjectJson));
    }
    throw const FormatException('Invalid POST /v1/admin/subjects response');
  }

  Future<PaginatedResult<Subject>> fetchSubjects({
    int page = 1,
    int pageSize = 100,
  }) async {
    final response = await apiService.fetchSubjects(
      page: page,
      pageSize: pageSize,
    );
    final data = _extractData(response);
    return PaginatedResult<Subject>.fromJson(
      data,
      Subject.fromJson,
    );
  }

  Future<Subject> updateSubject({
    required String subjectId,
    required String code,
    required String name,
    required String department,
    required int semester,
    required bool isActive,
  }) async {
    final response = await apiService.updateAdminSubject(
      subjectId: subjectId,
      code: code,
      name: name,
      department: department,
      semester: semester,
      isActive: isActive,
    );
    final data = _extractData(response);
    final subjectJson = data['subject'];
    if (subjectJson is Map) {
      return Subject.fromJson(Map<String, dynamic>.from(subjectJson));
    }
    throw const FormatException('Invalid PATCH /v1/admin/subjects/:id response');
  }

  Future<Subject> deleteSubject({
    required String subjectId,
  }) async {
    final response = await apiService.deleteAdminSubject(subjectId: subjectId);
    final data = _extractData(response);
    final subjectJson = data['subject'];
    if (subjectJson is Map) {
      return Subject.fromJson(Map<String, dynamic>.from(subjectJson));
    }
    throw const FormatException('Invalid DELETE /v1/admin/subjects/:id response');
  }

  Future<AdminSearchReindexResult> triggerSearchReindex() async {
    final response = await apiService.triggerAdminSearchReindex();
    final data = _extractData(response);
    return AdminSearchReindexResult.fromJson(data);
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
