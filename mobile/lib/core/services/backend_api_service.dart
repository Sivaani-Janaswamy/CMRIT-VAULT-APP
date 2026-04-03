import 'dart:convert';

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
