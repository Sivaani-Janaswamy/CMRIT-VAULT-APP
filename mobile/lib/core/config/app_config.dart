import 'package:flutter/foundation.dart';

class AppConfig {
  static const String _defaultEmulatorApiBaseUrl = 'http://10.0.2.2:4000';
  static const String _apiBaseUrlFromDefine = String.fromEnvironment('API_BASE_URL');

  static String get apiBaseUrl {
    final isRelease = kReleaseMode;
    if (isRelease && _apiBaseUrlFromDefine.isEmpty) {
      throw StateError(
        'Missing required --dart-define API_BASE_URL for release build',
      );
    }

    final raw = _apiBaseUrlFromDefine.isNotEmpty
        ? _apiBaseUrlFromDefine
        : _defaultEmulatorApiBaseUrl;

    if (isRelease && !raw.startsWith('https://')) {
      throw StateError('API_BASE_URL must use HTTPS in release builds');
    }

    return raw.endsWith('/') ? raw.substring(0, raw.length - 1) : raw;
  }
}
