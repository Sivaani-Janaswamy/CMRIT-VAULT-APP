import 'page_info.dart';

class PaginatedResult<T> {
  const PaginatedResult({
    required this.items,
    required this.pageInfo,
  });

  final List<T> items;
  final PageInfo pageInfo;

  factory PaginatedResult.fromJson(
    Map<String, dynamic> json,
    T Function(Map<String, dynamic>) fromJson,
  ) {
    final rawItems = json['items'];
    final items = rawItems is List
        ? rawItems
            .whereType<Map>()
            .map((item) => fromJson(Map<String, dynamic>.from(item)))
            .toList(growable: false)
        : <T>[];

    final rawPageInfo = json['pageInfo'];
    final pageInfo = rawPageInfo is Map
        ? PageInfo.fromJson(Map<String, dynamic>.from(rawPageInfo))
        : PageInfo(
            page: 1,
            pageSize: items.length,
            total: items.length,
          );

    return PaginatedResult<T>(
      items: items,
      pageInfo: pageInfo,
    );
  }
}
