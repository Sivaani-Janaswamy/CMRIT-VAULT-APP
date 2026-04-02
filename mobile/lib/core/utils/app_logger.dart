import 'package:flutter/foundation.dart';

void appLog(String message) {
  if (kDebugMode) {
    debugPrint(message);
  }
}

void appLogError(String message, Object error, [StackTrace? stackTrace]) {
  if (kDebugMode) {
    debugPrint('$message: $error');
    if (stackTrace != null) {
      debugPrint('$stackTrace');
    }
  }
}
