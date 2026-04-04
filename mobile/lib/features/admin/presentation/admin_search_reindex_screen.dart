import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/widgets/ui_state_widgets.dart';
import '../../auth/application/auth_controller.dart';
import '../application/admin_controller.dart';
import 'admin_access_denied_view.dart';

class AdminSearchReindexScreen extends ConsumerWidget {
  const AdminSearchReindexScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authControllerProvider);
    if (authState.user?.role != 'admin') {
      return const AdminAccessDeniedView();
    }

    final reindexState = ref.watch(adminSearchReindexControllerProvider);

    return Scaffold(
      appBar: AppBar(
        leading: const BackButton(),
        title: const Text('Search Reindex'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const AppSectionHeader(title: 'Search Maintenance'),
            const SizedBox(height: 10),
            const AppEmptyStateCard(
              icon: Icons.manage_search_outlined,
              title: 'Trigger a full search reindex',
              message: 'Use this for admin recovery and backfill operations.',
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: FilledButton.icon(
                onPressed: reindexState.isLoading
                    ? null
                    : () => _triggerReindex(context, ref),
                icon: const Icon(Icons.sync),
                label: Text(
                  reindexState.isLoading ? 'Reindexing...' : 'Trigger Reindex',
                ),
              ),
            ),
            const SizedBox(height: 12),
            reindexState.when(
              data: (result) {
                if (result == null) {
                  return const SizedBox.shrink();
                }
                return Card(
                  margin: EdgeInsets.zero,
                  child: ListTile(
                    title: const Text('Last result'),
                    subtitle: Text('Status: ${result.status}\nJob ID: ${result.jobId}'),
                  ),
                );
              },
              loading: () => const AppLoadingStateCard(label: 'Checking reindex status...'),
              error: (error, _) => const AppEmptyStateCard(
                icon: Icons.error_outline,
                title: 'Unable to fetch reindex status',
                message: 'Please retry to continue.',
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _triggerReindex(BuildContext context, WidgetRef ref) async {
    await ref.read(adminSearchReindexControllerProvider.notifier).triggerReindex();
    final result = ref.read(adminSearchReindexControllerProvider);

    if (!context.mounted) {
      return;
    }

    if (result.hasError) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Reindex failed: ${result.error}')),
      );
      return;
    }

    final data = result.valueOrNull;
    if (data != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Reindex started: ${data.status}')),
      );
    }
  }
}
