import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/widgets/ui_state_widgets.dart';
import '../../auth/application/auth_controller.dart';
import '../../subjects/domain/resource_item.dart';
import '../application/faculty_controller.dart';
import '../domain/faculty_query_filters.dart';
import 'faculty_access_denied_view.dart';

class FacultyResourcesScreen extends ConsumerStatefulWidget {
  const FacultyResourcesScreen({super.key});

  @override
  ConsumerState<FacultyResourcesScreen> createState() =>
      _FacultyResourcesScreenState();
}

class _FacultyResourcesScreenState extends ConsumerState<FacultyResourcesScreen> {
  int _page = 1;
  String? _status;
  final Set<String> _busyResourceIds = <String>{};

  FacultyResourcesFilters get _filters => FacultyResourcesFilters(
        page: _page,
        pageSize: 20,
        status: _status,
      );

  Future<void> _refreshCurrentList() async {
    ref.invalidate(facultyResourcesProvider(_filters));
  }

  Future<void> _navigateToCreate() async {
    final result = await context.push('/faculty/resources/create');
    if (result == true) {
      await _refreshCurrentList();
    }
  }

  Future<void> _navigateToEdit(ResourceItem item) async {
    final result = await context.push(
      '/faculty/resources/${item.id}/edit',
      extra: item,
    );
    if (result == true) {
      await _refreshCurrentList();
    }
  }

