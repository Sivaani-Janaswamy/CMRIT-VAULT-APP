import 'faculty_upload_session.dart';

enum FacultyUploadFailurePhase {
  upload,
  complete,
}

class FacultyUploadFlowError implements Exception {
  const FacultyUploadFlowError({
    required this.phase,
    required this.resourceId,
    required this.uploadSession,
    required this.message,
  });

  final FacultyUploadFailurePhase phase;
  final String resourceId;
  final FacultyUploadSession uploadSession;
  final String message;

  bool get canRetry => true;

  @override
  String toString() => message;
}
