import '../../../core/services/backend_api_service.dart';
import '../../subjects/domain/paginated_result.dart';
import '../domain/search_resource_result.dart';

class SearchRepository {
  SearchRepository({
    required this.apiService,
  });

  final BackendApiService apiService;

  Future<PaginatedResult<SearchResourceResult>> searchResources({
    required String query,
    int page = 1,
    int pageSize = 20,
  }) async {
    final response = await apiService.searchResources(
      query: query,
      page: page,
      pageSize: pageSize,
    );
    final data = _extractData(response);
    return PaginatedResult<SearchResourceResult>.fromJson(
      data,
      SearchResourceResult.fromJson,
    );
  }

  Map<String, dynamic> _extractData(Map<String, dynamic> response) {
    final data = response['data'];
    if (data is Map) {
      return Map<String, dynamic>.from(data);
    }
    throw const FormatException('Invalid API response');
  }
}
