class DownloadEntry {
  const DownloadEntry({
    required this.id,
    required this.resourceId,
    required this.resourceTitle,
    required this.source,
    required this.downloadedAt,
  });

  final String id;
  final String resourceId;
  final String resourceTitle;
  final String source;
  final DateTime? downloadedAt;

  factory DownloadEntry.fromJson(Map<String, dynamic> json) {
    return DownloadEntry(
      id: json['id']?.toString() ?? '',
      resourceId: _readString(json['resourceId'], json['resource_id']),
      resourceTitle: _readString(json['resourceTitle'], json['resource_title']),
      source: json['source']?.toString() ?? 'mobile',
      downloadedAt: _readDateTime(json['downloadedAt'] ?? json['downloaded_at']),
    );
  }

  static String _readString(dynamic primary, [dynamic fallback]) {
    final value = primary ?? fallback;
    return value?.toString() ?? '';
  }

  static DateTime? _readDateTime(dynamic value) {
    if (value is String && value.isNotEmpty) {
      return DateTime.tryParse(value);
    }
    return null;
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
