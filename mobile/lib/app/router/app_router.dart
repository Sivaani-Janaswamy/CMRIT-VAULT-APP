import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/utils/app_logger.dart';
import '../../features/auth/application/auth_controller.dart';
import '../../features/auth/domain/auth_state.dart';
import '../../features/auth/presentation/login_screen.dart';
import '../../features/auth/presentation/profile_edit_screen.dart';
import '../../features/auth/presentation/signup_screen.dart';
import '../../features/auth/presentation/splash_screen.dart';
import '../../features/admin/presentation/admin_access_denied_view.dart';
import '../../features/admin/presentation/admin_dashboard_screen.dart';
import '../../features/admin/presentation/admin_create_resource_screen.dart';
import '../../features/admin/presentation/admin_create_subject_screen.dart';
import '../../features/admin/presentation/admin_download_audit_screen.dart';
import '../../features/admin/presentation/admin_downloads_overview_screen.dart';
import '../../features/admin/presentation/admin_manage_resource_screen.dart';
import '../../features/admin/presentation/admin_resources_overview_screen.dart';
import '../../features/admin/presentation/admin_search_reindex_screen.dart';
import '../../features/admin/presentation/admin_user_detail_screen.dart';
import '../../features/admin/presentation/admin_subject_edit_screen.dart';
import '../../features/admin/presentation/admin_users_screen.dart';
import '../../features/admin/domain/admin_resource_overview_item.dart';
import '../../features/faculty/presentation/faculty_access_denied_view.dart';
import '../../features/faculty/presentation/faculty_dashboard_screen.dart';
import '../../features/faculty/presentation/faculty_create_resource_screen.dart';
import '../../features/faculty/presentation/faculty_resource_form_screen.dart';
import '../../features/faculty/presentation/faculty_resource_stats_screen.dart';
import '../../features/faculty/presentation/faculty_resources_screen.dart';
import '../../features/search/presentation/search_screen.dart';
import '../../features/home/presentation/home_screen.dart';
import '../../features/downloads/presentation/downloads_screen.dart';
import '../../features/resources/presentation/recently_viewed_screen.dart';
import '../../features/resources/presentation/resource_preview_screen.dart';
import '../../features/resources/presentation/resource_type_resources_screen.dart';
import '../../features/subjects/domain/subject.dart';
import '../../features/subjects/domain/resource_item.dart';
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
        decision = isOnSplash ? '/home' : null;
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
        path: '/profile/edit',
        builder: (context, state) => const ProfileEditScreen(),
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
        path: '/resources/:resourceId/preview',
        builder: (context, state) {
          final resourceId = state.pathParameters['resourceId'] ?? '';
          final extra = state.extra;
          final data = extra is Map<String, dynamic> ? extra : const <String, dynamic>{};
          return ResourcePreviewScreen(
            resourceId: resourceId,
            title: data['title'] as String?,
            mimeType: data['mimeType'] as String?,
            fileName: data['fileName'] as String?,
          );
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
        path: '/recently-viewed',
        builder: (context, state) => const RecentlyViewedScreen(),
      ),
      GoRoute(
        path: '/resources/type/:resourceType',
        builder: (context, state) {
          final resourceType = state.pathParameters['resourceType'] ?? 'note';
          return ResourceTypeResourcesScreen(resourceType: resourceType);
        },
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
        path: '/admin/resources/new',
        builder: (context, state) {
          final isAdmin = authState.user?.role == 'admin';
          return isAdmin
              ? const AdminCreateResourceScreen()
              : const AdminAccessDeniedView();
        },
      ),
      GoRoute(
        path: '/admin/resources/:resourceId/manage',
        builder: (context, state) {
          final isAdmin = authState.user?.role == 'admin';
          final resourceId = state.pathParameters['resourceId'] ?? '';
          final item = state.extra is AdminResourceOverviewItem
              ? state.extra as AdminResourceOverviewItem
              : null;
          return isAdmin
              ? AdminManageResourceScreen(
                  resourceId: resourceId,
                  initialItem: item,
                )
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
        path: '/admin/downloads/audit',
        builder: (context, state) {
          final isAdmin = authState.user?.role == 'admin';
          if (kDebugMode) {
            appLog(
              'GoRouter.admin/downloads/audit guard: role=${authState.user?.role ?? "none"} access=${isAdmin ? "allowed" : "denied"}',
            );
          }
          return isAdmin
              ? const AdminDownloadAuditScreen()
              : const AdminAccessDeniedView();
        },
      ),
      GoRoute(
        path: '/admin/users',
        builder: (context, state) {
          final isAdmin = authState.user?.role == 'admin';
          if (kDebugMode) {
            appLog(
              'GoRouter.admin/users guard: role=${authState.user?.role ?? "none"} access=${isAdmin ? "allowed" : "denied"}',
            );
          }
          return isAdmin
              ? const AdminUsersScreen()
              : const AdminAccessDeniedView();
        },
      ),
      GoRoute(
        path: '/admin/users/:userId',
        builder: (context, state) {
          final isAdmin = authState.user?.role == 'admin';
          final userId = state.pathParameters['userId'] ?? '';
          if (kDebugMode) {
            appLog(
              'GoRouter.admin/users/:userId guard: role=${authState.user?.role ?? "none"} access=${isAdmin ? "allowed" : "denied"}',
            );
          }
          return isAdmin
              ? AdminUserDetailScreen(userId: userId)
              : const AdminAccessDeniedView();
        },
      ),
      GoRoute(
        path: '/admin/subjects/create',
        builder: (context, state) {
          final isAdmin = authState.user?.role == 'admin';
          if (kDebugMode) {
            appLog(
              'GoRouter.admin/subjects/create guard: role=${authState.user?.role ?? "none"} access=${isAdmin ? "allowed" : "denied"}',
            );
          }
          return isAdmin
              ? const AdminCreateSubjectScreen()
              : const AdminAccessDeniedView();
        },
      ),
      GoRoute(
        path: '/admin/subjects/manage',
        builder: (context, state) {
          final isAdmin = authState.user?.role == 'admin';
          if (kDebugMode) {
            appLog(
              'GoRouter.admin/subjects/manage guard: role=${authState.user?.role ?? "none"} access=${isAdmin ? "allowed" : "denied"}',
            );
          }
          return isAdmin
              ? const AdminSubjectEditScreen()
              : const AdminAccessDeniedView();
        },
      ),
      GoRoute(
        path: '/admin/search/reindex',
        builder: (context, state) {
          final isAdmin = authState.user?.role == 'admin';
          if (kDebugMode) {
            appLog(
              'GoRouter.admin/search/reindex guard: role=${authState.user?.role ?? "none"} access=${isAdmin ? "allowed" : "denied"}',
            );
          }
          return isAdmin
              ? const AdminSearchReindexScreen()
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
      GoRoute(
        path: '/faculty/resources/new',
        builder: (context, state) {
          final role = authState.user?.role;
          final allowed = role == 'faculty' || role == 'admin';
          return allowed
              ? const FacultyResourceFormScreen()
              : const FacultyAccessDeniedView();
        },
      ),
      GoRoute(
        path: '/faculty/resources/create',
        builder: (context, state) {
          final role = authState.user?.role;
          final allowed = role == 'faculty' || role == 'admin';
          return allowed
              ? const FacultyCreateResourceScreen()
              : const FacultyAccessDeniedView();
        },
      ),
      GoRoute(
        path: '/faculty/resources/:resourceId/edit',
        builder: (context, state) {
          final role = authState.user?.role;
          final allowed = role == 'faculty' || role == 'admin';
          final resourceId = state.pathParameters['resourceId'] ?? '';
          final initialResource = state.extra is ResourceItem
              ? state.extra as ResourceItem
              : null;
          return allowed
              ? FacultyResourceFormScreen(
                  resourceId: resourceId,
                  initialResource: initialResource,
                )
              : const FacultyAccessDeniedView();
        },
      ),
      GoRoute(
        path: '/faculty/resources/:resourceId/stats',
        builder: (context, state) {
          final role = authState.user?.role;
          final allowed = role == 'faculty' || role == 'admin';
          final resourceId = state.pathParameters['resourceId'] ?? '';
          return allowed
              ? FacultyResourceStatsScreen(resourceId: resourceId)
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
