class FacultyUploadSession {
  const FacultyUploadSession({
    required this.resourceId,
    required this.uploadPath,
    required this.uploadToken,
    required this.signedUploadUrl,
    required this.expiresAt,
  });

  final String resourceId;
  final String uploadPath;
  final String uploadToken;
  final String signedUploadUrl;
  final DateTime? expiresAt;

  factory FacultyUploadSession.fromJson(Map<String, dynamic> json) {
    return FacultyUploadSession(
      resourceId: json['resourceId']?.toString() ?? '',
      uploadPath: json['uploadPath']?.toString() ?? '',
      uploadToken: json['uploadToken']?.toString() ?? '',
      signedUploadUrl: json['signedUploadUrl']?.toString() ?? '',
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
