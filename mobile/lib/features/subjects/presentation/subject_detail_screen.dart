import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../application/subjects_controller.dart';
import '../domain/resource_item.dart';
import '../domain/subject.dart';

class SubjectDetailScreen extends ConsumerWidget {
  const SubjectDetailScreen({
    super.key,
    required this.subjectId,
    this.subject,
  });

  final String subjectId;
  final Subject? subject;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final subjectAsync = ref.watch(subjectDetailProvider(subjectId));
    final resourcesAsync = ref.watch(subjectResourcesProvider(subjectId));

    return Scaffold(
      appBar: AppBar(
        title: Text(subject?.name ?? 'Subject detail'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: subjectAsync.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, _) => Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text('Failed to load subject details'),
                const SizedBox(height: 8),
                Text(error.toString(), textAlign: TextAlign.center),
                const SizedBox(height: 12),
                FilledButton(
                  onPressed: () => ref.invalidate(subjectDetailProvider(subjectId)),
                  child: const Text('Retry'),
                ),
              ],
            ),
          ),
          data: (subjectData) {
            return Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          subjectData.name,
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                        const SizedBox(height: 6),
                        Text('Code: ${subjectData.code}'),
                        Text('Department: ${subjectData.department}'),
                        Text('Semester: ${subjectData.semester}'),
                        Text('Status: ${subjectData.isActive ? "active" : "inactive"}'),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  'Resources',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 8),
                Expanded(
                  child: resourcesAsync.when(
                    loading: () => const Center(child: CircularProgressIndicator()),
                    error: (error, _) => Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Text('Failed to load resources'),
                          const SizedBox(height: 8),
                          Text(error.toString(), textAlign: TextAlign.center),
                          const SizedBox(height: 12),
                          FilledButton(
                            onPressed: () =>
                                ref.invalidate(subjectResourcesProvider(subjectId)),
                            child: const Text('Retry'),
                          ),
                        ],
                      ),
                    ),
                    data: (page) {
                      if (page.items.isEmpty) {
                        return const Center(child: Text('No resources available'));
                      }

                      return ListView.separated(
                        itemCount: page.items.length,
                        separatorBuilder: (context, index) =>
                            const SizedBox(height: 8),
                        itemBuilder: (context, index) {
                          final resource = page.items[index];
                          return _ResourceCard(
                            resource: resource,
                            onTap: () => context.push('/resources/${resource.id}'),
                          );
                        },
                      );
                    },
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}

class _ResourceCard extends StatelessWidget {
  const _ResourceCard({
    required this.resource,
    required this.onTap,
  });

  final ResourceItem resource;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        onTap: onTap,
        leading: const Icon(
          Icons.description_outlined,
          color: AppColors.primary,
        ),
        title: Text(resource.title),
        subtitle: Text(
          '${resource.resourceType} • ${resource.academicYear} • Sem ${resource.semester}',
        ),
        trailing: const Icon(Icons.arrow_forward_ios, size: 16),
      ),
    );
  }
}
