import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app/app.dart';
import 'core/utils/app_logger.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  FlutterError.onError = (FlutterErrorDetails details) {
    FlutterError.presentError(details);
    appLog('FLUTTER ERROR: ${details.exception}');
    appLog('${details.stack}');
  };

  appLog('main(): before runApp');
  runZonedGuarded(() {
    try {
      runApp(const ProviderScope(child: CmrItVaultApp()));
      appLog('main(): after runApp');
    } catch (error, stackTrace) {
      appLogError('main(): runApp failed', error, stackTrace);
      rethrow;
    }
  }, (error, stackTrace) {
    appLogError('main(): unhandled zone error', error, stackTrace);
  });
}
