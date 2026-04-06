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
  final TextEditingController _searchController = TextEditingController();
  final TextEditingController _userIdController = TextEditingController();
  final TextEditingController _resourceIdController = TextEditingController();
  String _searchQuery = '';

  @override
  void dispose() {
    _searchController.dispose();
    _userIdController.dispose();
    _resourceIdController.dispose();
    super.dispose();
  }

  InputDecoration _adminFieldDecoration({
    required String labelText,
    String? hintText,
    IconData? prefixIcon,
    IconData? suffixIcon,
  }) {
    return InputDecoration(
      labelText: labelText,
      hintText: hintText,
      filled: true,
      fillColor: Colors.white,
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: BorderSide.none,
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: BorderSide.none,
      ),
      prefixIcon: prefixIcon == null ? null : Icon(prefixIcon),
      suffixIcon: suffixIcon == null ? null : Icon(suffixIcon),
    );
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
            _buildTopBar(),
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
                  final query = _searchQuery.trim().toLowerCase();
                  final filteredItems = query.isEmpty
                      ? page.items
                      : page.items
                          .where(
                            (item) =>
                                item.resourceTitle.toLowerCase().contains(query),
                          )
                          .toList(growable: false);

                  if (filteredItems.isEmpty) {
                    return const AppEmptyStateCard(
                      icon: Icons.fact_check_outlined,
                      title: 'No audit entries found',
                      message: 'Try adjusting your filters.',
                    );
                  }

                  return ListView.separated(
                    itemCount: filteredItems.length,
                    separatorBuilder: (context, index) => const SizedBox(height: 8),
                    itemBuilder: (context, index) {
                      return _AuditCard(item: filteredItems[index]);
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

  Widget _buildTopBar() {
    return Row(
      children: [
        Expanded(
          child: TextField(
            controller: _searchController,
            onChanged: (value) {
              setState(() {
                _searchQuery = value;
              });
            },
            textInputAction: TextInputAction.search,
            decoration: _adminFieldDecoration(
              labelText: 'Search title',
              hintText: 'Search by resource title',
              prefixIcon: Icons.search,
              suffixIcon: Icons.tune,
            ),
          ),
        ),
        const SizedBox(width: 8),
        FilledButton.icon(
          onPressed: _openFiltersSheet,
          icon: const Icon(Icons.filter_alt_outlined),
          label: const Text('Filters'),
        ),
      ],
    );
  }

  Future<void> _openFiltersSheet() async {
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (context) {
        return SafeArea(
          child: Padding(
            padding: EdgeInsets.only(
              left: 16,
              right: 16,
              top: 12,
              bottom: MediaQuery.of(context).viewInsets.bottom + 12,
            ),
            child: SingleChildScrollView(
              child: _buildFilters(),
            ),
          ),
        );
      },
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
              decoration: _adminFieldDecoration(
                labelText: 'User ID (optional UUID)',
                prefixIcon: Icons.person_outline,
              ),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _resourceIdController,
              decoration: _adminFieldDecoration(
                labelText: 'Resource ID (optional UUID)',
                prefixIcon: Icons.badge_outlined,
              ),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: FilledButton(
                    onPressed: () {
                      setState(() {});
                      Navigator.of(context).pop();
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
                      setState(() {
                        // Keep local search intact on clear; only backend filters reset.
                      });
                      Navigator.of(context).pop();
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
