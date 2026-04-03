import '../../subjects/domain/paginated_result.dart';
import '../../../core/services/backend_api_service.dart';
import '../domain/download_entry.dart';

class DownloadsRepository {
  DownloadsRepository({
    required this.apiService,
  });

  final BackendApiService apiService;

  Future<PaginatedResult<DownloadEntry>> fetchDownloadsHistory({
    int page = 1,
    int pageSize = 20,
  }) async {
    final response = await apiService.fetchDownloadsHistory(
      page: page,
      pageSize: pageSize,
    );
    final data = _extractData(response);
    return PaginatedResult<DownloadEntry>.fromJson(
      data,
      DownloadEntry.fromJson,
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
