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
