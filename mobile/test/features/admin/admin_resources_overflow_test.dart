import 'package:cmrit_vault_mobile/features/admin/application/admin_controller.dart';
import 'package:cmrit_vault_mobile/features/admin/domain/admin_query_filters.dart';
import 'package:cmrit_vault_mobile/features/admin/domain/admin_resource_overview_item.dart';
import 'package:cmrit_vault_mobile/features/admin/presentation/admin_resources_overview_screen.dart';
import 'package:cmrit_vault_mobile/features/auth/application/auth_controller.dart';
import 'package:cmrit_vault_mobile/features/auth/domain/app_user.dart';
import 'package:cmrit_vault_mobile/features/auth/domain/auth_state.dart';
import 'package:cmrit_vault_mobile/features/subjects/domain/page_info.dart';
import 'package:cmrit_vault_mobile/features/subjects/domain/paginated_result.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

class _FakeAuthController extends AuthController {
  _FakeAuthController(this.stateValue);

  final AuthState stateValue;

  @override
  AuthState build() => stateValue;
}

class _FakeAdminModerationController extends AdminModerationController {
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

  AdminResourceOverviewItem item() {
    final now = DateTime.now();
    return AdminResourceOverviewItem(
      id: 'r1',
      subjectId: 's1',
      uploadedBy: 'u1',
      title: 'Resource',
      description: 'Description',
      resourceType: 'note',
      academicYear: '2024-2025',
      semester: 5,
      fileName: 'file.pdf',
      filePath: 'resources/note/r1/file.pdf',
      fileSizeBytes: 2048,
      mimeType: 'application/pdf',
      status: 'published',
      downloadCount: 3,
      publishedAt: now,
      createdAt: now,
      updatedAt: now,
    );
  }

  testWidgets('Admin resources overview renders on constrained width without overflow',
      (tester) async {
    tester.view.physicalSize = const Size(320, 900);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(() {
      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
    });

    final container = ProviderContainer(
      overrides: [
        authControllerProvider.overrideWith(
          () => _FakeAuthController(adminState()),
        ),
        adminResourcesOverviewProvider.overrideWith(
          (ref, AdminResourcesOverviewFilters filters) async {
            return PaginatedResult<AdminResourceOverviewItem>(
              items: [item()],
              pageInfo: const PageInfo(page: 1, pageSize: 20, total: 1),
            );
          },
        ),
        adminModerationControllerProvider.overrideWith(
          () => _FakeAdminModerationController(),
        ),
      ],
    );
    addTearDown(container.dispose);

    await tester.pumpWidget(
      UncontrolledProviderScope(
        container: container,
        child: const MaterialApp(home: AdminResourcesOverviewScreen()),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Admin Resources'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}
