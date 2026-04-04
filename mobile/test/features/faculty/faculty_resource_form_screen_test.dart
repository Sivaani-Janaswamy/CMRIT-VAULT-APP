import 'package:cmrit_vault_mobile/features/faculty/presentation/faculty_resource_form_screen.dart';
import 'package:cmrit_vault_mobile/features/subjects/application/subjects_controller.dart';
import 'package:cmrit_vault_mobile/features/subjects/domain/page_info.dart';
import 'package:cmrit_vault_mobile/features/subjects/domain/paginated_result.dart';
import 'package:cmrit_vault_mobile/features/subjects/domain/subject.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('FacultyResourceFormScreen renders create form fields', (tester) async {
    final now = DateTime.now();
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          subjectsSelectionProvider.overrideWith(
            (ref) async => PaginatedResult<Subject>(
              items: [
                Subject(
                  id: 's1',
                  code: 'CSE101',
                  name: 'Programming in C',
                  department: 'CSE',
                  semester: 1,
                  isActive: true,
                  createdAt: now,
                  updatedAt: now,
                ),
              ],
              pageInfo: const PageInfo(page: 1, pageSize: 20, total: 1),
            ),
          ),
        ],
        child: MaterialApp(
          home: FacultyResourceFormScreen(),
        ),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.widgetWithText(AppBar, 'Create Resource'), findsOneWidget);
    expect(find.widgetWithText(DropdownButtonFormField<String>, 'Subject'), findsOneWidget);
    expect(find.widgetWithText(TextFormField, 'Title'), findsOneWidget);
    expect(find.widgetWithText(TextFormField, 'Academic year'), findsOneWidget);
    expect(find.widgetWithText(FilledButton, 'Create & Upload'), findsOneWidget);
  });
}
