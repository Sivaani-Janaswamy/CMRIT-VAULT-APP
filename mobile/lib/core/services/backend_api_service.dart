import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;
import 'package:supabase_flutter/supabase_flutter.dart';

import '../config/app_config.dart';
import '../utils/app_logger.dart';
import 'supabase_service.dart';

final backendApiServiceProvider = Provider<BackendApiService>((ref) {
  return BackendApiService(
    baseUrl: AppConfig.apiBaseUrl,
    supabaseClient: ref.watch(supabaseClientProvider),
  );
});

class BackendApiService {
  BackendApiService({
    required this.baseUrl,
    required this.supabaseClient,
  });

  final String baseUrl;
  final SupabaseClient supabaseClient;
  static const String _storageBucket = 'cmrit-vault-files';

  Future<void> syncAuth() async {
    appLog('BackendApiService.syncAuth(): start');
    await _request(
      method: 'POST',
      path: '/v1/auth/sync',
    );
    appLog('BackendApiService.syncAuth(): done');
  }

  Future<Map<String, dynamic>> fetchCurrentUser() async {
    appLog('BackendApiService.fetchCurrentUser(): start');
    final response = await _request(
      method: 'GET',
      path: '/v1/users/me',
    );

    final data = response['data'];
    if (data is Map<String, dynamic>) {
      final user = data['user'];
      if (user is Map<String, dynamic>) {
        appLog('BackendApiService.fetchCurrentUser(): success');
        return user;
      }
    }

    throw const FormatException('Invalid /v1/users/me response');
  }

  Future<Map<String, dynamic>> updateCurrentUser({
    String? fullName,
    String? rollNo,
    String? department,
    int? semester,
  }) async {
    appLog('BackendApiService.updateCurrentUser(): start');
    final body = <String, dynamic>{};
    if (fullName != null) {
      body['fullName'] = fullName;
    }
    if (rollNo != null) {
      body['rollNo'] = rollNo;
    }
    if (department != null) {
      body['department'] = department;
    }
    if (semester != null) {
      body['semester'] = semester;
    }

    final response = await _request(
      method: 'PATCH',
      path: '/v1/users/me',
      body: body,
    );

    final data = response['data'];
    if (data is Map<String, dynamic>) {
      final user = data['user'];
      if (user is Map<String, dynamic>) {
        appLog('BackendApiService.updateCurrentUser(): success');
        return user;
      }
    }

    throw const FormatException('Invalid PATCH /v1/users/me response');
  }

  Future<Map<String, dynamic>> fetchSubjects({
    int page = 1,
    int pageSize = 20,
  }) {
    appLog('BackendApiService.fetchSubjects(): start');
    return _request(
      method: 'GET',
      path: '/v1/subjects',
      queryParameters: {
        'page': page.toString(),
        'pageSize': pageSize.toString(),
      },
    );
  }

  Future<Map<String, dynamic>> fetchSubjectById(String subjectId) async {
    appLog('BackendApiService.fetchSubjectById(): start subjectId=$subjectId');
    final response = await _request(
      method: 'GET',
      path: '/v1/subjects/$subjectId',
    );

    final data = response['data'];
    if (data is Map<String, dynamic>) {
      final subject = data['subject'];
      if (subject is Map<String, dynamic>) {
        appLog('BackendApiService.fetchSubjectById(): success');
        return subject;
      }
    }

    throw const FormatException('Invalid /v1/subjects/:id response');
  }

  Future<Map<String, dynamic>> fetchResources({
    required String subjectId,
    int page = 1,
    int pageSize = 20,
  }) {
    appLog('BackendApiService.fetchResources(): start subjectId=$subjectId');
    return _request(
      method: 'GET',
      path: '/v1/resources',
      queryParameters: {
        'subjectId': subjectId,
        'page': page.toString(),
        'pageSize': pageSize.toString(),
      },
    );
  }

