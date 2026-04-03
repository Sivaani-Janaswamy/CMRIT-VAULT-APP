import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/services/backend_api_service.dart';
import '../../subjects/domain/page_info.dart';
import '../../subjects/domain/paginated_result.dart';
import '../data/search_repository.dart';
import '../domain/search_resource_result.dart';

final searchRepositoryProvider = Provider<SearchRepository>((ref) {
  return SearchRepository(
    apiService: ref.watch(backendApiServiceProvider),
  );
});

final searchResultsProvider =
    FutureProvider.autoDispose.family<PaginatedResult<SearchResourceResult>, String>(
  (ref, query) async {
    final trimmed = query.trim();
    if (trimmed.isEmpty) {
      return PaginatedResult<SearchResourceResult>(
        items: const [],
        pageInfo: const PageInfo(page: 1, pageSize: 0, total: 0),
      );
    }

    final repository = ref.watch(searchRepositoryProvider);
    return repository.searchResources(query: trimmed);
  },
);
