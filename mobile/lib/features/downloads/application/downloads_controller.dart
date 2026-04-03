import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/services/backend_api_service.dart';
import '../../subjects/domain/paginated_result.dart';
import '../data/downloads_repository.dart';
import '../domain/download_entry.dart';

final downloadsRepositoryProvider = Provider<DownloadsRepository>((ref) {
  return DownloadsRepository(
    apiService: ref.watch(backendApiServiceProvider),
  );
});

final downloadsHistoryProvider =
    FutureProvider.autoDispose<PaginatedResult<DownloadEntry>>((ref) async {
  final repository = ref.watch(downloadsRepositoryProvider);
  return repository.fetchDownloadsHistory();
});
