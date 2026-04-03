class FacultyUploadSession {
  const FacultyUploadSession({
    required this.resourceId,
    required this.uploadPath,
    required this.expiresAt,
  });

  final String resourceId;
  final String uploadPath;
  final DateTime? expiresAt;

  factory FacultyUploadSession.fromJson(Map<String, dynamic> json) {
    return FacultyUploadSession(
      resourceId: json['resourceId']?.toString() ?? '',
      uploadPath: json['uploadPath']?.toString() ?? '',
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
