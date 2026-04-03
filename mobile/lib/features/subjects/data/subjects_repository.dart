import '../../../core/services/backend_api_service.dart';
import '../domain/download_url_result.dart';
import '../domain/paginated_result.dart';
import '../domain/resource_item.dart';
import '../domain/subject.dart';

class SubjectsRepository {
  SubjectsRepository({
    required this.apiService,
  });

  final BackendApiService apiService;

  Future<PaginatedResult<Subject>> fetchSubjects({
    int page = 1,
    int pageSize = 20,
  }) async {
    final response = await apiService.fetchSubjects(
      page: page,
      pageSize: pageSize,
    );
    return _parsePaginated(response, Subject.fromJson);
  }

  Future<PaginatedResult<ResourceItem>> fetchResources({
    required String subjectId,
    int page = 1,
    int pageSize = 20,
  }) async {
    final response = await apiService.fetchResources(
      subjectId: subjectId,
      page: page,
      pageSize: pageSize,
    );
    return _parsePaginated(response, ResourceItem.fromJson);
  }

  Future<ResourceItem> fetchResourceById(String resourceId) async {
    final response = await apiService.fetchResourceById(resourceId);
    final data = _extractData(response);
    final resourceJson = data['resource'];
    if (resourceJson is Map) {
      return ResourceItem.fromJson(Map<String, dynamic>.from(resourceJson));
    }
    throw const FormatException('Invalid /v1/resources/:id response');
  }

  Future<DownloadUrlResult> createDownloadUrl(String resourceId) async {
    final response = await apiService.createDownloadUrl(resourceId);
    final data = _extractData(response);
    return DownloadUrlResult.fromJson(data);
  }

  PaginatedResult<T> _parsePaginated<T>(
    Map<String, dynamic> response,
    T Function(Map<String, dynamic>) fromJson,
  ) {
    final data = _extractData(response);
    return PaginatedResult<T>.fromJson(data, fromJson);
  }

  Map<String, dynamic> _extractData(Map<String, dynamic> response) {
    final data = response['data'];
    if (data is Map) {
      return Map<String, dynamic>.from(data);
    }
    throw const FormatException('Invalid API response');
  }
}
