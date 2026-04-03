import 'package:cmrit_vault_mobile/features/faculty/presentation/faculty_resource_form_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('FacultyResourceFormScreen renders create form fields', (tester) async {
    await tester.pumpWidget(
      const ProviderScope(
        child: MaterialApp(
          home: FacultyResourceFormScreen(),
        ),
      ),
    );

    expect(find.text('Create Resource'), findsOneWidget);
    expect(find.text('Subject ID'), findsOneWidget);
    expect(find.text('Title'), findsOneWidget);
    expect(find.text('Academic year'), findsOneWidget);
    expect(find.text('Create & Upload'), findsOneWidget);
  });
}
