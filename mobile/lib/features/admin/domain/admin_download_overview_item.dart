class AdminDownloadOverviewItem {
  const AdminDownloadOverviewItem({
    required this.id,
    required this.resourceId,
    required this.userId,
    required this.resourceTitle,
    required this.source,
    required this.ipHash,
    required this.userAgent,
    required this.downloadedAt,
    required this.resourceType,
    required this.subjectId,
  });

  final String id;
  final String resourceId;
  final String userId;
  final String resourceTitle;
  final String source;
  final String? ipHash;
  final String? userAgent;
  final DateTime? downloadedAt;
  final String resourceType;
  final String subjectId;

  factory AdminDownloadOverviewItem.fromJson(Map<String, dynamic> json) {
    return AdminDownloadOverviewItem(
      id: _readString(json['id']),
      resourceId: _readString(json['resourceId'], json['resource_id']),
      userId: _readString(json['userId'], json['user_id']),
      resourceTitle: _readString(json['resourceTitle'], json['resource_title']),
      source: _readString(json['source']),
      ipHash: _readNullableString(json['ipHash'] ?? json['ip_hash']),
      userAgent: _readNullableString(json['userAgent'] ?? json['user_agent']),
      downloadedAt: _readDateTime(json['downloadedAt'] ?? json['downloaded_at']),
      resourceType: _readString(json['resourceType'], json['resource_type']),
      subjectId: _readString(json['subjectId'], json['subject_id']),
    );
  }

  String get downloadedAtLabel {
    final value = downloadedAt;
    if (value == null) {
      return 'Unknown time';
    }

    final local = value.toLocal();
    final date =
        '${local.year}-${local.month.toString().padLeft(2, '0')}-${local.day.toString().padLeft(2, '0')}';
    final time =
        '${local.hour.toString().padLeft(2, '0')}:${local.minute.toString().padLeft(2, '0')}';
    return '$date • $time';
  }
}

String _readString(dynamic primary, [dynamic fallback]) {
  return (primary ?? fallback)?.toString() ?? '';
}

String? _readNullableString(dynamic value) {
  final text = value?.toString();
  if (text == null || text.trim().isEmpty) {
    return null;
  }
  return text;
}

DateTime? _readDateTime(dynamic value) {
  if (value is String && value.isNotEmpty) {
    return DateTime.tryParse(value);
  }
  return null;
}
