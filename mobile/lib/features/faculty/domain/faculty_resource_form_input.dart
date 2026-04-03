class FacultyResourceFormInput {
  const FacultyResourceFormInput({
    required this.subjectId,
    required this.title,
    required this.description,
    required this.resourceType,
    required this.academicYear,
    required this.semester,
    required this.fileName,
    required this.filePath,
    required this.fileSizeBytes,
    required this.mimeType,
  });

  final String subjectId;
  final String title;
  final String? description;
  final String resourceType;
  final String academicYear;
  final int semester;
  final String fileName;
  final String filePath;
  final int fileSizeBytes;
  final String mimeType;

  Map<String, dynamic> toCreateJson() {
    return {
      'subjectId': subjectId,
      'title': title,
      'description': description,
      'resourceType': resourceType,
      'academicYear': academicYear,
      'semester': semester,
      'fileName': fileName,
      'filePath': filePath,
      'fileSizeBytes': fileSizeBytes,
      'mimeType': mimeType,
    };
  }

  Map<String, dynamic> toUpdateJson() {
    return {
      'subjectId': subjectId,
      'title': title,
      'description': description,
      'resourceType': resourceType,
      'academicYear': academicYear,
      'semester': semester,
      'fileName': fileName,
      'filePath': filePath,
      'fileSizeBytes': fileSizeBytes,
      'mimeType': mimeType,
    };
  }
}
