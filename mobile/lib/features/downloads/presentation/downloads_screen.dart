import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/ui_state_widgets.dart';
import '../application/downloads_controller.dart';
import '../domain/download_entry.dart';

class DownloadsScreen extends ConsumerWidget {
  const DownloadsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final downloadsAsync = ref.watch(downloadsHistoryProvider);

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () {
            if (Navigator.of(context).canPop()) {
              Navigator.of(context).pop();
            } else {
              context.go('/home');
            }
          },
        ),
        title: const Text('Downloads'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: downloadsAsync.when(
          loading: () => const AppLoadingStateCard(label: 'Loading downloads...'),
          error: (_, __) => const AppEmptyStateCard(
            icon: Icons.error_outline,
            title: 'Unable to load downloads',
            message: 'Please try again in a moment.',
          ),
          data: (page) {
            if (page.items.isEmpty) {
              return const AppEmptyStateCard(
                icon: Icons.download_outlined,
                title: 'No downloads yet',
                message: 'Downloaded resources will appear here.',
              );
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
      margin: EdgeInsets.zero,
      elevation: 1,
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
