import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/ui_state_widgets.dart';
import '../../resources/application/recently_viewed_provider.dart';
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
  static const double _sectionSpacing = 16;

  bool _isDownloading = false;
  bool _isDescriptionExpanded = false;
  String? _trackedResourceId;

  @override
  Widget build(BuildContext context) {
    final resourceAsync = ref.watch(resourceDetailProvider(widget.resourceId));
    final subjectsAsync = ref.watch(subjectsListProvider);
    final subjectNameById = {
      for (final subject in subjectsAsync.valueOrNull?.items ?? const [])
        subject.id: subject.name,
    };

    return Scaffold(
      appBar: AppBar(
        title: const Text('Resource details'),
      ),
      body: SafeArea(
        child: resourceAsync.when(
          loading: () => const Center(
            child: CircularProgressIndicator(),
          ),
          error: (_, __) => const Padding(
            padding: EdgeInsets.all(16),
            child: AppEmptyStateCard(
              icon: Icons.error_outline,
              title: 'Unable to load resource',
              message: 'Please try again in a moment.',
            ),
          ),
          data: (resource) {
            if (_trackedResourceId != resource.id) {
              _trackedResourceId = resource.id;
              WidgetsBinding.instance.addPostFrameCallback((_) {
                if (!mounted) {
                  return;
                }
                ref.read(recentlyViewedProvider.notifier).trackFromResource(resource);
              });
            }

            final description = resource.description?.trim();
            final hasDescription = description != null && description.isNotEmpty;

            return Column(
              children: [
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _ResourcePreviewWidget(resource: resource),
                        const SizedBox(height: _sectionSpacing),
                        Text(
                          resource.title,
                          maxLines: 3,
                          overflow: TextOverflow.ellipsis,
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                        const SizedBox(height: 8),
                        _SubjectTag(
                          subjectLabel:
                              subjectNameById[resource.subjectId] ?? resource.subjectId,
                        ),
                        if (hasDescription) ...[
                          const SizedBox(height: _sectionSpacing),
                          Text(
                            'Description',
                            style: Theme.of(context).textTheme.titleMedium,
                          ),
                          const SizedBox(height: 8),
                          Text(
                            description,
                            maxLines: _isDescriptionExpanded ? null : 4,
                            overflow: _isDescriptionExpanded
                                ? TextOverflow.visible
                                : TextOverflow.ellipsis,
                          ),
                          Align(
                            alignment: Alignment.centerLeft,
                            child: TextButton(
                              onPressed: () {
                                setState(() {
                                  _isDescriptionExpanded = !_isDescriptionExpanded;
                                });
                              },
                              child: Text(
                                _isDescriptionExpanded ? 'Show less' : 'Show more',
                              ),
                            ),
                          ),
                        ],
                        const SizedBox(height: 12),
                        _ResourceMetadataSection(resource: resource),
                        const SizedBox(height: 100),
                      ],
                    ),
                  ),
                ),
                SafeArea(
                  top: false,
                  minimum: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                  child: SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
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
                      label: Text(
                        _isDownloading
                            ? 'Preparing...'
                            : _ctaLabelFor(resource),
                      ),
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

  String _ctaLabelFor(ResourceItem resource) {
    final mime = resource.mimeType.toLowerCase();
    if (mime.contains('pdf')) {
      return 'Download PDF';
    }
    return 'View Resource';
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

class _ResourcePreviewWidget extends StatelessWidget {
  const _ResourcePreviewWidget({required this.resource});

  final ResourceItem resource;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(18),
      child: AspectRatio(
        aspectRatio: 16 / 9,
        child: ColoredBox(
          color: Colors.white,
          child: Center(
            child: Icon(
              _previewIcon(resource),
              size: 56,
              color: AppColors.primary,
            ),
          ),
        ),
      ),
    );
  }

  static IconData _previewIcon(ResourceItem resource) {
    final mime = resource.mimeType.toLowerCase();
    if (mime.contains('pdf')) {
      return Icons.picture_as_pdf_outlined;
    }
    if (mime.contains('image')) {
      return Icons.image_outlined;
    }
    return Icons.description_outlined;
  }
}

class _SubjectTag extends StatelessWidget {
  const _SubjectTag({required this.subjectLabel});

  final String subjectLabel;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        subjectLabel.isEmpty ? 'Subject unavailable' : 'Subject: $subjectLabel',
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
      ),
    );
  }
}

class _ResourceMetadataSection extends StatelessWidget {
  const _ResourceMetadataSection({required this.resource});

  final ResourceItem resource;

  @override
  Widget build(BuildContext context) {
    final date = resource.publishedAt ?? resource.createdAt;
    final formattedDate = date == null
        ? null
        : '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}';

    final items = <_MetadataItemData>[
      _MetadataItemData(label: 'File type', value: resource.resourceType),
      _MetadataItemData(
        label: 'Downloads',
        value: resource.downloadCount.toString(),
      ),
      _MetadataItemData(label: 'File size', value: resource.fileSizeLabel),
      if (resource.uploadedBy.trim().isNotEmpty)
        _MetadataItemData(label: 'Uploaded by', value: resource.uploadedBy),
      if (formattedDate != null)
        _MetadataItemData(label: 'Date', value: formattedDate),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const AppSectionHeader(title: 'Metadata'),
        const SizedBox(height: 8),
        for (final item in items)
          _MetadataItem(
            label: item.label,
            value: item.value,
          ),
      ],
    );
  }
}

class _MetadataItemData {
  const _MetadataItemData({
    required this.label,
    required this.value,
  });

  final String label;
  final String value;
}

class _MetadataItem extends StatelessWidget {
  const _MetadataItem({
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
            width: 110,
            child: Text(
              label,
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
          ),
          Expanded(
            child: Text(
              value,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}
