import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../auth/application/auth_controller.dart';
import '../application/admin_controller.dart';
import '../domain/admin_dashboard_summary.dart';
import 'admin_access_denied_view.dart';

class AdminDashboardScreen extends ConsumerStatefulWidget {
  const AdminDashboardScreen({super.key});

  @override
  ConsumerState<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends ConsumerState<AdminDashboardScreen> {
  String _period = '30d';

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authControllerProvider);
    final role = authState.user?.role;
    if (role != 'admin') {
      return const AdminAccessDeniedView();
    }

    final summaryAsync = ref.watch(adminDashboardSummaryProvider(_period));

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () {
            if (Navigator.of(context).canPop()) {
              Navigator.of(context).pop();
            } else {
              context.go('/home');
            }
          },
        ),
        title: const Text('Admin Dashboard'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: LayoutBuilder(
          builder: (context, constraints) {
            final showControls = constraints.maxHeight > 120;
            return Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (showControls) ...[
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
                      const Spacer(),
                      TextButton.icon(
                        onPressed: () {
                          ref.invalidate(adminDashboardSummaryProvider(_period));
                        },
                        icon: const Icon(Icons.refresh),
                        label: const Text('Retry'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                ],
                Expanded(
                  child: summaryAsync.when(
                    loading: () => const Center(child: CircularProgressIndicator()),
                    error: (error, _) => Center(
                      child: SingleChildScrollView(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Text('Failed to load dashboard summary'),
                            const SizedBox(height: 8),
                            Text(error.toString(), textAlign: TextAlign.center),
                            const SizedBox(height: 12),
                            FilledButton(
                              onPressed: () {
                                ref.invalidate(adminDashboardSummaryProvider(_period));
                              },
                              child: const Text('Retry'),
                            ),
                          ],
                        ),
                      ),
                    ),
                    data: (summary) => _SummaryContent(summary: summary),
                  ),
                ),
              ],
            );
          },
        ),
      ),
      bottomNavigationBar: SafeArea(
        minimum: const EdgeInsets.fromLTRB(16, 0, 16, 16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: AppColors.text,
                minimumSize: const Size.fromHeight(48),
              ),
              onPressed: () => context.push('/admin/resources'),
              icon: const Icon(Icons.library_books),
              label: const Text('Resources Overview'),
            ),
            const SizedBox(height: 8),
            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: AppColors.text,
                minimumSize: const Size.fromHeight(48),
              ),
              onPressed: () => context.push('/admin/resources/new'),
              icon: const Icon(Icons.upload_file),
              label: const Text('Create Resource'),
            ),
            const SizedBox(height: 8),
            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.highlightOrange,
                foregroundColor: AppColors.text,
                minimumSize: const Size.fromHeight(48),
              ),
              onPressed: () => context.push('/admin/downloads'),
              icon: const Icon(Icons.analytics_outlined),
              label: const Text('Downloads Overview'),
            ),
            const SizedBox(height: 8),
            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.highlightOrange,
                foregroundColor: AppColors.text,
                minimumSize: const Size.fromHeight(48),
              ),
              onPressed: () => context.push('/admin/downloads/audit'),
              icon: const Icon(Icons.fact_check_outlined),
              label: const Text('Downloads Audit'),
            ),
            const SizedBox(height: 8),
            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.highlightGreen,
                foregroundColor: AppColors.text,
                minimumSize: const Size.fromHeight(48),
              ),
              onPressed: () => context.push('/admin/users'),
              icon: const Icon(Icons.manage_accounts),
              label: const Text('Users Management'),
            ),
            const SizedBox(height: 8),
            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: AppColors.text,
                minimumSize: const Size.fromHeight(48),
              ),
              onPressed: () => context.push('/admin/subjects/create'),
              icon: const Icon(Icons.post_add),
              label: const Text('Create Subject'),
            ),
            const SizedBox(height: 8),
            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: AppColors.text,
                minimumSize: const Size.fromHeight(48),
              ),
              onPressed: () => context.push('/admin/subjects/manage'),
              icon: const Icon(Icons.edit_note),
              label: const Text('Manage Subjects'),
            ),
            const SizedBox(height: 8),
            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.highlightGreen,
                foregroundColor: AppColors.text,
                minimumSize: const Size.fromHeight(48),
              ),
              onPressed: () => context.push('/admin/search/reindex'),
              icon: const Icon(Icons.sync),
              label: const Text('Search Reindex'),
            ),
          ],
        ),
      ),
    );
  }
}

class _SummaryContent extends StatelessWidget {
  const _SummaryContent({
    required this.summary,
  });

  final AdminDashboardSummary summary;

  @override
  Widget build(BuildContext context) {
    return ListView(
      children: [
        _SummaryCard(
          title: 'Users',
          children: [
            _SummaryLine(label: 'Total', value: summary.users.total),
            _SummaryLine(label: 'Active', value: summary.users.active),
            _SummaryLine(label: 'Inactive', value: summary.users.inactive),
            _SummaryLine(label: 'Students', value: summary.users.student),
            _SummaryLine(label: 'Faculty', value: summary.users.faculty),
            _SummaryLine(label: 'Admins', value: summary.users.admin),
          ],
        ),
        _SummaryCard(
          title: 'Subjects',
          children: [
            _SummaryLine(label: 'Total', value: summary.subjects.total),
            _SummaryLine(label: 'Active', value: summary.subjects.active),
          ],
        ),
        _SummaryCard(
          title: 'Resources',
          children: [
            _SummaryLine(label: 'Total', value: summary.resources.total),
            _SummaryLine(label: 'Draft', value: summary.resources.draft),
            _SummaryLine(
              label: 'Pending review',
              value: summary.resources.pendingReview,
            ),
            _SummaryLine(label: 'Published', value: summary.resources.published),
            _SummaryLine(label: 'Rejected', value: summary.resources.rejected),
            _SummaryLine(label: 'Archived', value: summary.resources.archived),
          ],
        ),
        _SummaryCard(
          title: 'Downloads',
          children: [
            _SummaryLine(label: 'Total', value: summary.downloads.total),
            _SummaryLine(label: 'In period', value: summary.downloads.inPeriod),
            _SummaryLine(label: 'Mobile', value: summary.downloads.mobile),
            _SummaryLine(label: 'Web', value: summary.downloads.web),
            _SummaryLine(label: 'Admin', value: summary.downloads.admin),
          ],
        ),
      ],
    );
  }
}

class _SummaryCard extends StatelessWidget {
  const _SummaryCard({
    required this.title,
    required this.children,
  });

  final String title;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 8),
            ...children,
          ],
        ),
      ),
    );
  }
}

class _SummaryLine extends StatelessWidget {
  const _SummaryLine({
    required this.label,
    required this.value,
  });

  final String label;
  final int value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        children: [
          Expanded(child: Text(label)),
          Text(
            value.toString(),
            style: const TextStyle(fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }
}
