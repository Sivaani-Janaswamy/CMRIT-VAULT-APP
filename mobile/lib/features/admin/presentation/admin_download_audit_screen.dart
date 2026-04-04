import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/widgets/ui_state_widgets.dart';
import '../../auth/application/auth_controller.dart';
import '../application/admin_controller.dart';
import '../domain/admin_download_overview_item.dart';
import '../domain/admin_query_filters.dart';
import 'admin_access_denied_view.dart';

class AdminDownloadAuditScreen extends ConsumerStatefulWidget {
  const AdminDownloadAuditScreen({super.key});

  @override
  ConsumerState<AdminDownloadAuditScreen> createState() =>
      _AdminDownloadAuditScreenState();
}

class _AdminDownloadAuditScreenState
    extends ConsumerState<AdminDownloadAuditScreen> {
  final TextEditingController _userIdController = TextEditingController();
  final TextEditingController _resourceIdController = TextEditingController();

  @override
  void dispose() {
    _userIdController.dispose();
    _resourceIdController.dispose();
    super.dispose();
  }

  AdminDownloadsAuditFilters get _filters => AdminDownloadsAuditFilters(
        page: 1,
        pageSize: 20,
        userId:
            _userIdController.text.trim().isEmpty ? null : _userIdController.text.trim(),
        resourceId: _resourceIdController.text.trim().isEmpty
            ? null
            : _resourceIdController.text.trim(),
      );

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authControllerProvider);
    if (authState.user?.role != 'admin') {
      return const AdminAccessDeniedView();
    }

    final filters = _filters;
    final auditAsync = ref.watch(adminDownloadsAuditProvider(filters));

    return Scaffold(
      appBar: AppBar(
        leading: const BackButton(),
        title: const Text('Download Audit'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            _buildFilters(),
            const SizedBox(height: 12),
            Expanded(
              child: auditAsync.when(
                loading: () => const AppLoadingStateCard(
                  label: 'Loading download audit...',
                ),
                error: (error, _) => Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const AppEmptyStateCard(
                        icon: Icons.error_outline,
                        title: 'Failed to load download audit',
                        message: 'Please retry to continue.',
                      ),
                      const SizedBox(height: 12),
                      FilledButton(
                        onPressed: () {
                          ref.invalidate(adminDownloadsAuditProvider(filters));
                        },
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                ),
                data: (page) {
                  if (page.items.isEmpty) {
                    return const AppEmptyStateCard(
                      icon: Icons.fact_check_outlined,
                      title: 'No audit entries found',
                      message: 'Try adjusting your filters.',
                    );
                  }

                  return ListView.separated(
                    itemCount: page.items.length,
                    separatorBuilder: (context, index) => const SizedBox(height: 8),
                    itemBuilder: (context, index) {
                      return _AuditCard(item: page.items[index]);
                    },
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFilters() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          children: [
            TextField(
              controller: _userIdController,
              decoration: const InputDecoration(
                labelText: 'User ID (optional UUID)',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _resourceIdController,
              decoration: const InputDecoration(
                labelText: 'Resource ID (optional UUID)',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: FilledButton(
                    onPressed: () {
                      setState(() {});
                    },
                    child: const Text('Apply Filters'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: OutlinedButton(
                    onPressed: () {
                      _userIdController.clear();
                      _resourceIdController.clear();
                      setState(() {});
                    },
                    child: const Text('Clear'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _AuditCard extends StatelessWidget {
  const _AuditCard({
    required this.item,
  });

  final AdminDownloadOverviewItem item;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: EdgeInsets.zero,
      elevation: 1,
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              item.resourceTitle,
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 6),
            Text('User ID: ${item.userId}'),
            Text('Resource ID: ${item.resourceId}'),
            Text('Resource Type: ${item.resourceType}'),
            Text('Source: ${item.source}'),
            Text('Downloaded At: ${item.downloadedAtLabel}'),
          ],
        ),
      ),
    );
  }
}
