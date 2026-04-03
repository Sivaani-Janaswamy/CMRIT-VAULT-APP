class FacultyDashboardSummary {
  const FacultyDashboardSummary({
    required this.period,
    required this.startDate,
    required this.endDate,
    required this.resources,
    required this.downloads,
  });

  final String period;
  final DateTime? startDate;
  final DateTime? endDate;
  final FacultyResourceSummary resources;
  final FacultyDownloadSummary downloads;

  factory FacultyDashboardSummary.fromJson(Map<String, dynamic> json) {
    return FacultyDashboardSummary(
      period: json['period']?.toString() ?? '30d',
      startDate: _readDateTime(json['startDate'] ?? json['start_date']),
      endDate: _readDateTime(json['endDate'] ?? json['end_date']),
      resources: FacultyResourceSummary.fromJson(_readMap(json['resources'])),
      downloads: FacultyDownloadSummary.fromJson(_readMap(json['downloads'])),
    );
  }

  static Map<String, dynamic> _readMap(dynamic value) {
    if (value is Map) {
      return Map<String, dynamic>.from(value);
    }
    return <String, dynamic>{};
  }

  static DateTime? _readDateTime(dynamic value) {
    if (value is String && value.isNotEmpty) {
      return DateTime.tryParse(value);
    }
    return null;
  }
}

class FacultyResourceSummary {
  const FacultyResourceSummary({
    required this.total,
    required this.draft,
    required this.pendingReview,
    required this.published,
    required this.rejected,
    required this.archived,
  });

  final int total;
  final int draft;
  final int pendingReview;
  final int published;
  final int rejected;
  final int archived;

  factory FacultyResourceSummary.fromJson(Map<String, dynamic> json) {
    return FacultyResourceSummary(
      total: _readInt(json['total']),
      draft: _readInt(json['draft']),
      pendingReview: _readInt(json['pendingReview'] ?? json['pending_review']),
      published: _readInt(json['published']),
      rejected: _readInt(json['rejected']),
      archived: _readInt(json['archived']),
    );
  }
}

class FacultyDownloadSummary {
  const FacultyDownloadSummary({
    required this.total,
    required this.inPeriod,
    required this.mobile,
    required this.web,
    required this.admin,
  });

  final int total;
  final int inPeriod;
  final int mobile;
  final int web;
  final int admin;

  factory FacultyDownloadSummary.fromJson(Map<String, dynamic> json) {
    final bySource = json['bySource'] is Map
        ? Map<String, dynamic>.from(json['bySource'] as Map)
        : (json['by_source'] is Map ? Map<String, dynamic>.from(json['by_source'] as Map) : <String, dynamic>{});

    return FacultyDownloadSummary(
      total: _readInt(json['total']),
      inPeriod: _readInt(json['inPeriod'] ?? json['in_period']),
      mobile: _readInt(bySource['mobile']),
      web: _readInt(bySource['web']),
      admin: _readInt(bySource['admin']),
    );
  }
}

int _readInt(dynamic value) {
  if (value is num) {
    return value.toInt();
  }
  return int.tryParse(value?.toString() ?? '') ?? 0;
}
