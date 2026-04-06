import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/widgets/ui_state_widgets.dart';
import '../../resources/presentation/widgets/resource_card_widget.dart';
import '../application/subjects_controller.dart';
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
          loading: () => const AppLoadingStateCard(label: 'Loading subject details...'),
          error: (error, _) => Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const AppEmptyStateCard(
                  icon: Icons.error_outline,
                  title: 'Failed to load subject details',
                  message: 'Please retry to continue.',
                ),
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
                const AppSectionHeader(title: 'Resources'),
                const SizedBox(height: 8),
                Expanded(
                  child: resourcesAsync.when(
                    loading: () => const AppLoadingStateCard(label: 'Loading resources...'),
                    error: (error, _) => Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const AppEmptyStateCard(
                            icon: Icons.error_outline,
                            title: 'Failed to load resources',
                            message: 'Please retry to continue.',
                          ),
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
                        return const AppEmptyStateCard(
                          icon: Icons.folder_open_outlined,
                          title: 'No resources found',
                          message: 'Try searching or explore other subjects.',
                        );
                      }

                      return ListView.separated(
                        itemCount: page.items.length,
                        separatorBuilder: (context, index) =>
                            const SizedBox(height: 8),
                        itemBuilder: (context, index) {
                          final resource = page.items[index];
                          return ResourceCardWidget(
                            data: ResourceCardData(
                              resourceId: resource.id,
                              title: resource.title,
                              subjectLabel: subjectData.name,
                              resourceType: resource.resourceType,
                              downloadCount: resource.downloadCount,
                              fileHint: resource.mimeType,
                            ),
                            onTap: () => context.push(
                              '/resources/${resource.id}/preview',
                              extra: {
                                'title': resource.title,
                                'mimeType': resource.mimeType,
                                'fileName': resource.fileName,
                              },
                            ),
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

