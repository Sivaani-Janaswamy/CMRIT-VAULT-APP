import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app/app.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  FlutterError.onError = (FlutterErrorDetails details) {
    FlutterError.presentError(details);
    debugPrint('FLUTTER ERROR: ${details.exception}');
    debugPrint('${details.stack}');
  };

  debugPrint('main(): before runApp');
  try {
    runApp(const ProviderScope(child: CmrItVaultApp()));
    debugPrint('main(): after runApp');
  } catch (error, stackTrace) {
    debugPrint('main(): runApp failed -> $error');
    debugPrint('$stackTrace');
    rethrow;
  }
}
