import '../../subjects/domain/resource_item.dart';

class FacultyResourceStats {
  const FacultyResourceStats({
    required this.resource,
    required this.downloads,
  });

  final ResourceItem resource;
  final FacultyResourceDownloadMetrics downloads;

  factory FacultyResourceStats.fromJson(Map<String, dynamic> json) {
    final resourceJson = json['resource'];
    final downloadsJson = json['downloads'];

    if (resourceJson is! Map) {
      throw const FormatException('Invalid faculty resource stats response: resource');
    }
    if (downloadsJson is! Map) {
      throw const FormatException('Invalid faculty resource stats response: downloads');
    }

    return FacultyResourceStats(
      resource: ResourceItem.fromJson(Map<String, dynamic>.from(resourceJson)),
      downloads: FacultyResourceDownloadMetrics.fromJson(
        Map<String, dynamic>.from(downloadsJson),
      ),
    );
  }
}

class FacultyResourceDownloadMetrics {
  const FacultyResourceDownloadMetrics({
    required this.total,
    required this.mobile,
    required this.web,
    required this.admin,
    required this.firstDownloadedAt,
    required this.lastDownloadedAt,
  });

  final int total;
  final int mobile;
  final int web;
  final int admin;
  final DateTime? firstDownloadedAt;
  final DateTime? lastDownloadedAt;

  factory FacultyResourceDownloadMetrics.fromJson(Map<String, dynamic> json) {
    final bySource = json['bySource'] is Map
        ? Map<String, dynamic>.from(json['bySource'] as Map)
        : (json['by_source'] is Map ? Map<String, dynamic>.from(json['by_source'] as Map) : <String, dynamic>{});

    return FacultyResourceDownloadMetrics(
      total: _readInt(json['total']),
      mobile: _readInt(bySource['mobile']),
      web: _readInt(bySource['web']),
      admin: _readInt(bySource['admin']),
      firstDownloadedAt: _readDateTime(
        json['firstDownloadedAt'] ?? json['first_downloaded_at'],
      ),
      lastDownloadedAt: _readDateTime(
        json['lastDownloadedAt'] ?? json['last_downloaded_at'],
      ),
    );
  }
}

int _readInt(dynamic value) {
  if (value is num) {
    return value.toInt();
  }
  return int.tryParse(value?.toString() ?? '') ?? 0;
}

DateTime? _readDateTime(dynamic value) {
  if (value is String && value.isNotEmpty) {
    return DateTime.tryParse(value);
  }
  return null;
}