  Future<Map<String, dynamic>> fetchResourceById(String resourceId) {
    appLog('BackendApiService.fetchResourceById(): start resourceId=$resourceId');
    return _request(
      method: 'GET',
      path: '/v1/resources/$resourceId',
    );
  }

  Future<Map<String, dynamic>> createDownloadUrl(
    String resourceId, {
    String source = 'mobile',
  }) {
    appLog('BackendApiService.createDownloadUrl(): start resourceId=$resourceId source=$source');
    return _request(
      method: 'POST',
      path: '/v1/resources/$resourceId/download-url',
      body: {
        'source': source,
      },
    );
  }

  Future<Map<String, dynamic>> fetchDownloadsHistory({
    int page = 1,
    int pageSize = 20,
  }) {
    appLog('BackendApiService.fetchDownloadsHistory(): start');
    return _request(
      method: 'GET',
      path: '/v1/downloads/me',
      queryParameters: {
        'page': page.toString(),
        'pageSize': pageSize.toString(),
      },
    );
  }

  Future<Map<String, dynamic>> searchResources({
    required String query,
    int page = 1,
    int pageSize = 20,
  }) {
    appLog('BackendApiService.searchResources(): start query="$query"');
    return _request(
      method: 'GET',
      path: '/v1/search/resources',
      queryParameters: {
        'q': query,
        'page': page.toString(),
        'pageSize': pageSize.toString(),
      },
    );
  }

  Future<List<Map<String, dynamic>>> searchSuggest({
    required String query,
    int limit = 8,
  }) async {
    appLog('BackendApiService.searchSuggest(): start query="$query"');
    final response = await _request(
      method: 'GET',
      path: '/v1/search/suggest',
      queryParameters: {
        'q': query,
        'limit': limit.toString(),
      },
    );

    final data = response['data'];
    if (data is Map<String, dynamic>) {
      final items = data['items'];
      if (items is List) {
        return items
            .whereType<Map>()
            .map((item) => Map<String, dynamic>.from(item))
            .toList();
      }
    }

    throw const FormatException('Invalid /v1/search/suggest response');
  }

  Future<Map<String, dynamic>> fetchAdminDashboardSummary({
    String period = '30d',
  }) {
    appLog('BackendApiService.fetchAdminDashboardSummary(): start period=$period');
    return _request(
      method: 'GET',
      path: '/v1/admin/dashboard/summary',
      queryParameters: {
        'period': period,
      },
    );
  }

  Future<Map<String, dynamic>> fetchAdminResourcesOverview({
    Map<String, String>? filters,
  }) {
    appLog('BackendApiService.fetchAdminResourcesOverview(): start');
    return _request(
      method: 'GET',
      path: '/v1/admin/resources/overview',
      queryParameters: filters,
    );
  }

  Future<Map<String, dynamic>> fetchAdminDownloadsOverview({
    Map<String, String>? filters,
  }) {
    appLog('BackendApiService.fetchAdminDownloadsOverview(): start');
    return _request(
      method: 'GET',
      path: '/v1/admin/downloads/overview',
      queryParameters: filters,
    );
  }

  Future<Map<String, dynamic>> fetchAdminDownloadsAudit({
    Map<String, String>? filters,
  }) {
    appLog('BackendApiService.fetchAdminDownloadsAudit(): start');
    return _request(
      method: 'GET',
      path: '/v1/admin/downloads',
      queryParameters: filters,
    );
  }

  Future<Map<String, dynamic>> updateAdminResourceStatus({
    required String resourceId,
    required String status,
  }) {
    appLog(
      'BackendApiService.updateAdminResourceStatus(): start resourceId=$resourceId status=$status',
    );
    return _request(
      method: 'PATCH',
      path: '/v1/admin/resources/$resourceId/status',
      body: {
        'status': status,
      },
    );
  }

