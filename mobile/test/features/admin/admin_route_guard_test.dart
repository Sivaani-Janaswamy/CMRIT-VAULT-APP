import 'package:cmrit_vault_mobile/app/router/app_router.dart';
import 'package:cmrit_vault_mobile/features/auth/application/auth_controller.dart';
import 'package:cmrit_vault_mobile/features/auth/domain/app_user.dart';
import 'package:cmrit_vault_mobile/features/auth/domain/auth_state.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

class _FakeAuthController extends AuthController {
  _FakeAuthController(this.stateValue);

  final AuthState stateValue;

  @override
  AuthState build() => stateValue;
}

void main() {
  AuthState authStateForRole(String role) {
    return AuthState(
      status: AuthStatus.authenticated,
      user: AppUser(
        id: 'user-id',
        fullName: 'User',
        email: 'user@example.com',
        role: role,
      ),
    );
  }

  testWidgets('admin user can access /admin route', (tester) async {
    final container = ProviderContainer(
      overrides: [
        authControllerProvider.overrideWith(
          () => _FakeAuthController(authStateForRole('admin')),
        ),
      ],
    );
    addTearDown(container.dispose);

    final router = container.read(appRouterProvider);

    await tester.pumpWidget(
      UncontrolledProviderScope(
        container: container,
        child: MaterialApp.router(routerConfig: router),
      ),
    );

    router.go('/admin');
    await tester.pumpAndSettle();

    expect(find.text('Admin Dashboard'), findsOneWidget);
    expect(find.text('Access denied'), findsNothing);
  });

  testWidgets('non-admin user is blocked from /admin route', (tester) async {
    final container = ProviderContainer(
      overrides: [
        authControllerProvider.overrideWith(
          () => _FakeAuthController(authStateForRole('student')),
        ),
      ],
    );
    addTearDown(container.dispose);

    final router = container.read(appRouterProvider);

    await tester.pumpWidget(
      UncontrolledProviderScope(
        container: container,
        child: MaterialApp.router(routerConfig: router),
      ),
    );

    router.go('/admin');
    await tester.pumpAndSettle();

    expect(find.text('Access denied'), findsOneWidget);
  });

  testWidgets('deep link to /admin/resources is blocked for non-admin', (tester) async {
    final container = ProviderContainer(
      overrides: [
        authControllerProvider.overrideWith(
          () => _FakeAuthController(authStateForRole('student')),
        ),
      ],
    );
    addTearDown(container.dispose);

    final router = container.read(appRouterProvider);

    await tester.pumpWidget(
      UncontrolledProviderScope(
        container: container,
        child: MaterialApp.router(routerConfig: router),
      ),
    );

    router.go('/admin/resources');
    await tester.pumpAndSettle();

    expect(find.text('Access denied'), findsOneWidget);
  });
}
