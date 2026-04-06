import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../faculty/application/faculty_controller.dart';
import '../../faculty/presentation/faculty_resource_form_screen.dart';
import '../../subjects/domain/resource_item.dart';
import '../application/admin_controller.dart';
import '../domain/admin_resource_overview_item.dart';
import 'admin_moderation_actions.dart';

class AdminManageResourceScreen extends ConsumerStatefulWidget {
  const AdminManageResourceScreen({
    super.key,
    required this.resourceId,
    required this.initialItem,
  });

  final String resourceId;
  final AdminResourceOverviewItem? initialItem;

  @override
  ConsumerState<AdminManageResourceScreen> createState() =>
      _AdminManageResourceScreenState();
}

class _AdminManageResourceScreenState
    extends ConsumerState<AdminManageResourceScreen> {
  bool _isWorking = false;

  @override
  Widget build(BuildContext context) {
    final item = widget.initialItem;

    return Scaffold(
      appBar: AppBar(
        leading: const BackButton(),
        title: const Text('Manage Resource'),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: item == null
              ? const Center(
                  child: Text('Resource details are unavailable.'),
                )
              : Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Card(
                      margin: EdgeInsets.zero,
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              item.title,
                              style: Theme.of(context).textTheme.titleMedium,
                            ),
                            const SizedBox(height: 6),
                            Text('Status: ${item.status}'),
                            Text('Type: ${item.resourceType}'),
                            Text('Semester: ${item.semester}'),
                            Text('Academic year: ${item.academicYear}'),
                            if (item.description != null &&
                                item.description!.trim().isNotEmpty) ...[
                              const SizedBox(height: 8),
                              Text(item.description!),
                            ],
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton.icon(
                        onPressed: _isWorking
                            ? null
                            : () async {
                                final updated = await Navigator.of(context).push<bool>(
                                  MaterialPageRoute(
                                    builder: (_) => FacultyResourceFormScreen(
                                      resourceId: item.id,
                                      initialResource: _toResourceItem(item),
                                    ),
                                  ),
                                );

                                if (!context.mounted || updated != true) {
                                  return;
                                }
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text('Resource updated successfully'),
                                  ),
                                );
                                Navigator.of(context).pop(true);
                              },
                        icon: const Icon(Icons.edit_outlined),
                        label: const Text('Edit Resource'),
                      ),
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton.icon(
                        onPressed: _isWorking
                            ? null
                            : () => context.push('/faculty/resources/${item.id}/stats'),
                        icon: const Icon(Icons.bar_chart_outlined),
                        label: const Text('View Stats'),
                      ),
                    ),
                    const SizedBox(height: 12),
                    if (item.status == 'draft')
                      SizedBox(
                        width: double.infinity,
                        child: FilledButton.tonalIcon(
                          onPressed: _isWorking
                              ? null
                              : () => _submitResource(item),
                          icon: const Icon(Icons.send_outlined),
                          label: const Text('Submit for Review'),
                        ),
                      ),
                    if (item.status == 'draft')
                      const SizedBox(height: 12),
                    if (item.canModerate)
                      AdminModerationActions(
                        resourceTitle: item.title,
                        onConfirm: (status) => _moderate(item, status),
                      )
                    else
                      const Text('No moderation action available for current status.'),
                    const SizedBox(height: 12),
                    if (item.status != 'archived')
                      SizedBox(
                        width: double.infinity,
                        child: OutlinedButton.icon(
                          onPressed: _isWorking
                              ? null
                              : () => _archiveResource(item),
                          icon: const Icon(Icons.archive_outlined),
                          label: const Text('Archive Resource'),
                        ),
                      ),
                  ],
                ),
        ),
      ),
    );
  }

  Future<bool> _confirmAction({
    required String message,
    String confirmLabel = 'Confirm',
  }) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          title: const Text('Are you sure?'),
          content: Text(message),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(false),
              child: const Text('Cancel'),
            ),
            FilledButton(
              onPressed: () => Navigator.of(dialogContext).pop(true),
              child: Text(confirmLabel),
            ),
          ],
        );
      },
    );

    return confirmed == true;
  }

  Future<void> _submitResource(AdminResourceOverviewItem item) async {
    final confirmed = await _confirmAction(
      message: 'Submit "${item.title}" for review?',
      confirmLabel: 'Submit',
    );
    if (!confirmed) {
      return;
    }

    setState(() {
      _isWorking = true;
    });

    try {
      await ref
          .read(facultyResourceActionControllerProvider.notifier)
          .submitResource(resourceId: item.id);

      final state = ref.read(facultyResourceActionControllerProvider);
      if (!mounted) {
        return;
      }

      if (state.hasError) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Submit failed: ${state.error}')),
        );
        return;
      }

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Resource submitted for review')),
      );
      Navigator.of(context).pop(true);
    } finally {
      if (mounted) {
        setState(() {
          _isWorking = false;
        });
      }
    }
  }

  Future<void> _archiveResource(AdminResourceOverviewItem item) async {
    final confirmed = await _confirmAction(
      message: 'Archive "${item.title}"?',
      confirmLabel: 'Archive',
    );
    if (!confirmed) {
      return;
    }

    setState(() {
      _isWorking = true;
    });

    try {
      await ref
          .read(facultyResourceActionControllerProvider.notifier)
          .archiveResource(resourceId: item.id);

      final state = ref.read(facultyResourceActionControllerProvider);
      if (!mounted) {
        return;
      }

      if (state.hasError) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Archive failed: ${state.error}')),
        );
        return;
      }

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Resource archived successfully')),
      );
      Navigator.of(context).pop(true);
    } finally {
      if (mounted) {
        setState(() {
          _isWorking = false;
        });
      }
    }
  }

  Future<void> _moderate(
    AdminResourceOverviewItem item,
    String status,
  ) async {
    setState(() {
      _isWorking = true;
    });

    try {
      await ref.read(adminModerationControllerProvider.notifier).updateResourceStatus(
            resourceId: item.id,
            status: status,
          );

      final moderationState = ref.read(adminModerationControllerProvider);
      if (!mounted) {
        return;
      }

      if (moderationState.hasError) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Status update failed: ${moderationState.error}'),
          ),
        );
        return;
      }

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Status updated to $status')),
      );
      Navigator.of(context).pop(true);
    } finally {
      if (mounted) {
        setState(() {
          _isWorking = false;
        });
      }
    }
  }

  ResourceItem _toResourceItem(AdminResourceOverviewItem item) {
    return ResourceItem(
      id: item.id,
      subjectId: item.subjectId,
      uploadedBy: item.uploadedBy,
      title: item.title,
      description: item.description,
      resourceType: item.resourceType,
      academicYear: item.academicYear,
      semester: item.semester,
      fileName: item.fileName,
      filePath: item.filePath,
      fileSizeBytes: item.fileSizeBytes,
      mimeType: item.mimeType,
      status: item.status,
      downloadCount: item.downloadCount,
      publishedAt: item.publishedAt,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    );
  }
}
