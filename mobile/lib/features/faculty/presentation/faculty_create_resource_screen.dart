import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/application/auth_controller.dart';
import 'faculty_access_denied_view.dart';
import 'faculty_resource_form_screen.dart';

class FacultyCreateResourceScreen extends ConsumerWidget {
  const FacultyCreateResourceScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final role = ref.watch(authControllerProvider).user?.role;
    if (role != 'faculty' && role != 'admin') {
      return const FacultyAccessDeniedView();
    }

    return const FacultyResourceFormScreen();
  }
}
