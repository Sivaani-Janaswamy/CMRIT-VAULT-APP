import 'package:cmrit_vault_mobile/features/resources/presentation/resource_type_resources_screen.dart';
import 'package:cmrit_vault_mobile/features/subjects/application/subjects_controller.dart';
import 'package:cmrit_vault_mobile/features/subjects/domain/page_info.dart';
import 'package:cmrit_vault_mobile/features/subjects/domain/paginated_result.dart';
import 'package:cmrit_vault_mobile/features/subjects/domain/resource_item.dart';
import 'package:cmrit_vault_mobile/features/subjects/domain/subject.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('ResourceTypeResourcesScreen shows notes banner and count', (
    tester,
  ) async {
    final now = DateTime.now();

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          subjectsListProvider.overrideWith(
            (ref) async => PaginatedResult<Subject>(
              items: [
                Subject(
                  id: 'sub1',
                  code: 'CSE101',
                  name: 'Programming in C',
                  department: 'CSE',
                  semester: 1,
                  isActive: true,
                  createdAt: now,
                  updatedAt: now,
                ),
              ],
              pageInfo: const PageInfo(page: 1, pageSize: 200, total: 1),
            ),
          ),
          resourcesByTypeProvider('note').overrideWith(
            (ref) async => PaginatedResult<ResourceItem>(
              items: [
                ResourceItem(
                  id: 'res1',
                  subjectId: 'sub1',
                  uploadedBy: 'u1',
                  title: 'Intro Notes',
                  description: 'Basics',
                  resourceType: 'note',
                  academicYear: '2025-26',
                  semester: 1,
                  fileName: 'intro.pdf',
                  filePath: '/files/intro.pdf',
                  fileSizeBytes: 1024,
                  mimeType: 'application/pdf',
                  status: 'published',
                  downloadCount: 12,
                  createdAt: now,
                  updatedAt: now,
                  publishedAt: now,
                ),
              ],
              pageInfo: const PageInfo(page: 1, pageSize: 100, total: 1),
            ),
          ),
        ],
        child: const MaterialApp(
          home: ResourceTypeResourcesScreen(resourceType: 'note'),
        ),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('Notes Collection'), findsOneWidget);
    expect(find.widgetWithText(AppBar, 'Notes'), findsOneWidget);
    expect(find.text('Count: 1'), findsOneWidget);
    expect(find.text('Intro Notes'), findsOneWidget);
  });
}
