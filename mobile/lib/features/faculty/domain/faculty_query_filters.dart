class FacultyResourcesFilters {
  const FacultyResourcesFilters({
    this.page = 1,
    this.pageSize = 20,
    this.subjectId,
    this.department,
    this.semester,
    this.resourceType,
    this.academicYear,
    this.status,
  });

  final int page;
  final int pageSize;
  final String? subjectId;
  final String? department;
  final int? semester;
  final String? resourceType;
  final String? academicYear;
  final String? status;

  Map<String, String> toQueryParameters() {
    final query = <String, String>{
      'page': page.toString(),
      'pageSize': pageSize.toString(),
    };

    _addIfNotBlank(query, 'subjectId', subjectId);
    _addIfNotBlank(query, 'department', department);
    if (semester != null) {
      query['semester'] = semester.toString();
    }
    _addIfNotBlank(query, 'resourceType', resourceType);
    _addIfNotBlank(query, 'academicYear', academicYear);
    _addIfNotBlank(query, 'status', status);

    return query;
  }

  static void _addIfNotBlank(Map<String, String> query, String key, String? value) {
    final trimmed = value?.trim();
    if (trimmed != null && trimmed.isNotEmpty) {
      query[key] = trimmed;
    }
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is FacultyResourcesFilters &&
        other.page == page &&
        other.pageSize == pageSize &&
        other.subjectId == subjectId &&
        other.department == department &&
        other.semester == semester &&
        other.resourceType == resourceType &&
        other.academicYear == academicYear &&
        other.status == status;
  }

  @override
  int get hashCode => Object.hash(
        page,
        pageSize,
        subjectId,
        department,
        semester,
        resourceType,
        academicYear,
        status,
      );
}
