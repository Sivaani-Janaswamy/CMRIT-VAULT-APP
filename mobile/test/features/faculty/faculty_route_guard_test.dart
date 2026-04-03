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

  testWidgets('faculty user can access /faculty route', (tester) async {
    final container = ProviderContainer(
      overrides: [
        authControllerProvider.overrideWith(
          () => _FakeAuthController(authStateForRole('faculty')),
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

    router.go('/faculty');
    await tester.pumpAndSettle();

    expect(find.text('Faculty Dashboard'), findsOneWidget);
  });

  testWidgets('student user is blocked from /faculty route', (tester) async {
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

    router.go('/faculty');
    await tester.pumpAndSettle();

    expect(find.text('Access denied'), findsOneWidget);
  });
}
