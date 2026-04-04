import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/widgets/ui_state_widgets.dart';
import '../../../core/utils/app_logger.dart';
import '../../auth/application/auth_controller.dart';
import '../application/admin_controller.dart';
import '../domain/admin_query_filters.dart';
import '../domain/admin_resource_overview_item.dart';
import 'admin_access_denied_view.dart';
import 'admin_moderation_actions.dart';

class AdminResourcesOverviewScreen extends ConsumerStatefulWidget {
  const AdminResourcesOverviewScreen({super.key});

  @override
  ConsumerState<AdminResourcesOverviewScreen> createState() =>
      _AdminResourcesOverviewScreenState();
}

class _AdminResourcesOverviewScreenState
    extends ConsumerState<AdminResourcesOverviewScreen> {
  final TextEditingController _departmentController = TextEditingController();
  final TextEditingController _academicYearController = TextEditingController();
  final TextEditingController _subjectIdController = TextEditingController();
  int _page = 1;
  String? _status;
  String? _resourceType;
  int? _semester;

  @override
  void dispose() {
    _departmentController.dispose();
    _academicYearController.dispose();
    _subjectIdController.dispose();
    super.dispose();
  }

  AdminResourcesOverviewFilters get _filters {
    return AdminResourcesOverviewFilters(
      page: _page,
      pageSize: 20,
      subjectId: _subjectIdController.text.trim().isEmpty
          ? null
          : _subjectIdController.text.trim(),
      department: _departmentController.text.trim().isEmpty
          ? null
          : _departmentController.text.trim(),
      semester: _semester,
      resourceType: _resourceType,
      academicYear: _academicYearController.text.trim().isEmpty
          ? null
          : _academicYearController.text.trim(),
      status: _status,
    );
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authControllerProvider);
    if (authState.user?.role != 'admin') {
      return const AdminAccessDeniedView();
    }

    final filters = _filters;
    final overviewAsync = ref.watch(adminResourcesOverviewProvider(filters));

    return Scaffold(
      appBar: AppBar(
        leading: const BackButton(),
        title: const Text('Admin Resources'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            _buildFilters(),
            const SizedBox(height: 12),
            Expanded(
              child: overviewAsync.when(
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (error, _) => _ErrorState(
                  message: error.toString(),
                  onRetry: () {
                    ref.invalidate(adminResourcesOverviewProvider(filters));
                  },
                ),
                data: (page) {
                  if (page.items.isEmpty) {
                    return _EmptyState(
                      onRetry: () {
                        ref.invalidate(adminResourcesOverviewProvider(filters));
                      },
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
                            return _ResourceOverviewCard(
                              item: item,
                              onModerate: _moderate,
                            );
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

  Widget _buildFilters() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          children: [
            TextField(
              controller: _departmentController,
              decoration: const InputDecoration(
                labelText: 'Department (optional)',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _academicYearController,
              decoration: const InputDecoration(
                labelText: 'Academic Year (optional)',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _subjectIdController,
              decoration: const InputDecoration(
                labelText: 'Subject ID (optional UUID)',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 8),
            DropdownButtonFormField<String?>(
              initialValue: _status,
              isExpanded: true,
              decoration: const InputDecoration(
                labelText: 'Status',
                border: OutlineInputBorder(),
              ),
              items: const [
                DropdownMenuItem<String?>(value: null, child: Text('All')),
                DropdownMenuItem<String?>(
                  value: 'draft',
                  child: Text('draft'),
                ),
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
                });
              },
            ),
            const SizedBox(height: 8),
            DropdownButtonFormField<String?>(
              initialValue: _resourceType,
              isExpanded: true,
              decoration: const InputDecoration(
                labelText: 'Type',
                border: OutlineInputBorder(),
              ),
              items: const [
                DropdownMenuItem<String?>(value: null, child: Text('All')),
                DropdownMenuItem<String?>(
                  value: 'note',
                  child: Text('note'),
                ),
                DropdownMenuItem<String?>(
                  value: 'question_paper',
                  child: Text('question_paper'),
                ),
                DropdownMenuItem<String?>(
                  value: 'faculty_upload',
                  child: Text('faculty_upload'),
                ),
              ],
              onChanged: (value) {
                setState(() {
                  _resourceType = value;
                });
              },
            ),
            const SizedBox(height: 8),
            DropdownButtonFormField<int?>(
              initialValue: _semester,
              decoration: const InputDecoration(
                labelText: 'Semester',
                border: OutlineInputBorder(),
              ),
              items: [
                const DropdownMenuItem<int?>(value: null, child: Text('All')),
                ...List<DropdownMenuItem<int?>>.generate(
                  8,
                  (index) => DropdownMenuItem<int?>(
                    value: index + 1,
                    child: Text('Semester ${index + 1}'),
                  ),
                ),
              ],
              onChanged: (value) {
                setState(() {
                  _semester = value;
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
                    },
                    child: const Text('Apply Filters'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: OutlinedButton(
                    onPressed: () {
                      _departmentController.clear();
                      _academicYearController.clear();
                      _subjectIdController.clear();
                      setState(() {
                        _status = null;
                        _resourceType = null;
                        _semester = null;
                        _page = 1;
                      });
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

  Future<void> _moderate(
    AdminResourceOverviewItem item,
    String status,
  ) async {
    appLog(
      'Admin moderation request: resourceId=${item.id} from=${item.status} to=$status',
    );

    await ref.read(adminModerationControllerProvider.notifier).updateResourceStatus(
          resourceId: item.id,
          status: status,
        );

    final moderationState = ref.read(adminModerationControllerProvider);
    if (!mounted) {
      return;
    }

    if (moderationState.hasError) {
      appLog(
        'Admin moderation failed: resourceId=${item.id} to=$status error=${moderationState.error}',
      );
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Status update failed: ${moderationState.error}')),
      );
      return;
    }

    appLog('Admin moderation success: resourceId=${item.id} to=$status');

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Status updated to $status')),
    );
    ref.invalidate(adminResourcesOverviewProvider(_filters));
  }
}

class _ResourceOverviewCard extends StatelessWidget {
  const _ResourceOverviewCard({
    required this.item,
    required this.onModerate,
  });

  final AdminResourceOverviewItem item;
  final Future<void> Function(AdminResourceOverviewItem item, String status)
      onModerate;

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
            Text('Type: ${item.resourceType}'),
            Text('Status: ${item.status}'),
            Text('Semester: ${item.semester}'),
            Text('Academic year: ${item.academicYear}'),
            Text('Downloads: ${item.downloadCount}'),
            Text('Size: ${item.fileSizeLabel}'),
            if (item.description != null) ...[
              const SizedBox(height: 6),
              Text(item.description!),
            ],
            if (item.canModerate) ...[
              const SizedBox(height: 10),
              AdminModerationActions(
                resourceTitle: item.title,
                onConfirm: (status) => onModerate(item, status),
              ),
            ],
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

    return Wrap(
      alignment: WrapAlignment.spaceBetween,
      crossAxisAlignment: WrapCrossAlignment.center,
      spacing: 8,
      runSpacing: 8,
      children: [
        Text('Showing $from-$to of $total'),
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
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
            title: 'Failed to load resources overview',
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
            icon: Icons.folder_open_outlined,
            title: 'No resources found',
            message: 'Try searching or explore subjects.',
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
