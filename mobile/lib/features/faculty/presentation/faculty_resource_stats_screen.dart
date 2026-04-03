import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

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
        title: const Text('Resource Stats'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: statsAsync.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, _) => Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text('Failed to load resource stats'),
                const SizedBox(height: 8),
                Text(error.toString(), textAlign: TextAlign.center),
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
                Card(
                  child: ListTile(
                    title: const Text('Title'),
                    subtitle: Text(stats.resource.title),
                  ),
                ),
                Card(
                  child: ListTile(
                    title: const Text('Status'),
                    trailing: Text(stats.resource.status),
                  ),
                ),
                Card(
                  child: ListTile(
                    title: const Text('Total Downloads'),
                    trailing: Text(downloads.total.toString()),
                  ),
                ),
                Card(
                  child: ListTile(
                    title: const Text('Mobile/Web/Admin'),
                    trailing: Text(
                      '${downloads.mobile}/${downloads.web}/${downloads.admin}',
                    ),
                  ),
                ),
                Card(
                  child: ListTile(
                    title: const Text('First download'),
                    subtitle: Text(
                      downloads.firstDownloadedAt?.toLocal().toString() ??
                          'Not available',
                    ),
                  ),
                ),
                Card(
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
