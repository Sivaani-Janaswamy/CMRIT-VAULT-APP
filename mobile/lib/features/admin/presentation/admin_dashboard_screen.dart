import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/ui_state_widgets.dart';
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
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const AppSectionHeader(title: 'Overview'),
              const SizedBox(height: 10),
              Card(
                margin: EdgeInsets.zero,
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Row(
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
                ),
              ),
              const SizedBox(height: 12),
              summaryAsync.when(
                loading: () => const AppLoadingStateCard(
                  label: 'Loading dashboard summary...',
                ),
                error: (error, _) => Column(
                  children: [
                    const AppEmptyStateCard(
                      icon: Icons.error_outline,
                      title: 'Failed to load dashboard summary',
                      message: 'Please retry to continue.',
                    ),
                    const SizedBox(height: 12),
                    FilledButton(
                      onPressed: () {
                        ref.invalidate(adminDashboardSummaryProvider(_period));
                      },
                      child: const Text('Retry'),
                    ),
                  ],
                ),
                data: (summary) => _SummaryContent(summary: summary),
              ),
              const SizedBox(height: 16),
              const AppSectionHeader(title: 'Actions'),
              const SizedBox(height: 10),
              _AdminActionCard(
                icon: Icons.library_books,
                title: 'Resources Overview',
                subtitle: 'Review and moderate all resources',
                color: AppColors.primary,
                onTap: () => context.push('/admin/resources'),
              ),
              _AdminActionCard(
                icon: Icons.upload_file,
                title: 'Create Resource',
                subtitle: 'Add and publish new content',
                color: AppColors.primary,
                onTap: () => context.push('/admin/resources/new'),
              ),
              _AdminActionCard(
                icon: Icons.post_add,
                title: 'Create Subject',
                subtitle: 'Add a new subject entry',
                color: AppColors.primary,
                onTap: () => context.push('/admin/subjects/create'),
              ),
              _AdminActionCard(
                icon: Icons.edit_note,
                title: 'Manage Subjects',
                subtitle: 'Edit and maintain subject catalog',
                color: AppColors.primary,
                onTap: () => context.push('/admin/subjects/manage'),
              ),
              _AdminActionCard(
                icon: Icons.analytics_outlined,
                title: 'Downloads Overview',
                subtitle: 'Monitor download trends',
                color: AppColors.highlightOrange,
                onTap: () => context.push('/admin/downloads'),
              ),
              _AdminActionCard(
                icon: Icons.fact_check_outlined,
                title: 'Downloads Audit',
                subtitle: 'Inspect detailed download logs',
                color: AppColors.highlightOrange,
                onTap: () => context.push('/admin/downloads/audit'),
              ),
              _AdminActionCard(
                icon: Icons.manage_accounts,
                title: 'Users Management',
                subtitle: 'Manage roles and account states',
                color: AppColors.highlightGreen,
                onTap: () => context.push('/admin/users'),
              ),
              _AdminActionCard(
                icon: Icons.sync,
                title: 'Search Reindex',
                subtitle: 'Trigger admin recovery/backfill index jobs',
                color: AppColors.highlightGreen,
                onTap: () => context.push('/admin/search/reindex'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _AdminActionCard extends StatelessWidget {
  const _AdminActionCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.color,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      elevation: 1,
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: color,
          foregroundColor: AppColors.text,
          child: Icon(icon),
        ),
        title: Text(title),
        subtitle: Text(subtitle),
        trailing: const Icon(Icons.arrow_forward_ios, size: 16),
        onTap: onTap,
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
    return Column(
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
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 1,
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
