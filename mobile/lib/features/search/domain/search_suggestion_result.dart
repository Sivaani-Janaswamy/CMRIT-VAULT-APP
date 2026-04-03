class SearchSuggestionResult {
  const SearchSuggestionResult({
    required this.resourceId,
    required this.title,
    required this.subjectName,
    required this.resourceType,
    required this.academicYear,
  });

  final String resourceId;
  final String title;
  final String subjectName;
  final String resourceType;
  final String academicYear;

  factory SearchSuggestionResult.fromJson(Map<String, dynamic> json) {
    return SearchSuggestionResult(
      resourceId: json['resourceId']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      subjectName: json['subjectName']?.toString() ?? '',
      resourceType: json['resourceType']?.toString() ?? '',
      academicYear: json['academicYear']?.toString() ?? '',
    );
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
