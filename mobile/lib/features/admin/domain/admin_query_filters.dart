class AdminResourcesOverviewFilters {
  const AdminResourcesOverviewFilters({
    this.page = 1,
    this.pageSize = 20,
    this.subjectId,
    this.department,
    this.semester,
    this.resourceType,
    this.academicYear,
    this.status,
    this.uploadedBy,
  });

  final int page;
  final int pageSize;
  final String? subjectId;
  final String? department;
  final int? semester;
  final String? resourceType;
  final String? academicYear;
  final String? status;
  final String? uploadedBy;

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
    _addIfNotBlank(query, 'uploadedBy', uploadedBy);

    return query;
  }

  AdminResourcesOverviewFilters copyWith({
    int? page,
    int? pageSize,
    String? subjectId,
    String? department,
    int? semester,
    String? resourceType,
    String? academicYear,
    String? status,
    String? uploadedBy,
    bool clearSubjectId = false,
    bool clearDepartment = false,
    bool clearSemester = false,
    bool clearResourceType = false,
    bool clearAcademicYear = false,
    bool clearStatus = false,
    bool clearUploadedBy = false,
  }) {
    return AdminResourcesOverviewFilters(
      page: page ?? this.page,
      pageSize: pageSize ?? this.pageSize,
      subjectId: clearSubjectId ? null : (subjectId ?? this.subjectId),
      department: clearDepartment ? null : (department ?? this.department),
      semester: clearSemester ? null : (semester ?? this.semester),
      resourceType: clearResourceType ? null : (resourceType ?? this.resourceType),
      academicYear: clearAcademicYear ? null : (academicYear ?? this.academicYear),
      status: clearStatus ? null : (status ?? this.status),
      uploadedBy: clearUploadedBy ? null : (uploadedBy ?? this.uploadedBy),
    );
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
    return other is AdminResourcesOverviewFilters &&
        other.page == page &&
        other.pageSize == pageSize &&
        other.subjectId == subjectId &&
        other.department == department &&
        other.semester == semester &&
        other.resourceType == resourceType &&
        other.academicYear == academicYear &&
        other.status == status &&
        other.uploadedBy == uploadedBy;
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
        uploadedBy,
      );
}

class AdminDownloadsOverviewFilters {
  const AdminDownloadsOverviewFilters({
    this.page = 1,
    this.pageSize = 20,
    this.userId,
    this.resourceId,
    this.source,
    this.fromDate,
    this.toDate,
  });

  final int page;
  final int pageSize;
  final String? userId;
  final String? resourceId;
  final String? source;
  final String? fromDate;
  final String? toDate;

  Map<String, String> toQueryParameters() {
    final query = <String, String>{
      'page': page.toString(),
      'pageSize': pageSize.toString(),
    };

    _addIfNotBlank(query, 'userId', userId);
    _addIfNotBlank(query, 'resourceId', resourceId);
    _addIfNotBlank(query, 'source', source);
    _addIfNotBlank(query, 'fromDate', fromDate);
    _addIfNotBlank(query, 'toDate', toDate);

    return query;
  }

  AdminDownloadsOverviewFilters copyWith({
    int? page,
    int? pageSize,
    String? userId,
    String? resourceId,
    String? source,
    String? fromDate,
    String? toDate,
    bool clearUserId = false,
    bool clearResourceId = false,
    bool clearSource = false,
    bool clearFromDate = false,
    bool clearToDate = false,
  }) {
    return AdminDownloadsOverviewFilters(
      page: page ?? this.page,
      pageSize: pageSize ?? this.pageSize,
      userId: clearUserId ? null : (userId ?? this.userId),
      resourceId: clearResourceId ? null : (resourceId ?? this.resourceId),
      source: clearSource ? null : (source ?? this.source),
      fromDate: clearFromDate ? null : (fromDate ?? this.fromDate),
      toDate: clearToDate ? null : (toDate ?? this.toDate),
    );
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
    return other is AdminDownloadsOverviewFilters &&
        other.page == page &&
        other.pageSize == pageSize &&
        other.userId == userId &&
        other.resourceId == resourceId &&
        other.source == source &&
        other.fromDate == fromDate &&
        other.toDate == toDate;
  }

  @override
  int get hashCode => Object.hash(
        page,
        pageSize,
        userId,
        resourceId,
        source,
        fromDate,
        toDate,
      );
}

class AdminUsersFilters {
  const AdminUsersFilters({
    this.page = 1,
    this.pageSize = 20,
    this.role,
    this.department,
    this.semester,
  });

  final int page;
  final int pageSize;
  final String? role;
  final String? department;
  final int? semester;

  Map<String, String> toQueryParameters() {
    final query = <String, String>{
      'page': page.toString(),
      'pageSize': pageSize.toString(),
    };

    _addIfNotBlank(query, 'role', role);
    _addIfNotBlank(query, 'department', department);
    if (semester != null) {
      query['semester'] = semester.toString();
    }

    return query;
  }

  AdminUsersFilters copyWith({
    int? page,
    int? pageSize,
    String? role,
    String? department,
    int? semester,
    bool clearRole = false,
    bool clearDepartment = false,
    bool clearSemester = false,
  }) {
    return AdminUsersFilters(
      page: page ?? this.page,
      pageSize: pageSize ?? this.pageSize,
      role: clearRole ? null : (role ?? this.role),
      department: clearDepartment ? null : (department ?? this.department),
      semester: clearSemester ? null : (semester ?? this.semester),
    );
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
    return other is AdminUsersFilters &&
        other.page == page &&
        other.pageSize == pageSize &&
        other.role == role &&
        other.department == department &&
        other.semester == semester;
  }

  @override
  int get hashCode => Object.hash(
        page,
        pageSize,
        role,
        department,
        semester,
      );
}

class AdminDownloadsAuditFilters {
  const AdminDownloadsAuditFilters({
    this.page = 1,
    this.pageSize = 20,
    this.userId,
    this.resourceId,
    this.startDate,
    this.endDate,
  });

  final int page;
  final int pageSize;
  final String? userId;
  final String? resourceId;
  final String? startDate;
  final String? endDate;

  Map<String, String> toQueryParameters() {
    final query = <String, String>{
      'page': page.toString(),
      'pageSize': pageSize.toString(),
    };

    _addIfNotBlank(query, 'userId', userId);
    _addIfNotBlank(query, 'resourceId', resourceId);
    _addIfNotBlank(query, 'startDate', startDate);
    _addIfNotBlank(query, 'endDate', endDate);

    return query;
  }

  AdminDownloadsAuditFilters copyWith({
    int? page,
    int? pageSize,
    String? userId,
    String? resourceId,
    String? startDate,
    String? endDate,
    bool clearUserId = false,
    bool clearResourceId = false,
    bool clearStartDate = false,
    bool clearEndDate = false,
  }) {
    return AdminDownloadsAuditFilters(
      page: page ?? this.page,
      pageSize: pageSize ?? this.pageSize,
      userId: clearUserId ? null : (userId ?? this.userId),
      resourceId: clearResourceId ? null : (resourceId ?? this.resourceId),
      startDate: clearStartDate ? null : (startDate ?? this.startDate),
      endDate: clearEndDate ? null : (endDate ?? this.endDate),
    );
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
    return other is AdminDownloadsAuditFilters &&
        other.page == page &&
        other.pageSize == pageSize &&
        other.userId == userId &&
        other.resourceId == resourceId &&
        other.startDate == startDate &&
        other.endDate == endDate;
  }

  @override
  int get hashCode => Object.hash(
        page,
        pageSize,
        userId,
        resourceId,
        startDate,
        endDate,
      );
}
