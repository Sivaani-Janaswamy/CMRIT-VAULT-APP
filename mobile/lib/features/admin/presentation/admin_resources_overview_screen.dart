import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/widgets/ui_state_widgets.dart';
import '../../auth/application/auth_controller.dart';
import '../../subjects/domain/paginated_result.dart';
import '../../subjects/domain/subject.dart';
import '../application/admin_controller.dart';
import '../domain/admin_query_filters.dart';
import '../domain/admin_resource_overview_item.dart';
import 'admin_access_denied_view.dart';

class AdminResourcesOverviewScreen extends ConsumerStatefulWidget {
  const AdminResourcesOverviewScreen({super.key});

  @override
  ConsumerState<AdminResourcesOverviewScreen> createState() =>
      _AdminResourcesOverviewScreenState();
}

class _AdminResourcesOverviewScreenState
    extends ConsumerState<AdminResourcesOverviewScreen> {
  final TextEditingController _searchController = TextEditingController();
  final TextEditingController _departmentController = TextEditingController();
  final TextEditingController _academicYearController = TextEditingController();
  int _page = 1;
  String _searchQuery = '';
  String? _status;
  String? _resourceType;
  String? _subjectId;
  int? _semester;

  @override
  void dispose() {
    _searchController.dispose();
    _departmentController.dispose();
    _academicYearController.dispose();
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

  AdminResourcesOverviewFilters get _filters {
    return AdminResourcesOverviewFilters(
      page: _page,
      pageSize: 20,
      subjectId: _subjectId,
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
    final subjectsAsync = ref.watch(adminSubjectsProvider);
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
            _buildTopBar(subjectsAsync),
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
                  final query = _searchQuery.trim().toLowerCase();
                  final filteredItems = query.isEmpty
                      ? page.items
                      : page.items
                          .where(
                            (item) =>
                                item.title.toLowerCase().contains(query) ||
                                item.fileName.toLowerCase().contains(query),
                          )
                          .toList(growable: false);

                  if (filteredItems.isEmpty) {
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
                          itemCount: filteredItems.length,
                          separatorBuilder: (context, index) =>
                              const SizedBox(height: 8),
                          itemBuilder: (context, index) {
                            final item = filteredItems[index];
                            return _ResourceOverviewCard(
                              item: item,
                              onManage: () async {
                                final updated = await context.push(
                                  '/admin/resources/${item.id}/manage',
                                  extra: item,
                                );
                                if (updated == true && mounted) {
                                  ref.invalidate(adminResourcesOverviewProvider(_filters));
                                }
                              },
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

  Widget _buildTopBar(AsyncValue<PaginatedResult<Subject>> subjectsAsync) {
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
              labelText: 'Search resources',
              hintText: 'Search by title or file name',
              prefixIcon: Icons.search,
              suffixIcon: Icons.tune,
            ),
          ),
        ),
        const SizedBox(width: 8),
        FilledButton.icon(
          onPressed: () => _openFiltersSheet(subjectsAsync),
          icon: const Icon(Icons.filter_alt_outlined),
          label: const Text('Filters'),
        ),
      ],
    );
  }

  Future<void> _openFiltersSheet(
    AsyncValue<PaginatedResult<Subject>> subjectsAsync,
  ) async {
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
              child: _buildFilters(subjectsAsync),
            ),
          ),
        );
      },
    );
  }

  Widget _buildFilters(AsyncValue<PaginatedResult<Subject>> subjectsAsync) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          children: [
            TextField(
              controller: _departmentController,
              decoration: _adminFieldDecoration(
                labelText: 'Department (optional)',
                prefixIcon: Icons.apartment,
              ),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _academicYearController,
              decoration: _adminFieldDecoration(
                labelText: 'Academic Year (optional)',
                prefixIcon: Icons.calendar_today,
              ),
            ),
            const SizedBox(height: 8),
            subjectsAsync.when(
              loading: () => const LinearProgressIndicator(),
              error: (_, __) => Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Failed to load subjects'),
                  const SizedBox(height: 8),
                  DropdownButtonFormField<String?>(
                    initialValue: _subjectId,
                    isExpanded: true,
                    decoration: _adminFieldDecoration(
                      labelText: 'Subject',
                      prefixIcon: Icons.menu_book,
                    ),
                    items: const [
                      DropdownMenuItem<String?>(
                        value: null,
                        child: Text('All subjects'),
                      ),
                    ],
                    onChanged: (value) {
                      setState(() {
                        _subjectId = value;
                      });
                    },
                  ),
                ],
              ),
              data: (page) {
                final validSubjectIds = page.items
                    .map((subject) => subject.id)
                    .toSet();
                if (_subjectId != null && !validSubjectIds.contains(_subjectId)) {
                  _subjectId = null;
                }

                final items = <DropdownMenuItem<String?>>[
                  const DropdownMenuItem<String?>(
                    value: null,
                    child: Text('All subjects'),
                  ),
                  ...page.items.map(
                    (subject) => DropdownMenuItem<String?>(
                      value: subject.id,
                      child: Text('${subject.name} (${subject.code})'),
                    ),
                  ),
                ];

                return DropdownButtonFormField<String?>(
                  initialValue: _subjectId,
                  isExpanded: true,
                  decoration: _adminFieldDecoration(
                    labelText: 'Subject',
                    prefixIcon: Icons.menu_book,
                  ),
                  items: items,
                  onChanged: (value) {
                    setState(() {
                      _subjectId = value;
                    });
                  },
                );
              },
            ),
            const SizedBox(height: 8),
            DropdownButtonFormField<String?>(
              initialValue: _status,
              isExpanded: true,
              decoration: _adminFieldDecoration(
                labelText: 'Status',
                prefixIcon: Icons.flag_outlined,
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
              decoration: _adminFieldDecoration(
                labelText: 'Type',
                prefixIcon: Icons.category_outlined,
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
              decoration: _adminFieldDecoration(
                labelText: 'Semester',
                prefixIcon: Icons.school_outlined,
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
                      setState(() {
                        _subjectId = null;
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
}

class _ResourceOverviewCard extends StatelessWidget {
  const _ResourceOverviewCard({
    required this.item,
    required this.onManage,
  });

  final AdminResourceOverviewItem item;
  final VoidCallback onManage;

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
            const SizedBox(height: 10),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: onManage,
                icon: const Icon(Icons.settings_outlined),
                label: const Text('Manage Resource'),
              ),
            ),
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
