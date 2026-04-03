class AdminResourceOverviewItem {
  const AdminResourceOverviewItem({
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
    required this.publishedAt,
    required this.createdAt,
    required this.updatedAt,
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

  factory AdminResourceOverviewItem.fromJson(Map<String, dynamic> json) {
    return AdminResourceOverviewItem(
      id: _readString(json['id']),
      subjectId: _readString(json['subjectId'], json['subject_id']),
      uploadedBy: _readString(json['uploadedBy'], json['uploaded_by']),
      title: _readString(json['title']),
      description: _readNullableString(json['description']),
      resourceType: _readString(json['resourceType'], json['resource_type']),
      academicYear: _readString(json['academicYear'], json['academic_year']),
      semester: _readInt(json['semester']),
      fileName: _readString(json['fileName'], json['file_name']),
      filePath: _readString(json['filePath'], json['file_path']),
      fileSizeBytes: _readInt(json['fileSizeBytes'] ?? json['file_size_bytes']),
      mimeType: _readString(json['mimeType'], json['mime_type']),
      status: _readString(json['status']),
      downloadCount: _readInt(json['downloadCount'] ?? json['download_count']),
      publishedAt: _readDateTime(json['publishedAt'] ?? json['published_at']),
      createdAt: _readDateTime(json['createdAt'] ?? json['created_at']),
      updatedAt: _readDateTime(json['updatedAt'] ?? json['updated_at']),
    );
  }

  bool get canModerate => status == 'pending_review';

  String get fileSizeLabel {
    if (fileSizeBytes >= 1024 * 1024) {
      return '${(fileSizeBytes / (1024 * 1024)).toStringAsFixed(1)} MB';
    }
    if (fileSizeBytes >= 1024) {
      return '${(fileSizeBytes / 1024).toStringAsFixed(1)} KB';
    }
    return '$fileSizeBytes B';
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
