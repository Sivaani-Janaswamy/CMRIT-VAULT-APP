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
    final resourcesAsync = ref.watch(subjectResourcesProvider(subjectId));

    return Scaffold(
      appBar: AppBar(
        title: Text(subject?.name ?? 'Subject resources'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: resourcesAsync.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (_, __) => const Center(
            child: Text('Something went wrong'),
          ),
          data: (page) {
            if (page.items.isEmpty) {
              return const Center(child: Text('No data available'));
            }

            return ListView.separated(
              itemCount: page.items.length,
              separatorBuilder: (context, index) => const SizedBox(height: 8),
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
