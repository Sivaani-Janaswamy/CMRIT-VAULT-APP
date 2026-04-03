import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/theme/app_colors.dart';
import '../application/subjects_controller.dart';
import '../domain/download_url_result.dart';
import '../domain/resource_item.dart';

class ResourceDetailScreen extends ConsumerStatefulWidget {
  const ResourceDetailScreen({
    super.key,
    required this.resourceId,
  });

  final String resourceId;

  @override
  ConsumerState<ResourceDetailScreen> createState() => _ResourceDetailScreenState();
}

class _ResourceDetailScreenState extends ConsumerState<ResourceDetailScreen> {
  bool _isDownloading = false;

  @override
  Widget build(BuildContext context) {
    final resourceAsync = ref.watch(resourceDetailProvider(widget.resourceId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Resource details'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: resourceAsync.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (_, __) => const Center(
            child: Text('Something went wrong'),
          ),
          data: (resource) {
            return ListView(
              children: [
                Text(
                  resource.title,
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 12),
                _DetailRow(label: 'Type', value: resource.resourceType),
                _DetailRow(label: 'Uploaded by', value: resource.uploadedBy),
                _DetailRow(label: 'Academic year', value: resource.academicYear),
                _DetailRow(label: 'Semester', value: resource.semester.toString()),
                _DetailRow(label: 'File name', value: resource.fileName),
                _DetailRow(label: 'File size', value: resource.fileSizeLabel),
                _DetailRow(label: 'Status', value: resource.status),
                _DetailRow(
                  label: 'Download count',
                  value: resource.downloadCount.toString(),
                ),
                if (resource.description != null &&
                    resource.description!.trim().isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Text(
                    'Description',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 8),
                  Text(resource.description!),
                ],
                const SizedBox(height: 24),
                ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: AppColors.text,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  onPressed: _isDownloading
                      ? null
                      : () => _downloadResource(context, resource),
                  icon: _isDownloading
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.download),
                  label: Text(_isDownloading ? 'Preparing...' : 'Download'),
                ),
              ],
            );
          },
        ),
      ),
    );
  }

  Future<void> _downloadResource(
    BuildContext context,
    ResourceItem resource,
  ) async {
    setState(() {
      _isDownloading = true;
    });

    try {
      final DownloadUrlResult result =
          await ref.read(subjectsRepositoryProvider).createDownloadUrl(resource.id);
      if (!context.mounted) {
        return;
      }

      final downloadUri = Uri.tryParse(result.downloadUrl);
      final launched = downloadUri != null
          ? await launchUrl(
              downloadUri,
              mode: LaunchMode.externalApplication,
            )
          : false;

      if (!context.mounted) {
        return;
      }

      if (launched) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Opening download...')),
        );
      } else {
        // Fallback for devices that cannot open the URL directly.
        await Clipboard.setData(ClipboardData(text: result.downloadUrl));
        if (!context.mounted) {
          return;
        }

        await showDialog<void>(
          context: context,
          builder: (dialogContext) {
            return AlertDialog(
              title: const Text('Open download manually'),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Could not open the download link automatically.'),
                  const SizedBox(height: 8),
                  const Text('The signed URL has been copied to your clipboard.'),
                  const SizedBox(height: 12),
                  SelectableText(result.downloadUrl),
                  if (result.expiresAt != null) ...[
                    const SizedBox(height: 12),
                    Text('Expires at: ${result.expiresAt}'),
                  ],
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () async {
                    await Clipboard.setData(
                      ClipboardData(text: result.downloadUrl),
                    );
                  },
                  child: const Text('Copy again'),
                ),
                TextButton(
                  onPressed: () => Navigator.of(dialogContext).pop(),
                  child: const Text('Close'),
                ),
              ],
            );
          },
        );
      }
    } catch (_) {
      if (!context.mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Something went wrong')),
      );
    } finally {
      if (mounted) {
        setState(() {
          _isDownloading = false;
        });
      }
    }
  }
}

class _DetailRow extends StatelessWidget {
  const _DetailRow({
    required this.label,
    required this.value,
  });

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              label,
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
          ),
          Expanded(child: Text(value)),
        ],
      ),
    );
  }
}
