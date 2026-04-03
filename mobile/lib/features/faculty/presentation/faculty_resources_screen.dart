import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

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

  FacultyResourcesFilters get _filters => FacultyResourcesFilters(
        page: _page,
        pageSize: 20,
        status: _status,
      );

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
        title: const Text('Faculty Resources'),
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
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (error, _) => Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text('Failed to load faculty resources'),
                      const SizedBox(height: 8),
                      Text(error.toString(), textAlign: TextAlign.center),
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
                    return const Center(
                      child: Text('No resources found'),
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
                            return _FacultyResourceCard(item: page.items[index]);
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
  });

  final ResourceItem item;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        title: Text(item.title),
        subtitle: Text(
          '${item.status} • ${item.resourceType} • sem ${item.semester}',
        ),
        trailing: Text(item.downloadCount.toString()),
      ),
    );
  }
}
