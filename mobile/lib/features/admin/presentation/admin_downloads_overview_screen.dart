import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/widgets/ui_state_widgets.dart';
import '../../auth/application/auth_controller.dart';
import '../application/admin_controller.dart';
import '../domain/admin_download_overview_item.dart';
import '../domain/admin_query_filters.dart';
import 'admin_access_denied_view.dart';

class AdminDownloadsOverviewScreen extends ConsumerStatefulWidget {
  const AdminDownloadsOverviewScreen({super.key});

  @override
  ConsumerState<AdminDownloadsOverviewScreen> createState() =>
      _AdminDownloadsOverviewScreenState();
}

class _AdminDownloadsOverviewScreenState
    extends ConsumerState<AdminDownloadsOverviewScreen> {
  final TextEditingController _searchController = TextEditingController();
  final TextEditingController _userIdController = TextEditingController();
  final TextEditingController _resourceIdController = TextEditingController();
  String _searchQuery = '';
  int _page = 1;
  String? _source;

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

  AdminDownloadsOverviewFilters get _filters {
    return AdminDownloadsOverviewFilters(
      page: _page,
      pageSize: 20,
      userId:
          _userIdController.text.trim().isEmpty ? null : _userIdController.text.trim(),
      resourceId: _resourceIdController.text.trim().isEmpty
          ? null
          : _resourceIdController.text.trim(),
      source: _source,
    );
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authControllerProvider);
    if (authState.user?.role != 'admin') {
      return const AdminAccessDeniedView();
    }

    final filters = _filters;
    final overviewAsync = ref.watch(adminDownloadsOverviewProvider(filters));

    return Scaffold(
      appBar: AppBar(
        leading: const BackButton(),
        title: const Text('Admin Downloads'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            _buildTopBar(),
            const SizedBox(height: 12),
            Expanded(
              child: overviewAsync.when(
                loading: () => const AppLoadingStateCard(
                  label: 'Loading downloads overview...',
                ),
                error: (error, _) => _ErrorState(
                  message: error.toString(),
                  onRetry: () {
                    ref.invalidate(adminDownloadsOverviewProvider(filters));
                  },
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
                    return _EmptyState(
                      onRetry: () {
                        ref.invalidate(adminDownloadsOverviewProvider(filters));
                      },
                    );
                  }

                  return Column(
                    children: [
                      Expanded(
                        child: ListView.separated(
                          itemCount: filteredItems.length,
                          separatorBuilder: (context, index) =>
                              const SizedBox(height: 8),
                          itemBuilder: (context, index) {
                            return _DownloadOverviewCard(item: filteredItems[index]);
                          },
                        ),
                      ),
                      const SizedBox(height: 8),
                      _PaginationBar(
                        page: page.pageInfo.page,
                        pageSize: page.pageInfo.pageSize,
                        total: page.pageInfo.total,
                        onPrevious: page.pageInfo.page > 1
                            ? () {
                                setState(() {
                                  _page = page.pageInfo.page - 1;
                                });
                              }
                            : null,
                        onNext:
                            (page.pageInfo.page * page.pageInfo.pageSize) <
                                    page.pageInfo.total
                                ? () {
                                    setState(() {
                                      _page = page.pageInfo.page + 1;
                                    });
                                  }
                                : null,
                      ),
                    ],
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
                _page = 1;
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
            DropdownButtonFormField<String?>(
              initialValue: _source,
              decoration: _adminFieldDecoration(
                labelText: 'Source',
                prefixIcon: Icons.filter_alt_outlined,
              ),
              items: const [
                DropdownMenuItem<String?>(value: null, child: Text('All')),
                DropdownMenuItem<String?>(value: 'mobile', child: Text('mobile')),
                DropdownMenuItem<String?>(value: 'web', child: Text('web')),
                DropdownMenuItem<String?>(value: 'admin', child: Text('admin')),
              ],
              onChanged: (value) {
                setState(() {
                  _source = value;
                });
              },
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: FilledButton(
                    onPressed: () {
                      setState(() {
                        _page = 1;
                      });
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
                        _source = null;
                        _page = 1;
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

class _DownloadOverviewCard extends StatelessWidget {
  const _DownloadOverviewCard({
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
            Text('Source: ${item.source}'),
            Text('Downloaded at: ${item.downloadedAtLabel}'),
            Text('Resource type: ${item.resourceType}'),
            Text('User ID: ${item.userId}'),
            Text('Resource ID: ${item.resourceId}'),
          ],
        ),
      ),
    );
  }
}

class _PaginationBar extends StatelessWidget {
  const _PaginationBar({
    required this.page,
    required this.pageSize,
    required this.total,
    required this.onPrevious,
    required this.onNext,
  });

  final int page;
  final int pageSize;
  final int total;
  final VoidCallback? onPrevious;
  final VoidCallback? onNext;

  @override
  Widget build(BuildContext context) {
    final from = total == 0 ? 0 : ((page - 1) * pageSize) + 1;
    final to = (page * pageSize) > total ? total : (page * pageSize);

    return Row(
      children: [
        Expanded(
          child: Text('Showing $from-$to of $total'),
        ),
        IconButton(
          onPressed: onPrevious,
          icon: const Icon(Icons.chevron_left),
        ),
        Text('Page $page'),
        IconButton(
          onPressed: onNext,
          icon: const Icon(Icons.chevron_right),
        ),
      ],
    );
  }
}

class _ErrorState extends StatelessWidget {
  const _ErrorState({
    required this.message,
    required this.onRetry,
  });

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const AppEmptyStateCard(
            icon: Icons.error_outline,
            title: 'Failed to load downloads overview',
            message: 'Please retry to continue.',
          ),
          const SizedBox(height: 12),
          FilledButton(
            onPressed: onRetry,
            child: const Text('Retry'),
          ),
        ],
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({
    required this.onRetry,
  });

  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const AppEmptyStateCard(
            icon: Icons.download_outlined,
            title: 'No downloads found',
            message: 'Try adjusting your filters.',
          ),
          const SizedBox(height: 12),
          OutlinedButton(
            onPressed: onRetry,
            child: const Text('Retry'),
          ),
        ],
      ),
    );
  }
}
