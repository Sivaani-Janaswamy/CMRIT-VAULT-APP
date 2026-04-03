import 'package:cmrit_vault_mobile/features/admin/presentation/admin_access_denied_view.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';

void main() {
  testWidgets('AdminAccessDeniedView renders and back action navigates home', (
    tester,
  ) async {
    final router = GoRouter(
      initialLocation: '/admin',
      routes: [
        GoRoute(
          path: '/admin',
          builder: (context, state) => const AdminAccessDeniedView(),
        ),
        GoRoute(
          path: '/home',
          builder: (context, state) => const Scaffold(
            body: Text('Home Screen'),
          ),
        ),
      ],
    );

    await tester.pumpWidget(
      MaterialApp.router(routerConfig: router),
    );

    expect(find.text('Access denied'), findsOneWidget);
    expect(find.text('Back to Home'), findsOneWidget);

    await tester.tap(find.text('Back to Home'));
    await tester.pumpAndSettle();

    expect(find.text('Home Screen'), findsOneWidget);
  });
}
