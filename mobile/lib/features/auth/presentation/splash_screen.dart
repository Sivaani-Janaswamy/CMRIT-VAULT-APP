import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../application/auth_controller.dart';
import '../domain/auth_state.dart';
import '../../../core/utils/app_logger.dart';
import '../../../core/widgets/ui_state_widgets.dart';

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen> {

  @override
  void initState() {
    super.initState();
    appLog('SplashScreen.initState(): calling bootstrap()');

    Future.microtask(() {
      appLog('SplashScreen.initState(): bootstrap microtask fired');
      try {
        ref.read(authControllerProvider.notifier).bootstrap();
      } catch (error, stackTrace) {
        appLogError('SplashScreen.initState(): bootstrap threw', error, stackTrace);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    appLog('SplashScreen.build(): widget building');
    final authState = ref.watch(authControllerProvider);

    return Scaffold(
      body: Center(
        child: authState.status == AuthStatus.error
            ? Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text('Startup error'),
                  const SizedBox(height: 8),
                  Text(authState.message ?? 'Something went wrong'),
                  const SizedBox(height: 12),
                  FilledButton(
                    onPressed: () =>
                        ref.read(authControllerProvider.notifier).retryBootstrap(),
                    child: const Text('Retry'),
                  ),
                ],
              )
            : const Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  AppLoadingAnimation(size: 140),
                  SizedBox(height: 12),
                  Text('Loading...'),
                ],
              ),
      ),
    );
  }
}
