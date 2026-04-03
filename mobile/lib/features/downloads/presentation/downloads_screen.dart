import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../application/downloads_controller.dart';
import '../domain/download_entry.dart';

class DownloadsScreen extends ConsumerWidget {
  const DownloadsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final downloadsAsync = ref.watch(downloadsHistoryProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Downloads'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: downloadsAsync.when(
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
                final entry = page.items[index];
                return _DownloadCard(entry: entry);
              },
            );
          },
        ),
      ),
    );
  }
}

class _DownloadCard extends StatelessWidget {
  const _DownloadCard({
    required this.entry,
  });

  final DownloadEntry entry;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        leading: const Icon(
          Icons.download_outlined,
          color: AppColors.primary,
        ),
        title: Text(entry.resourceTitle),
        subtitle: Text('${entry.source} • ${entry.downloadedAtLabel}'),
      ),
    );
  }
}
