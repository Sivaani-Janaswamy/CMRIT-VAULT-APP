class DownloadUrlResult {
  const DownloadUrlResult({
    required this.downloadUrl,
    required this.expiresAt,
  });

  final String downloadUrl;
  final DateTime? expiresAt;

  factory DownloadUrlResult.fromJson(Map<String, dynamic> json) {
    return DownloadUrlResult(
      downloadUrl: json['downloadUrl'] as String? ?? '',
      expiresAt: _readDateTime(json['expiresAt']),
    );
  }

  static DateTime? _readDateTime(dynamic value) {
    if (value is String && value.isNotEmpty) {
      return DateTime.tryParse(value);
    }
    return null;
  }
}
