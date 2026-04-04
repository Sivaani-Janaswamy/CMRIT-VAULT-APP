class AdminSearchReindexResult {
  const AdminSearchReindexResult({
    required this.jobId,
    required this.status,
  });

  final String jobId;
  final String status;

  factory AdminSearchReindexResult.fromJson(Map<String, dynamic> json) {
    return AdminSearchReindexResult(
      jobId: json['jobId']?.toString() ?? '',
      status: json['status']?.toString() ?? '',
    );
  }
}
