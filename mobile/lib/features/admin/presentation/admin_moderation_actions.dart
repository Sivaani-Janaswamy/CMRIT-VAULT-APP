import 'package:flutter/material.dart';

typedef ModerationActionCallback = Future<void> Function(String status);

class AdminModerationActions extends StatelessWidget {
  const AdminModerationActions({
    super.key,
    required this.resourceTitle,
    required this.onConfirm,
  });

  final String resourceTitle;
  final ModerationActionCallback onConfirm;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: FilledButton.tonal(
            onPressed: () => _confirmAndRun(context, 'rejected'),
            child: const Text('Reject'),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: FilledButton(
            onPressed: () => _confirmAndRun(context, 'published'),
            child: const Text('Publish'),
          ),
        ),
      ],
    );
  }

  Future<void> _confirmAndRun(BuildContext context, String status) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          title: const Text('Are you sure?'),
          content: Text('Update status of "$resourceTitle" to $status?'),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(false),
              child: const Text('Cancel'),
            ),
            FilledButton(
              onPressed: () => Navigator.of(dialogContext).pop(true),
              child: const Text('Confirm'),
            ),
          ],
        );
      },
    );

    if (confirmed != true) {
      return;
    }
    await onConfirm(status);
  }
}
