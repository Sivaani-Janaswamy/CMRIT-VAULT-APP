import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/widgets/ui_state_widgets.dart';

class FacultyAccessDeniedView extends StatelessWidget {
  const FacultyAccessDeniedView({
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Faculty'),
      ),
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const AppEmptyStateCard(
                  icon: Icons.lock_outline,
                  title: 'Access denied',
                  message: 'You do not have faculty access.',
                ),
                const SizedBox(height: 16),
                FilledButton(
                  onPressed: () => context.go('/home'),
                  child: const Text('Back to Home'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
