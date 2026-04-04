import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/widgets/ui_state_widgets.dart';
import '../application/recently_viewed_provider.dart';
import 'widgets/resource_card_widget.dart';
import '../../subjects/application/subjects_controller.dart';

class RecentlyViewedScreen extends ConsumerWidget {
  const RecentlyViewedScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final items = ref.watch(recentlyViewedProvider);
    final subjectsAsync = ref.watch(subjectsListProvider);
    final subjectNameById = {
      for (final subject in subjectsAsync.valueOrNull?.items ?? const [])
        subject.id: subject.name,
    };
    final resolvedItems = items
        .map(
          (item) => ResourceCardData(
            resourceId: item.resourceId,
            title: item.title,
            subjectLabel: subjectNameById[item.subjectLabel] ?? item.subjectLabel,
            resourceType: item.resourceType,
            downloadCount: item.downloadCount,
            fileHint: item.fileHint,
          ),
        )
        .toList(growable: false);

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
        title: const Text('Recently Viewed'),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              AppSectionHeader(
                title: 'History',
                actionLabel: items.isEmpty ? null : 'Clear',
                onAction: items.isEmpty
                    ? null
                    : () async {
                        final shouldClear = await showDialog<bool>(
                          context: context,
                          builder: (dialogContext) {
                            return AlertDialog(
                              title: const Text('Clear history?'),
                              content: const Text(
                                'This will remove all recently viewed resources.',
                              ),
                              actions: [
                                TextButton(
                                  onPressed: () =>
                                      Navigator.of(dialogContext).pop(false),
                                  child: const Text('Cancel'),
                                ),
                                TextButton(
                                  onPressed: () =>
                                      Navigator.of(dialogContext).pop(true),
                                  child: const Text('Clear'),
                                ),
                              ],
                            );
                          },
                        );

                        if (shouldClear == true && context.mounted) {
                          ref.read(recentlyViewedProvider.notifier).clear();
                        }
                      },
              ),
              const SizedBox(height: 12),
              if (resolvedItems.isEmpty)
                const AppEmptyStateCard(
                  icon: Icons.history,
                  title: 'No recently viewed resources',
                  message: 'Start exploring resources to build your history.',
                )
              else
                Expanded(
                  child: GridView.builder(
                    itemCount: resolvedItems.length,
                    gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 12,
                      childAspectRatio: 0.9,
                    ),
                    itemBuilder: (context, index) {
                      final item = resolvedItems[index];
                      return ResourceCardWidget(
                        data: item,
                        onTap: () => context.push('/resources/${item.resourceId}'),
                      );
                    },
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