  Future<void> _submitResource(ResourceItem item) async {
    if (_busyResourceIds.contains(item.id)) {
      return;
    }

    setState(() {
      _busyResourceIds.add(item.id);
    });

    try {
      await ref
          .read(facultyResourceActionControllerProvider.notifier)
          .submitResource(resourceId: item.id);
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Resource submitted for review')),
      );
      await _refreshCurrentList();
    } catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Submit failed: $error')),
      );
    } finally {
      if (mounted) {
        setState(() {
          _busyResourceIds.remove(item.id);
        });
      }
    }
  }

  Future<void> _archiveResource(ResourceItem item) async {
    if (_busyResourceIds.contains(item.id)) {
      return;
    }

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          title: const Text('Confirm archive'),
          content: Text('Archive "${item.title}"?'),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(false),
              child: const Text('Cancel'),
            ),
            FilledButton(
              onPressed: () => Navigator.of(dialogContext).pop(true),
              child: const Text('Archive'),
            ),
          ],
        );
      },
    );

    if (confirmed != true) {
      return;
    }

    setState(() {
      _busyResourceIds.add(item.id);
    });

    try {
      await ref
          .read(facultyResourceActionControllerProvider.notifier)
          .archiveResource(resourceId: item.id);
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Resource archived successfully')),
      );
      await _refreshCurrentList();
    } catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Archive failed: $error')),
      );
    } finally {
      if (mounted) {
        setState(() {
          _busyResourceIds.remove(item.id);
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final role = ref.watch(authControllerProvider).user?.role;
    if (role != 'faculty' && role != 'admin') {
      return const FacultyAccessDeniedView();
    }

    final filters = _filters;
    final resourcesAsync = ref.watch(facultyResourcesProvider(filters));

    return Scaffold(
      appBar: AppBar(
        leading: const BackButton(),
        title: const Text('Faculty Resources'),
        actions: [
          IconButton(
            onPressed: _navigateToCreate,
            icon: const Icon(Icons.add),
            tooltip: 'Create resource',
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Row(
              children: [
                Expanded(
                  child: DropdownButtonFormField<String?>(
                    initialValue: _status,
                    decoration: const InputDecoration(
                      labelText: 'Status',
                      border: OutlineInputBorder(),
                    ),
                    items: const [
                      DropdownMenuItem<String?>(value: null, child: Text('All')),
                      DropdownMenuItem<String?>(value: 'draft', child: Text('draft')),
                      DropdownMenuItem<String?>(
                        value: 'pending_review',
                        child: Text('pending_review'),
                      ),
                      DropdownMenuItem<String?>(
                        value: 'published',
                        child: Text('published'),
                      ),
                      DropdownMenuItem<String?>(
                        value: 'rejected',
                        child: Text('rejected'),
                      ),
                      DropdownMenuItem<String?>(
                        value: 'archived',
                        child: Text('archived'),
                      ),
                    ],
                    onChanged: (value) {
                      setState(() {
                        _status = value;
                        _page = 1;
                      });
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Expanded(
              child: resourcesAsync.when(
                loading: () => const AppLoadingStateCard(
                  label: 'Loading faculty resources...',
                ),
                error: (error, _) => Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const AppEmptyStateCard(
                        icon: Icons.error_outline,
                        title: 'Failed to load faculty resources',
                        message: 'Please retry to continue.',
                      ),
                      const SizedBox(height: 12),
                      FilledButton(
                        onPressed: () {
                          ref.invalidate(facultyResourcesProvider(filters));
                        },
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                ),
                data: (page) {
                  if (page.items.isEmpty) {
                    return const AppEmptyStateCard(
                      icon: Icons.folder_open_outlined,
                      title: 'No resources found',
                      message: 'Try searching or explore subjects.',
                    );
                  }

                  return Column(
                    children: [
                      Expanded(
                        child: ListView.separated(
                          itemCount: page.items.length,
                          separatorBuilder: (context, index) =>
                              const SizedBox(height: 8),
                          itemBuilder: (context, index) {
                            final item = page.items[index];
                            return _FacultyResourceCard(
                              item: item,
                              isBusy: _busyResourceIds.contains(item.id),
                              onEdit: () => _navigateToEdit(item),
                              onViewStats: () => context.push(
                                '/faculty/resources/${item.id}/stats',
                              ),
                              onSubmit: item.status == 'draft'
                                  ? () => _submitResource(item)
                                  : null,
                              onArchive: item.status != 'archived'
                                  ? () => _archiveResource(item)
                                  : null,
                            );
                          },
                        ),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              'Page ${page.pageInfo.page}',
                            ),
                          ),
                          IconButton(
                            onPressed: page.pageInfo.page > 1
                                ? () {
                                    setState(() {
                                      _page = page.pageInfo.page - 1;
                                    });
                                  }
                                : null,
                            icon: const Icon(Icons.chevron_left),
                          ),
                          IconButton(
                            onPressed:
                                (page.pageInfo.page * page.pageInfo.pageSize) <
                                        page.pageInfo.total
                                    ? () {
                                        setState(() {
                                          _page = page.pageInfo.page + 1;
                                        });
                                      }
                                    : null,
                            icon: const Icon(Icons.chevron_right),
                          ),
                        ],
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
}

class _FacultyResourceCard extends StatelessWidget {
  const _FacultyResourceCard({
    required this.item,
    required this.isBusy,
    required this.onEdit,
    required this.onViewStats,
    required this.onSubmit,
    required this.onArchive,
  });

  final ResourceItem item;
  final bool isBusy;
  final VoidCallback onEdit;
  final VoidCallback onViewStats;
  final VoidCallback? onSubmit;
  final VoidCallback? onArchive;

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
              item.title,
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 6),
            Text('${item.status} • ${item.resourceType} • sem ${item.semester}'),
            Text('Downloads: ${item.downloadCount}'),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                OutlinedButton(
                  onPressed: isBusy ? null : onEdit,
                  child: const Text('Edit'),
                ),
                OutlinedButton(
                  onPressed: isBusy ? null : onViewStats,
                  child: const Text('Stats'),
                ),
                if (onSubmit != null)
                  FilledButton.tonal(
                    onPressed: isBusy ? null : onSubmit,
                    child: const Text('Submit'),
                  ),
                if (onArchive != null)
                  FilledButton(
                    onPressed: isBusy ? null : onArchive,
                    child: Text(isBusy ? 'Working...' : 'Archive'),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