  Future<Map<String, dynamic>> fetchAdminUsers({
    Map<String, String>? filters,
  }) {
    appLog('BackendApiService.fetchAdminUsers(): start');
    return _request(
      method: 'GET',
      path: '/v1/admin/users',
      queryParameters: filters,
    );
  }

  Future<Map<String, dynamic>> fetchAdminUserById({
    required String userId,
  }) {
    appLog('BackendApiService.fetchAdminUserById(): start userId=$userId');
    return _request(
      method: 'GET',
      path: '/v1/admin/users/$userId',
    );
  }

  Future<Map<String, dynamic>> updateAdminUserRole({
    required String userId,
    required String role,
  }) {
    appLog('BackendApiService.updateAdminUserRole(): start userId=$userId role=$role');
    return _request(
      method: 'PATCH',
      path: '/v1/admin/users/$userId/role',
      body: {
        'role': role,
      },
    );
  }

  Future<Map<String, dynamic>> updateAdminUserStatus({
    required String userId,
    required bool isActive,
  }) {
    appLog('BackendApiService.updateAdminUserStatus(): start userId=$userId isActive=$isActive');
    return _request(
      method: 'PATCH',
      path: '/v1/admin/users/$userId/status',
      body: {
        'is_active': isActive,
      },
    );
  }

  Future<Map<String, dynamic>> createAdminSubject({
    required String code,
    required String name,
    required String department,
    required int semester,
    bool? isActive,
  }) {
    appLog('BackendApiService.createAdminSubject(): start code=$code');
    final body = <String, dynamic>{
      'code': code,
      'name': name,
      'department': department,
      'semester': semester,
    };
    if (isActive != null) {
      body['isActive'] = isActive;
    }

    return _request(
      method: 'POST',
      path: '/v1/admin/subjects',
      body: body,
    );
  }

  Future<Map<String, dynamic>> updateAdminSubject({
    required String subjectId,
    String? code,
    String? name,
    String? department,
    int? semester,
    bool? isActive,
  }) {
    appLog('BackendApiService.updateAdminSubject(): start subjectId=$subjectId');
    final body = <String, dynamic>{};
    if (code != null) {
      body['code'] = code;
    }
    if (name != null) {
      body['name'] = name;
    }
    if (department != null) {
      body['department'] = department;
    }
    if (semester != null) {
      body['semester'] = semester;
    }
    if (isActive != null) {
      body['isActive'] = isActive;
    }

    return _request(
      method: 'PATCH',
      path: '/v1/admin/subjects/$subjectId',
      body: body,
    );
  }

  Future<Map<String, dynamic>> deleteAdminSubject({
    required String subjectId,
  }) {
    appLog('BackendApiService.deleteAdminSubject(): start subjectId=$subjectId');
    return _request(
      method: 'DELETE',
      path: '/v1/admin/subjects/$subjectId',
    );
  }

  Future<Map<String, dynamic>> triggerAdminSearchReindex() {
    appLog('BackendApiService.triggerAdminSearchReindex(): start');
    return _request(
      method: 'POST',
      path: '/v1/admin/search/reindex',
    );
  }

  Future<Map<String, dynamic>> fetchFacultyDashboardSummary({
    String period = '30d',
  }) {
    appLog('BackendApiService.fetchFacultyDashboardSummary(): start period=$period');
    return _request(
      method: 'GET',
      path: '/v1/faculty/dashboard/summary',
      queryParameters: {
        'period': period,
      },
    );
  }

  Future<Map<String, dynamic>> fetchFacultyResources({
    Map<String, String>? filters,
  }) {
    appLog('BackendApiService.fetchFacultyResources(): start');
    return _request(
      method: 'GET',
      path: '/v1/faculty/resources',
      queryParameters: filters,
    );
  }

  Future<Map<String, dynamic>> createResource({
    required Map<String, dynamic> body,
  }) {
    appLog('BackendApiService.createResource(): start');
    return _request(
      method: 'POST',
      path: '/v1/resources',
      body: body,
    );
  }

