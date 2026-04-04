import 'package:cmrit_vault_mobile/features/admin/application/admin_controller.dart';
import 'package:cmrit_vault_mobile/features/admin/presentation/admin_subject_edit_screen.dart';
import 'package:cmrit_vault_mobile/features/auth/application/auth_controller.dart';
import 'package:cmrit_vault_mobile/features/auth/domain/app_user.dart';
import 'package:cmrit_vault_mobile/features/auth/domain/auth_state.dart';
import 'package:cmrit_vault_mobile/features/subjects/domain/page_info.dart';
import 'package:cmrit_vault_mobile/features/subjects/domain/paginated_result.dart';
import 'package:cmrit_vault_mobile/features/subjects/domain/subject.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

class _FakeAuthController extends AuthController {
  _FakeAuthController(this.stateValue);

  final AuthState stateValue;

  @override
  AuthState build() => stateValue;
}

class _FakeAdminSubjectManagementController extends AdminSubjectManagementController {
  @override
  Future<void> build() async {}
}

void main() {
  AuthState adminState() {
    return const AuthState(
      status: AuthStatus.authenticated,
      user: AppUser(
        id: 'admin-1',
        fullName: 'Admin',
        email: 'admin@example.com',
        role: 'admin',
      ),
    );
  }

  Subject subject(String id, String code) {
    return Subject(
      id: id,
      code: code,
      name: 'Subject $code',
      department: 'CSE',
      semester: 3,
      isActive: true,
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );
  }

  testWidgets('Manage subjects screen tolerates duplicate ids without dropdown assertion',
      (tester) async {
    final container = ProviderContainer(
      overrides: [
        authControllerProvider.overrideWith(
          () => _FakeAuthController(adminState()),
        ),
        adminSubjectsProvider.overrideWith(
          (ref) async => PaginatedResult<Subject>(
            items: [
              subject('s1', 'CSE101'),
              subject('s1', 'CSE101-dup'),
              subject('s2', 'CSE201'),
            ],
            pageInfo: const PageInfo(page: 1, pageSize: 20, total: 3),
          ),
        ),
        adminSubjectManagementControllerProvider.overrideWith(
          () => _FakeAdminSubjectManagementController(),
        ),
      ],
    );
    addTearDown(container.dispose);

    await tester.pumpWidget(
      UncontrolledProviderScope(
        container: container,
        child: const MaterialApp(home: AdminSubjectEditScreen()),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Manage Subjects'), findsOneWidget);
    expect(find.text('Select Subject'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}
