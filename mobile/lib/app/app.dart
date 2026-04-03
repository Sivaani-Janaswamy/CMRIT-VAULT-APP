import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../core/config/supabase_config.dart';
import '../core/theme/app_colors.dart';
import '../core/utils/app_logger.dart';
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
    appLog('CmrItVaultApp._initializeSupabase(): before Supabase.initialize');
    try {
      await Supabase.initialize(
        url: SupabaseConfig.url,
        anonKey: SupabaseConfig.anonKey,
        authOptions: const FlutterAuthClientOptions(
          authFlowType: AuthFlowType.pkce,
          autoRefreshToken: true,
        ),
      );
      appLog('CmrItVaultApp._initializeSupabase(): after Supabase.initialize');
    } catch (error, stackTrace) {
      appLogError('CmrItVaultApp._initializeSupabase(): error', error, stackTrace);
      rethrow;
    }
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<void>(
      future: _initFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          appLog('CmrItVaultApp.build(): FutureBuilder loading');
          return const MaterialApp(
            home: Scaffold(
              body: Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    CircularProgressIndicator(),
                    SizedBox(height: 12),
                    Text('Starting app...'),
                  ],
                ),
              ),
            ),
          );
        }

        if (snapshot.hasError) {
          appLog('CmrItVaultApp.build(): FutureBuilder error -> ${snapshot.error}');
          return MaterialApp(
            home: Scaffold(
              body: Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text('Supabase init failed: ${snapshot.error}'),
                    const SizedBox(height: 12),
                    const Text('Please check the startup logs and retry.'),
                  ],
                ),
              ),
            ),
          );
        }

        appLog('CmrItVaultApp.build(): FutureBuilder success');
        final router = ref.watch(appRouterProvider);

        return MaterialApp.router(
          debugShowCheckedModeBanner: false,
          routerConfig: router,
          theme: ThemeData(
            useMaterial3: true,
            scaffoldBackgroundColor: AppColors.background,
            colorScheme: ColorScheme.fromSeed(
              seedColor: AppColors.primary,
              brightness: Brightness.light,
            ).copyWith(
              primary: AppColors.primary,
              secondary: AppColors.highlightGreen,
              tertiary: AppColors.highlightOrange,
              surface: Colors.white,
            ),
            appBarTheme: const AppBarTheme(
              backgroundColor: AppColors.primary,
              foregroundColor: AppColors.text,
              centerTitle: false,
            ),
            textTheme: Typography.blackMountainView.apply(
              bodyColor: AppColors.text,
              displayColor: AppColors.text,
            ),
          ),
        );
      },
    );
  }
}
