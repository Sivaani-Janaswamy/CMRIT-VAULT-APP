import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../core/config/supabase_config.dart';
import 'router/app_router.dart';

class CmrItVaultApp extends ConsumerStatefulWidget {
  const CmrItVaultApp({super.key});

  @override
  ConsumerState<CmrItVaultApp> createState() => _CmrItVaultAppState();
}

class _CmrItVaultAppState extends ConsumerState<CmrItVaultApp> {
  late final Future<void> _initFuture;

  @override
  void initState() {
    super.initState();
    _initFuture = _initializeSupabase();
  }

  Future<void> _initializeSupabase() async {
    debugPrint('CmrItVaultApp._initializeSupabase(): before Supabase.initialize');
    try {
      await Supabase.initialize(
        url: SupabaseConfig.url,
        anonKey: SupabaseConfig.anonKey,
        authOptions: const FlutterAuthClientOptions(
          authFlowType: AuthFlowType.pkce,
          autoRefreshToken: true,
        ),
      );
      debugPrint('CmrItVaultApp._initializeSupabase(): after Supabase.initialize');
    } catch (error, stackTrace) {
      debugPrint('CmrItVaultApp._initializeSupabase(): error -> $error');
      debugPrint('$stackTrace');
      rethrow;
    }
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<void>(
      future: _initFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          debugPrint('CmrItVaultApp.build(): FutureBuilder loading');
          return const MaterialApp(
            home: Scaffold(
              body: Center(child: CircularProgressIndicator()),
            ),
          );
        }

        if (snapshot.hasError) {
          debugPrint('CmrItVaultApp.build(): FutureBuilder error -> ${snapshot.error}');
          return MaterialApp(
            home: Scaffold(
              body: Center(
                child: Text('Supabase init failed: ${snapshot.error}'),
              ),
            ),
          );
        }

        debugPrint('CmrItVaultApp.build(): FutureBuilder success');
        final router = ref.watch(appRouterProvider);

        return MaterialApp.router(
          debugShowCheckedModeBanner: false,
          routerConfig: router,
        );
      },
    );
  }
}
