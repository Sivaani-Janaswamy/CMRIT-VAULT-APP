import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:sentry_flutter/sentry_flutter.dart';

import 'app/app.dart';
import 'core/utils/app_logger.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  const sentryDsn = String.fromEnvironment('SENTRY_DSN');
  const appVersion = String.fromEnvironment('APP_VERSION', defaultValue: '1.0.0');
  const appEnv = String.fromEnvironment('APP_ENV', defaultValue: 'development');

  FlutterError.onError = (FlutterErrorDetails details) {
    FlutterError.presentError(details);
    appLog('FLUTTER ERROR: ${details.exception}');
    appLog('${details.stack}');
    if (sentryDsn.isNotEmpty) {
      Sentry.captureException(details.exception, stackTrace: details.stack);
    }
  };

  appLog('main(): before runApp');

  Future<void> runAppGuarded() async {
    if (sentryDsn.isNotEmpty) {
      await SentryFlutter.init(
        (options) {
          options.dsn = sentryDsn;
          options.environment = appEnv;
          options.release = appVersion;
          options.tracesSampleRate = 0.1;
        },
        appRunner: () {
          runApp(const ProviderScope(child: CmrItVaultApp()));
        },
      );
      return;
    }

    runApp(const ProviderScope(child: CmrItVaultApp()));
  }

  runZonedGuarded(() async {
    try {
      await runAppGuarded();
      appLog('main(): after runApp');
    } catch (error, stackTrace) {
      appLogError('main(): runApp failed', error, stackTrace);
      rethrow;
    }
  }, (error, stackTrace) {
    appLogError('main(): unhandled zone error', error, stackTrace);
    if (sentryDsn.isNotEmpty) {
      Sentry.captureException(error, stackTrace: stackTrace);
    }
  });
}
