class AppUser {
  const AppUser({
    required this.id,
    required this.fullName,
    required this.email,
    required this.role,
    this.rollNo,
    this.department,
    this.semester,
    this.isActive = true,
  });

  final String id;
  final String fullName;
  final String email;
  final String role;
  final String? rollNo;
  final String? department;
  final int? semester;
  final bool isActive;

  factory AppUser.fromJson(Map<String, dynamic> json) {
    return AppUser(
      id: json['id'] as String,
      fullName: json['fullName'] as String? ?? '',
      email: json['email'] as String? ?? '',
      role: json['role'] as String? ?? 'student',
      rollNo: json['rollNo'] as String?,
      department: json['department'] as String?,
      semester: json['semester'] as int?,
      isActive: json['isActive'] as bool? ?? true,
    );
  }
}
