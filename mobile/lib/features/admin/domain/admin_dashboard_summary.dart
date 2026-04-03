class AdminDashboardSummary {
  const AdminDashboardSummary({
    required this.period,
    required this.startDate,
    required this.endDate,
    required this.users,
    required this.subjects,
    required this.resources,
    required this.downloads,
  });

  final String period;
  final DateTime? startDate;
  final DateTime? endDate;
  final AdminUserSummary users;
  final AdminSubjectSummary subjects;
  final AdminResourceSummary resources;
  final AdminDownloadSummary downloads;

  factory AdminDashboardSummary.fromJson(Map<String, dynamic> json) {
    return AdminDashboardSummary(
      period: json['period']?.toString() ?? '30d',
      startDate: _readDateTime(json['startDate'] ?? json['start_date']),
      endDate: _readDateTime(json['endDate'] ?? json['end_date']),
      users: AdminUserSummary.fromJson(_readMap(json['users'])),
      subjects: AdminSubjectSummary.fromJson(_readMap(json['subjects'])),
      resources: AdminResourceSummary.fromJson(_readMap(json['resources'])),
      downloads: AdminDownloadSummary.fromJson(_readMap(json['downloads'])),
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

class AdminUserSummary {
  const AdminUserSummary({
    required this.total,
    required this.active,
    required this.inactive,
    required this.student,
    required this.faculty,
    required this.admin,
  });

  final int total;
  final int active;
  final int inactive;
  final int student;
  final int faculty;
  final int admin;

  factory AdminUserSummary.fromJson(Map<String, dynamic> json) {
    final byRole = json['byRole'] is Map
        ? Map<String, dynamic>.from(json['byRole'] as Map)
        : (json['by_role'] is Map ? Map<String, dynamic>.from(json['by_role'] as Map) : <String, dynamic>{});

    return AdminUserSummary(
      total: _readInt(json['total']),
      active: _readInt(json['active']),
      inactive: _readInt(json['inactive']),
      student: _readInt(byRole['student']),
      faculty: _readInt(byRole['faculty']),
      admin: _readInt(byRole['admin']),
    );
  }
}

class AdminSubjectSummary {
  const AdminSubjectSummary({
    required this.total,
    required this.active,
  });

  final int total;
  final int active;

  factory AdminSubjectSummary.fromJson(Map<String, dynamic> json) {
    return AdminSubjectSummary(
      total: _readInt(json['total']),
      active: _readInt(json['active']),
    );
  }
}

class AdminResourceSummary {
  const AdminResourceSummary({
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

  factory AdminResourceSummary.fromJson(Map<String, dynamic> json) {
    final byStatus = json['byStatus'] is Map
        ? Map<String, dynamic>.from(json['byStatus'] as Map)
        : (json['by_status'] is Map ? Map<String, dynamic>.from(json['by_status'] as Map) : <String, dynamic>{});

    return AdminResourceSummary(
      total: _readInt(json['total']),
      draft: _readInt(byStatus['draft']),
      pendingReview: _readInt(byStatus['pending_review']),
      published: _readInt(byStatus['published']),
      rejected: _readInt(byStatus['rejected']),
      archived: _readInt(byStatus['archived']),
    );
  }
}

class AdminDownloadSummary {
  const AdminDownloadSummary({
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

  factory AdminDownloadSummary.fromJson(Map<String, dynamic> json) {
    final bySource = json['bySource'] is Map
        ? Map<String, dynamic>.from(json['bySource'] as Map)
        : (json['by_source'] is Map ? Map<String, dynamic>.from(json['by_source'] as Map) : <String, dynamic>{});

    return AdminDownloadSummary(
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
