class AppConfig {
  static const String _defaultEmulatorApiBaseUrl = 'http://10.0.2.2:4000';
  static const String _apiBaseUrlFromDefine = String.fromEnvironment('API_BASE_URL');

  static String get apiBaseUrl {
    final raw = _apiBaseUrlFromDefine.isNotEmpty
        ? _apiBaseUrlFromDefine
        : _defaultEmulatorApiBaseUrl;

    return raw.endsWith('/') ? raw.substring(0, raw.length - 1) : raw;
  }
}
