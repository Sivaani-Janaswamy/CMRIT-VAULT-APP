import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/utils/app_logger.dart';
import '../../features/auth/application/auth_controller.dart';
import '../../features/auth/domain/auth_state.dart';
import '../../features/auth/presentation/login_screen.dart';
import '../../features/auth/presentation/signup_screen.dart';
import '../../features/auth/presentation/splash_screen.dart';
import '../../features/admin/presentation/admin_access_denied_view.dart';
import '../../features/admin/presentation/admin_dashboard_screen.dart';
import '../../features/admin/presentation/admin_downloads_overview_screen.dart';
import '../../features/admin/presentation/admin_resources_overview_screen.dart';
import '../../features/faculty/presentation/faculty_access_denied_view.dart';
import '../../features/faculty/presentation/faculty_dashboard_screen.dart';
import '../../features/faculty/presentation/faculty_resources_screen.dart';
import '../../features/search/presentation/search_screen.dart';
import '../../features/home/presentation/home_screen.dart';
import '../../features/downloads/presentation/downloads_screen.dart';
import '../../features/subjects/domain/subject.dart';
import '../../features/subjects/presentation/resource_detail_screen.dart';
import '../../features/subjects/presentation/subject_detail_screen.dart';
import '../../features/subjects/presentation/subject_list_screen.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authControllerProvider);

  return GoRouter(
    initialLocation: '/splash',
    redirect: (context, state) {
      final location = state.matchedLocation;
      final isOnSplash = location == '/splash';
      final isOnLogin = location == '/login';
      final isOnSignup = location == '/signup';
      final isBootstrapping = authState.status == AuthStatus.bootstrapping ||
          authState.status == AuthStatus.signingIn ||
          authState.status == AuthStatus.signingUp;
      final isLoggedIn = authState.status == AuthStatus.authenticated;

      String? decision;
      if (isBootstrapping) {
        decision = isOnSplash ? null : '/splash';
      } else if (isLoggedIn) {
        decision = (isOnSplash || isOnLogin || isOnSignup) ? '/home' : null;
      } else if (authState.status == AuthStatus.error &&
          authState.session != null) {
        decision = isOnSplash ? null : '/splash';
      } else {
        decision = (isOnLogin || isOnSignup) ? null : '/login';
      }

      if (kDebugMode) {
        appLog(
          'GoRouter.redirect(): location=$location status=${authState.status} decision=${decision ?? "stay"}',
        );
      }

      return decision;
    },
    routes: [
      GoRoute(
        path: '/splash',
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/signup',
        builder: (context, state) => const SignupScreen(),
      ),
      GoRoute(
        path: '/home',
        builder: (context, state) => const HomeScreen(),
      ),
      GoRoute(
        path: '/subjects',
        builder: (context, state) => const SubjectListScreen(),
      ),
      GoRoute(
        path: '/subjects/:subjectId',
        builder: (context, state) {
          final subjectId = state.pathParameters['subjectId'] ?? '';
          final subject = state.extra is Subject ? state.extra as Subject : null;
          return SubjectDetailScreen(
            subjectId: subjectId,
            subject: subject,
          );
        },
      ),
      GoRoute(
        path: '/resources/:resourceId',
        builder: (context, state) {
          final resourceId = state.pathParameters['resourceId'] ?? '';
          return ResourceDetailScreen(resourceId: resourceId);
        },
      ),
      GoRoute(
        path: '/downloads',
        builder: (context, state) => const DownloadsScreen(),
      ),
      GoRoute(
        path: '/search',
        builder: (context, state) => const SearchScreen(),
      ),
      GoRoute(
        path: '/admin',
        builder: (context, state) {
          final isAdmin = authState.user?.role == 'admin';
          if (kDebugMode) {
            appLog(
              'GoRouter.admin guard: role=${authState.user?.role ?? "none"} access=${isAdmin ? "allowed" : "denied"}',
            );
          }
          return isAdmin
              ? const AdminDashboardScreen()
              : const AdminAccessDeniedView();
        },
      ),
      GoRoute(
        path: '/admin/resources',
        builder: (context, state) {
          final isAdmin = authState.user?.role == 'admin';
          if (kDebugMode) {
            appLog(
              'GoRouter.admin/resources guard: role=${authState.user?.role ?? "none"} access=${isAdmin ? "allowed" : "denied"}',
            );
          }
          return isAdmin
              ? const AdminResourcesOverviewScreen()
              : const AdminAccessDeniedView();
        },
      ),
      GoRoute(
        path: '/admin/downloads',
        builder: (context, state) {
          final isAdmin = authState.user?.role == 'admin';
          if (kDebugMode) {
            appLog(
              'GoRouter.admin/downloads guard: role=${authState.user?.role ?? "none"} access=${isAdmin ? "allowed" : "denied"}',
            );
          }
          return isAdmin
              ? const AdminDownloadsOverviewScreen()
              : const AdminAccessDeniedView();
        },
      ),
      GoRoute(
        path: '/faculty',
        builder: (context, state) {
          final role = authState.user?.role;
          final allowed = role == 'faculty' || role == 'admin';
          if (kDebugMode) {
            appLog(
              'GoRouter.faculty guard: role=${role ?? "none"} access=${allowed ? "allowed" : "denied"}',
            );
          }
          return allowed
              ? const FacultyDashboardScreen()
              : const FacultyAccessDeniedView();
        },
      ),
      GoRoute(
        path: '/faculty/resources',
        builder: (context, state) {
          final role = authState.user?.role;
          final allowed = role == 'faculty' || role == 'admin';
          if (kDebugMode) {
            appLog(
              'GoRouter.faculty/resources guard: role=${role ?? "none"} access=${allowed ? "allowed" : "denied"}',
            );
          }
          return allowed
              ? const FacultyResourcesScreen()
              : const FacultyAccessDeniedView();
        },
      ),
    ],
    errorBuilder: (context, state) {
      if (kDebugMode) {
        appLog('GoRouter.errorBuilder(): ${state.error}');
      }

      return Scaffold(
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('Navigation error'),
              const SizedBox(height: 8),
              Text(state.error.toString()),
            ],
          ),
        ),
      );
    },
  );
});
