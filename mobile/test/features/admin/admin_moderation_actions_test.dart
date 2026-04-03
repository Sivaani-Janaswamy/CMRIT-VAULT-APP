import 'package:cmrit_vault_mobile/features/admin/presentation/admin_moderation_actions.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

class _FakeAdminRepository {
  int callCount = 0;
  String? lastStatus;

  Future<void> updateResourceStatus(String status) async {
    callCount += 1;
    lastStatus = status;
  }
}

void main() {
  testWidgets('moderation dialog cancel does not call repository', (tester) async {
    final repository = _FakeAdminRepository();

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: AdminModerationActions(
            resourceTitle: 'Resource A',
            onConfirm: repository.updateResourceStatus,
          ),
        ),
      ),
    );

    await tester.tap(find.text('Publish'));
    await tester.pumpAndSettle();

    expect(find.text('Confirm moderation'), findsOneWidget);
    await tester.tap(find.text('Cancel'));
    await tester.pumpAndSettle();

    expect(repository.callCount, 0);
  });

  testWidgets('moderation dialog confirm calls repository', (tester) async {
    final repository = _FakeAdminRepository();

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: AdminModerationActions(
            resourceTitle: 'Resource A',
            onConfirm: repository.updateResourceStatus,
          ),
        ),
      ),
    );

    await tester.tap(find.text('Reject'));
    await tester.pumpAndSettle();

    expect(find.text('Confirm moderation'), findsOneWidget);
    await tester.tap(find.text('Confirm'));
    await tester.pumpAndSettle();

    expect(repository.callCount, 1);
    expect(repository.lastStatus, 'rejected');
  });
}
