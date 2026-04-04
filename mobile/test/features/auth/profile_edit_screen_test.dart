import 'package:cmrit_vault_mobile/features/auth/application/auth_controller.dart';
import 'package:cmrit_vault_mobile/features/auth/domain/app_user.dart';
import 'package:cmrit_vault_mobile/features/auth/domain/auth_state.dart';
import 'package:cmrit_vault_mobile/features/auth/presentation/profile_edit_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

class _FakeAuthController extends AuthController {
  _FakeAuthController(this._state);

  final AuthState _state;
  int updateCalls = 0;
  String? fullName;
  String? rollNo;
  String? department;
  int? semester;

  @override
  AuthState build() => _state;

  @override
  Future<void> updateProfile({
    String? fullName,
    String? rollNo,
    String? department,
    int? semester,
  }) async {
    updateCalls += 1;
    this.fullName = fullName;
    this.rollNo = rollNo;
    this.department = department;
    this.semester = semester;
  }
}

void main() {
  AuthState authenticatedState() {
    return AuthState(
      status: AuthStatus.authenticated,
      user: const AppUser(
        id: 'u1',
        fullName: 'Old Name',
        email: 'u1@example.com',
        role: 'student',
        rollNo: '1CR22CS001',
        department: 'CSE',
        semester: 5,
      ),
    );
  }

  testWidgets('Profile edit validates full name and blocks submit', (tester) async {
    final fake = _FakeAuthController(authenticatedState());
    final container = ProviderContainer(
      overrides: [
        authControllerProvider.overrideWith(() => fake),
      ],
    );
    addTearDown(container.dispose);

    await tester.pumpWidget(
      UncontrolledProviderScope(
        container: container,
        child: const MaterialApp(home: ProfileEditScreen()),
      ),
    );

    await tester.enterText(find.byType(TextFormField).first, '');
    await tester.tap(find.text('Save'));
    await tester.pump();

    expect(find.text('Name is required'), findsOneWidget);
    expect(fake.updateCalls, 0);
  });

  testWidgets('Profile edit sends updated fields payload', (tester) async {
    final fake = _FakeAuthController(authenticatedState());
    final container = ProviderContainer(
      overrides: [
        authControllerProvider.overrideWith(() => fake),
      ],
    );
    addTearDown(container.dispose);

    await tester.pumpWidget(
      UncontrolledProviderScope(
        container: container,
        child: const MaterialApp(home: ProfileEditScreen()),
      ),
    );

    final fields = find.byType(TextFormField);
    await tester.enterText(fields.at(0), 'New Name');
    await tester.enterText(fields.at(1), '1CR22CS099');
    await tester.enterText(fields.at(2), 'ISE');
    await tester.enterText(fields.at(3), '6');

    await tester.tap(find.text('Save'));
    await tester.pumpAndSettle();

    expect(fake.updateCalls, 1);
    expect(fake.fullName, 'New Name');
    expect(fake.rollNo, '1CR22CS099');
    expect(fake.department, 'ISE');
    expect(fake.semester, 6);
  });
}
