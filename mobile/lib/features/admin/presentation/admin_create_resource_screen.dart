import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/application/auth_controller.dart';
import '../../faculty/presentation/faculty_resource_form_screen.dart';
import 'admin_access_denied_view.dart';

class AdminCreateResourceScreen extends ConsumerWidget {
  const AdminCreateResourceScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final role = ref.watch(authControllerProvider).user?.role;
    if (role != 'admin') {
      return const AdminAccessDeniedView();
    }

    return const FacultyResourceFormScreen();
  }
}
