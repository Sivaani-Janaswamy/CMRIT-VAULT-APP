class AdminUserItem {
  const AdminUserItem({
    required this.id,
    required this.email,
    required this.fullName,
    required this.role,
    required this.isActive,
    required this.rollNo,
    required this.department,
    required this.semester,
  });

  final String id;
  final String email;
  final String fullName;
  final String role;
  final bool isActive;
  final String? rollNo;
  final String? department;
  final int? semester;

  factory AdminUserItem.fromJson(Map<String, dynamic> json) {
    return AdminUserItem(
      id: _readString(json['id']),
      email: _readString(json['email']),
      fullName: _readString(json['fullName'], json['full_name']),
      role: _readString(json['role']),
      isActive: _readBool(json['isActive'], json['is_active']),
      rollNo: _readNullableString(json['rollNo'], json['roll_no']),
      department: _readNullableString(json['department']),
      semester: _readNullableInt(json['semester']),
    );
  }

  static String _readString(dynamic primary, [dynamic secondary]) {
    final value = primary ?? secondary;
    return value?.toString() ?? '';
  }

  static String? _readNullableString(dynamic primary, [dynamic secondary]) {
    final value = primary ?? secondary;
    if (value == null) {
      return null;
    }
    final text = value.toString();
    return text.isEmpty ? null : text;
  }

  static bool _readBool(dynamic primary, [dynamic secondary]) {
    final value = primary ?? secondary;
    if (value is bool) {
      return value;
    }
    return value?.toString().toLowerCase() == 'true';
  }

  static int? _readNullableInt(dynamic value) {
    if (value is num) {
      return value.toInt();
    }
    return int.tryParse(value?.toString() ?? '');
  }
}