  Future<Map<String, dynamic>> updateResource({
    required String resourceId,
    required Map<String, dynamic> body,
  }) {
    appLog('BackendApiService.updateResource(): start resourceId=$resourceId');
    return _request(
      method: 'PATCH',
      path: '/v1/resources/$resourceId',
      body: body,
    );
  }

  Future<Map<String, dynamic>> submitResource({
    required String resourceId,
    String? reviewNote,
  }) {
    appLog('BackendApiService.submitResource(): start resourceId=$resourceId');
    return _request(
      method: 'POST',
      path: '/v1/resources/$resourceId/submit',
      body: reviewNote == null || reviewNote.trim().isEmpty
          ? null
          : {
              'reviewNote': reviewNote.trim(),
            },
    );
  }

  Future<Map<String, dynamic>> completeResource({
    required String resourceId,
  }) {
    appLog('BackendApiService.completeResource(): start resourceId=$resourceId');
    return _request(
      method: 'POST',
      path: '/v1/resources/$resourceId/complete',
    );
  }

  Future<Map<String, dynamic>> archiveResource({
    required String resourceId,
  }) {
    appLog('BackendApiService.archiveResource(): start resourceId=$resourceId');
    return _request(
      method: 'DELETE',
      path: '/v1/resources/$resourceId',
    );
  }

  Future<Map<String, dynamic>> fetchFacultyResourceStats({
    required String resourceId,
  }) {
    appLog('BackendApiService.fetchFacultyResourceStats(): start resourceId=$resourceId');
    return _request(
      method: 'GET',
      path: '/v1/faculty/resources/$resourceId/stats',
    );
  }

  Future<void> uploadFileWithSession({
    required String uploadPath,
    required Uint8List fileBytes,
    required String mimeType,
  }) async {
    appLog('BackendApiService.uploadFileWithSession(): start path=$uploadPath');
    await supabaseClient.storage.from(_storageBucket).uploadBinary(
          uploadPath,
          fileBytes,
          fileOptions: FileOptions(
            contentType: mimeType,
            upsert: true,
          ),
        );
    appLog('BackendApiService.uploadFileWithSession(): success path=$uploadPath');
  }

  Future<Map<String, dynamic>> _request({
    required String method,
    required String path,
    Map<String, dynamic>? body,
    Map<String, String>? queryParameters,
  }) async {
    final session = supabaseClient.auth.currentSession;
    if (session == null) {
      appLog('BackendApiService._request(): no active session');
      throw AuthException('No active session');
    }

    final uri = Uri.parse('$baseUrl$path').replace(queryParameters: queryParameters);
    final headers = <String, String>{
      'Authorization': 'Bearer ${session.accessToken}',
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    late final http.Response response;
    switch (method) {
      case 'GET':
        response = await http.get(uri, headers: headers);
        break;
      case 'POST':
        response = await http.post(
          uri,
          headers: headers,
          body: body == null ? null : jsonEncode(body),
        );
        break;
      case 'PATCH':
        response = await http.patch(
          uri,
          headers: headers,
          body: body == null ? null : jsonEncode(body),
        );
        break;
      case 'DELETE':
        response = await http.delete(
          uri,
          headers: headers,
        );
        break;
      default:
        throw UnsupportedError('Unsupported method: $method');
    }

    final decoded = response.body.isEmpty
        ? <String, dynamic>{}
        : jsonDecode(response.body) as Map<String, dynamic>;

    if (response.statusCode >= 200 && response.statusCode < 300) {
      appLog('BackendApiService._request(): success $method $path -> ${response.statusCode}');
      return decoded;
    }

    final message = decoded['message'] as String? ?? 'Request failed';
    appLog('BackendApiService._request(): error $method $path -> ${response.statusCode} $message');
    throw Exception(message);
  }
}
