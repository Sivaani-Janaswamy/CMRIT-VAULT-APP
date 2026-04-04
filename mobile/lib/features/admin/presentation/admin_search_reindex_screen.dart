import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

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
        title: const Text('Search Reindex'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'Trigger a full search reindex for admin recovery/backfill.',
                textAlign: TextAlign.center,
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
                  return Text(
                    'Last result: ${result.status} (jobId: ${result.jobId})',
                    textAlign: TextAlign.center,
                  );
                },
                loading: () => const CircularProgressIndicator(),
                error: (error, _) => Text(
                  'Error: $error',
                  textAlign: TextAlign.center,
                ),
              ),
            ],
          ),
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
