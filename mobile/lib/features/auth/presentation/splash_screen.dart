import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../application/auth_controller.dart';
import '../domain/auth_state.dart';

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen> {

  @override
  void initState() {
    super.initState();
    debugPrint('SplashScreen.initState(): calling bootstrap()');

    // 🔥 THIS IS THE IMPORTANT PART
    Future.microtask(() {
      debugPrint('SplashScreen.initState(): bootstrap microtask fired');
      ref.read(authControllerProvider.notifier).bootstrap();
    });
  }

  @override
  Widget build(BuildContext context) {
    debugPrint('SplashScreen.build(): widget building');
    final authState = ref.watch(authControllerProvider);

    return Scaffold(
      body: Center(
        child: authState.status == AuthStatus.error
            ? Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(authState.message ?? 'Something went wrong'),
                  const SizedBox(height: 12),
                  FilledButton(
                    onPressed: () =>
                        ref.read(authControllerProvider.notifier).retryBootstrap(),
                    child: const Text('Retry'),
                  ),
                ],
              )
            : const CircularProgressIndicator(),
      ),
    );
  }
}
