class PageInfo {
  const PageInfo({
    required this.page,
    required this.pageSize,
    required this.total,
  });

  final int page;
  final int pageSize;
  final int total;

  factory PageInfo.fromJson(Map<String, dynamic> json) {
    return PageInfo(
      page: _readInt(json['page'], fallback: 1),
      pageSize: _readInt(json['pageSize'], fallback: 0),
      total: _readInt(json['total'], fallback: 0),
    );
  }

  static int _readInt(dynamic value, {required int fallback}) {
    if (value is num) {
      return value.toInt();
    }
    return int.tryParse(value?.toString() ?? '') ?? fallback;
  }
}
