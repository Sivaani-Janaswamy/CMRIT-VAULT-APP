class SearchResourceResult {
  const SearchResourceResult({
    required this.resourceId,
    required this.subjectId,
    required this.subjectCode,
    required this.subjectName,
    required this.department,
    required this.semester,
    required this.resourceType,
    required this.title,
    required this.description,
    required this.academicYear,
    required this.fileName,
    required this.status,
    required this.downloadCount,
    required this.publishedAt,
    required this.createdAt,
    required this.updatedAt,
    required this.ownerId,
  });

  final String resourceId;
  final String subjectId;
  final String subjectCode;
  final String subjectName;
  final String department;
  final int semester;
  final String resourceType;
  final String title;
  final String? description;
  final String academicYear;
  final String fileName;
  final String status;
  final int downloadCount;
  final DateTime? publishedAt;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  final String ownerId;

  factory SearchResourceResult.fromJson(Map<String, dynamic> json) {
    return SearchResourceResult(
      resourceId: json['resourceId']?.toString() ?? '',
      subjectId: json['subjectId']?.toString() ?? '',
      subjectCode: json['subjectCode']?.toString() ?? '',
      subjectName: json['subjectName']?.toString() ?? '',
      department: json['department']?.toString() ?? '',
      semester: _readInt(json['semester']),
      resourceType: json['resourceType']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      description: json['description']?.toString(),
      academicYear: json['academicYear']?.toString() ?? '',
      fileName: json['fileName']?.toString() ?? '',
      status: json['status']?.toString() ?? '',
      downloadCount: _readInt(json['downloadCount']),
      publishedAt: _readDateTime(json['publishedAt']),
      createdAt: _readDateTime(json['createdAt']),
      updatedAt: _readDateTime(json['updatedAt']),
      ownerId: json['ownerId']?.toString() ?? '',
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

  String get subtitleLabel {
    final parts = <String>[
      if (subjectName.isNotEmpty) subjectName,
      if (resourceType.isNotEmpty) resourceType,
      if (academicYear.isNotEmpty) academicYear,
    ];
    if (parts.isEmpty) {
      return 'No metadata available';
    }
    return parts.join(' • ');
  }
}
