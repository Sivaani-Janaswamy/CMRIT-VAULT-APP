import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../auth/application/auth_controller.dart';
import '../application/faculty_controller.dart';
import 'faculty_access_denied_view.dart';

class FacultyDashboardScreen extends ConsumerStatefulWidget {
  const FacultyDashboardScreen({super.key});

  @override
  ConsumerState<FacultyDashboardScreen> createState() =>
      _FacultyDashboardScreenState();
}

class _FacultyDashboardScreenState extends ConsumerState<FacultyDashboardScreen> {
  String _period = '30d';

  @override
  Widget build(BuildContext context) {
    final role = ref.watch(authControllerProvider).user?.role;
    if (role != 'faculty' && role != 'admin') {
      return const FacultyAccessDeniedView();
    }

    final summaryAsync = ref.watch(facultyDashboardSummaryProvider(_period));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Faculty Dashboard'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                const Text('Period:'),
                const SizedBox(width: 12),
                DropdownButton<String>(
                  value: _period,
                  items: const [
                    DropdownMenuItem(value: '7d', child: Text('Last 7 days')),
                    DropdownMenuItem(value: '30d', child: Text('Last 30 days')),
                    DropdownMenuItem(value: '90d', child: Text('Last 90 days')),
                    DropdownMenuItem(value: 'all', child: Text('All time')),
                  ],
                  onChanged: (value) {
                    if (value == null) {
                      return;
                    }
                    setState(() {
                      _period = value;
                    });
                  },
                ),
              ],
            ),
            const SizedBox(height: 12),
            Expanded(
              child: summaryAsync.when(
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (error, _) => Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text('Failed to load faculty dashboard'),
                      const SizedBox(height: 8),
                      Text(error.toString(), textAlign: TextAlign.center),
                      const SizedBox(height: 12),
                      FilledButton(
                        onPressed: () {
                          ref.invalidate(facultyDashboardSummaryProvider(_period));
                        },
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                ),
                data: (summary) {
                  return ListView(
                    children: [
                      Card(
                        child: ListTile(
                          title: const Text('Resources total'),
                          trailing: Text(summary.resources.total.toString()),
                        ),
                      ),
                      Card(
                        child: ListTile(
                          title: const Text('Pending review'),
                          trailing: Text(summary.resources.pendingReview.toString()),
                        ),
                      ),
                      Card(
                        child: ListTile(
                          title: const Text('Published'),
                          trailing: Text(summary.resources.published.toString()),
                        ),
                      ),
                      Card(
                        child: ListTile(
                          title: const Text('Downloads in period'),
                          trailing: Text(summary.downloads.inPeriod.toString()),
                        ),
                      ),
                    ],
                  );
                },
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: SafeArea(
        minimum: const EdgeInsets.fromLTRB(16, 0, 16, 16),
        child: FilledButton.icon(
          onPressed: () => context.push('/faculty/resources'),
          icon: const Icon(Icons.upload_file),
          label: const Text('Manage Resources'),
        ),
      ),
    );
  }
}
