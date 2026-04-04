import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/widgets/ui_state_widgets.dart';
import '../application/faculty_controller.dart';

class FacultyResourceStatsScreen extends ConsumerWidget {
  const FacultyResourceStatsScreen({
    super.key,
    required this.resourceId,
  });

  final String resourceId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final statsAsync = ref.watch(facultyResourceStatsProvider(resourceId));

    return Scaffold(
      appBar: AppBar(
        leading: const BackButton(),
        title: const Text('Resource Stats'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: statsAsync.when(
          loading: () => const AppLoadingStateCard(label: 'Loading resource stats...'),
          error: (error, _) => Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const AppEmptyStateCard(
                  icon: Icons.error_outline,
                  title: 'Failed to load resource stats',
                  message: 'Please retry to continue.',
                ),
                const SizedBox(height: 12),
                FilledButton(
                  onPressed: () {
                    ref.invalidate(facultyResourceStatsProvider(resourceId));
                  },
                  child: const Text('Retry'),
                ),
              ],
            ),
          ),
          data: (stats) {
            final downloads = stats.downloads;
            return ListView(
              children: [
                const AppSectionHeader(title: 'Resource Statistics'),
                const SizedBox(height: 8),
                Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: ListTile(
                    title: const Text('Title'),
                    subtitle: Text(stats.resource.title),
                  ),
                ),
                Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: ListTile(
                    title: const Text('Status'),
                    trailing: Text(stats.resource.status),
                  ),
                ),
                Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: ListTile(
                    title: const Text('Total Downloads'),
                    trailing: Text(downloads.total.toString()),
                  ),
                ),
                Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: ListTile(
                    title: const Text('Mobile/Web/Admin'),
                    trailing: Text(
                      '${downloads.mobile}/${downloads.web}/${downloads.admin}',
                    ),
                  ),
                ),
                Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: ListTile(
                    title: const Text('First download'),
                    subtitle: Text(
                      downloads.firstDownloadedAt?.toLocal().toString() ??
                          'Not available',
                    ),
                  ),
                ),
                Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: ListTile(
                    title: const Text('Last download'),
                    subtitle: Text(
                      downloads.lastDownloadedAt?.toLocal().toString() ??
                          'Not available',
                    ),
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
