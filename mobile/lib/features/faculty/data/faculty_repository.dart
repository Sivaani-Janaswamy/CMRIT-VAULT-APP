import '../../../core/services/backend_api_service.dart';
import 'dart:typed_data';

import '../../subjects/domain/paginated_result.dart';
import '../../subjects/domain/resource_item.dart';
import '../domain/faculty_dashboard_summary.dart';
import '../domain/faculty_query_filters.dart';
import '../domain/faculty_resource_form_input.dart';
import '../domain/faculty_resource_stats.dart';
import '../domain/faculty_upload_flow_error.dart';
import '../domain/faculty_upload_session.dart';

class FacultyRepository {
  FacultyRepository({
    required this.apiService,
  });

  final BackendApiService apiService;

  Future<FacultyDashboardSummary> fetchDashboardSummary({
    String period = '30d',
  }) async {
    final response = await apiService.fetchFacultyDashboardSummary(period: period);
    final data = _extractData(response);
    final summaryJson = data['summary'];
    if (summaryJson is Map) {
      return FacultyDashboardSummary.fromJson(
        Map<String, dynamic>.from(summaryJson),
      );
    }
    throw const FormatException('Invalid /v1/faculty/dashboard/summary response');
  }

  Future<PaginatedResult<ResourceItem>> fetchFacultyResources({
    required FacultyResourcesFilters filters,
  }) async {
    final response = await apiService.fetchFacultyResources(
      filters: filters.toQueryParameters(),
    );
    final data = _extractData(response);
    return PaginatedResult<ResourceItem>.fromJson(data, ResourceItem.fromJson);
  }

  Future<(ResourceItem, FacultyUploadSession)> createResourceDraft({
    required FacultyResourceFormInput input,
  }) async {
    final response = await apiService.createResource(
      body: input.toCreateJson(),
    );
    final data = _extractData(response);

    final resourceJson = data['resource'];
    final uploadSessionJson = data['uploadSession'] ?? data['upload_session'];
    if (resourceJson is! Map || uploadSessionJson is! Map) {
      throw const FormatException('Invalid create resource response');
    }

    final resource = ResourceItem.fromJson(Map<String, dynamic>.from(resourceJson));
    final uploadSession = FacultyUploadSession.fromJson(
      Map<String, dynamic>.from(uploadSessionJson),
    );

    return (resource, uploadSession);
  }

  Future<void> uploadWithSession({
    required FacultyUploadSession uploadSession,
    required Uint8List fileBytes,
    required String mimeType,
  }) async {
    await apiService.uploadFileWithSession(
      uploadPath: uploadSession.uploadPath,
      fileBytes: fileBytes,
      mimeType: mimeType,
    );
  }

  Future<ResourceItem> completeUpload({
    required String resourceId,
  }) async {
    final response = await apiService.completeResource(resourceId: resourceId);
    return _extractResource(response);
  }

  Future<ResourceItem> createUploadAndComplete({
    required FacultyResourceFormInput input,
    required Uint8List fileBytes,
    required String mimeType,
  }) async {
    final (resource, uploadSession) = await createResourceDraft(input: input);

    try {
      await uploadWithSession(
        uploadSession: uploadSession,
        fileBytes: fileBytes,
        mimeType: mimeType,
      );
    } catch (error) {
      throw FacultyUploadFlowError(
        phase: FacultyUploadFailurePhase.upload,
        resourceId: resource.id,
        uploadSession: uploadSession,
        message: 'Upload failed: $error',
      );
    }

    try {
      return await completeUpload(resourceId: resource.id);
    } catch (error) {
      throw FacultyUploadFlowError(
        phase: FacultyUploadFailurePhase.complete,
        resourceId: resource.id,
        uploadSession: uploadSession,
        message: 'Upload completion failed: $error',
      );
    }
  }

  Future<ResourceItem> retryUploadFlow({
    required FacultyUploadFlowError failedFlow,
    required Uint8List fileBytes,
    required String mimeType,
  }) async {
    if (failedFlow.phase == FacultyUploadFailurePhase.upload) {
      await uploadWithSession(
        uploadSession: failedFlow.uploadSession,
        fileBytes: fileBytes,
        mimeType: mimeType,
      );
    }

    return completeUpload(resourceId: failedFlow.resourceId);
  }

  Future<ResourceItem> createResource({
    required FacultyResourceFormInput input,
  }) async {
    final response = await apiService.createResource(
      body: input.toCreateJson(),
    );
    return _extractResource(response);
  }

  Future<ResourceItem> updateResource({
    required String resourceId,
    required FacultyResourceFormInput input,
  }) async {
    final response = await apiService.updateResource(
      resourceId: resourceId,
      body: input.toUpdateJson(),
    );
    return _extractResource(response);
  }

  Future<ResourceItem> submitResource({
    required String resourceId,
    String? reviewNote,
  }) async {
    final response = await apiService.submitResource(
      resourceId: resourceId,
      reviewNote: reviewNote,
    );
    return _extractResource(response);
  }

  Future<ResourceItem> archiveResource({
    required String resourceId,
  }) async {
    final response = await apiService.archiveResource(resourceId: resourceId);
    return _extractResource(response);
  }

  Future<ResourceItem> fetchResourceById(String resourceId) async {
    final response = await apiService.fetchResourceById(resourceId);
    return _extractResource(response);
  }

  Future<FacultyResourceStats> fetchResourceStats(String resourceId) async {
    final response = await apiService.fetchFacultyResourceStats(
      resourceId: resourceId,
    );
    final data = _extractData(response);
    final statsJson = data['stats'];
    if (statsJson is Map) {
      return FacultyResourceStats.fromJson(
        Map<String, dynamic>.from(statsJson),
      );
    }
    throw const FormatException('Invalid /v1/faculty/resources/:id/stats response');
  }

  ResourceItem _extractResource(Map<String, dynamic> response) {
    final data = _extractData(response);
    final resourceJson = data['resource'];
    if (resourceJson is Map) {
      return ResourceItem.fromJson(Map<String, dynamic>.from(resourceJson));
    }
    throw const FormatException('Invalid resource response payload');
  }

  Map<String, dynamic> _extractData(Map<String, dynamic> response) {
    final data = response['data'];
    if (data is Map) {
      return Map<String, dynamic>.from(data);
    }
    throw const FormatException('Invalid API response');
  }
}
