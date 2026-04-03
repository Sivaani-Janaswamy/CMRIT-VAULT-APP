class ResourceItem {
  const ResourceItem({
    required this.id,
    required this.subjectId,
    required this.uploadedBy,
    required this.title,
    required this.description,
    required this.resourceType,
    required this.academicYear,
    required this.semester,
    required this.fileName,
    required this.filePath,
    required this.fileSizeBytes,
    required this.mimeType,
    required this.status,
    required this.downloadCount,
    required this.createdAt,
    required this.updatedAt,
    this.publishedAt,
  });

  final String id;
  final String subjectId;
  final String uploadedBy;
  final String title;
  final String? description;
  final String resourceType;
  final String academicYear;
  final int semester;
  final String fileName;
  final String filePath;
  final int fileSizeBytes;
  final String mimeType;
  final String status;
  final int downloadCount;
  final DateTime? publishedAt;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  factory ResourceItem.fromJson(Map<String, dynamic> json) {
    return ResourceItem(
      id: json['id'] as String? ?? '',
      subjectId: json['subjectId'] as String? ?? '',
      uploadedBy: json['uploadedBy'] as String? ?? '',
      title: json['title'] as String? ?? '',
      description: json['description'] as String?,
      resourceType: json['resourceType'] as String? ?? '',
      academicYear: json['academicYear'] as String? ?? '',
      semester: _readInt(json['semester']),
      fileName: json['fileName'] as String? ?? '',
      filePath: json['filePath'] as String? ?? '',
      fileSizeBytes: _readInt(json['fileSizeBytes']),
      mimeType: json['mimeType'] as String? ?? '',
      status: json['status'] as String? ?? '',
      downloadCount: _readInt(json['downloadCount']),
      publishedAt: _readDateTime(json['publishedAt']),
      createdAt: _readDateTime(json['createdAt']),
      updatedAt: _readDateTime(json['updatedAt']),
    );
  }

  static int _readInt(dynamic value) {
    if (value is num) {
      return value.toInt();
    }
    return int.tryParse(value?.toString() ?? '') ?? 0;
  }

  static DateTime? _readDateTime(dynamic value) {
    if (value is String && value.isNotEmpty) {
      return DateTime.tryParse(value);
    }
    return null;
  }

  String get fileSizeLabel {
    final bytes = fileSizeBytes;
    if (bytes >= 1024 * 1024) {
      return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
    }
    if (bytes >= 1024) {
      return '${(bytes / 1024).toStringAsFixed(1)} KB';
    }
    return '$bytes B';
  }
}
