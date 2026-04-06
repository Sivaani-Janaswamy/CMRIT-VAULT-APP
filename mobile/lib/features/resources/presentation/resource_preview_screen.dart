import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:syncfusion_flutter_pdfviewer/pdfviewer.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/widgets/ui_state_widgets.dart';
import '../../downloads/application/downloads_controller.dart';
import '../../resources/application/recently_viewed_provider.dart';
import '../../subjects/application/subjects_controller.dart';

class ResourcePreviewScreen extends ConsumerStatefulWidget {
  const ResourcePreviewScreen({
    super.key,
    required this.resourceId,
    this.title,
    this.mimeType,
    this.fileName,
  });

  final String resourceId;
  final String? title;
  final String? mimeType;
  final String? fileName;

  @override
  ConsumerState<ResourcePreviewScreen> createState() =>
      _ResourcePreviewScreenState();
}

class _ResourcePreviewScreenState extends ConsumerState<ResourcePreviewScreen> {
  String? _trackedResourceId;

  @override
  Widget build(BuildContext context) {
    final downloadUrlAsync = ref.watch(downloadUrlProvider(widget.resourceId));
    final resourceAsync = ref.watch(resourceDetailProvider(widget.resourceId));
    final resource = resourceAsync.valueOrNull;
    if (resource != null && _trackedResourceId != resource.id) {
      _trackedResourceId = resource.id;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) {
          return;
        }
        ref.read(recentlyViewedProvider.notifier).trackFromResource(resource);
      });
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(
          widget.title?.trim().isNotEmpty == true
              ? widget.title!.trim()
              : 'Preview',
        ),
      ),
      body: SafeArea(
        child: downloadUrlAsync.when(
          loading: () => const Padding(
            padding: EdgeInsets.all(16),
            child: AppLoadingStateCard(label: 'Preparing preview...'),
          ),
          error: (_, __) => _PreviewFallback(
            title: 'Unable to preview file',
            message: 'Unable to preview file. Please download instead.',
            onOpenDetails: () => context.push('/resources/${widget.resourceId}'),
          ),
          data: (result) {
            final url = result.downloadUrl.trim();
            if (url.isEmpty) {
              return _PreviewFallback(
                title: 'Unable to preview file',
                message: 'Unable to preview file. Please download instead.',
                onOpenDetails: () => context.push('/resources/${widget.resourceId}'),
              );
            }

            final fileType = _detectFileType(
              url: url,
              fileName: widget.fileName,
              mimeType: widget.mimeType,
            );

            Widget previewBody;
            if (fileType == _PreviewFileType.pdf) {
              previewBody = SfPdfViewer.network(
                url,
                canShowScrollHead: true,
                canShowScrollStatus: true,
              );
            } else if (fileType == _PreviewFileType.image) {
              previewBody = Center(
                child: InteractiveViewer(
                  child: Image.network(
                    url,
                    fit: BoxFit.contain,
                    loadingBuilder: (context, child, loadingProgress) {
                      if (loadingProgress == null) {
                        return child;
                      }
                      return const Padding(
                        padding: EdgeInsets.all(16),
                        child: AppLoadingStateCard(label: 'Loading image preview...'),
                      );
                    },
                    errorBuilder: (_, __, ___) {
                      return _PreviewFallback(
                        title: 'Unable to preview image',
                        message: 'Unable to preview file. Please download instead.',
                        onOpenDetails: () =>
                            context.push('/resources/${widget.resourceId}'),
                      );
                    },
                  ),
                ),
              );
            } else {
              previewBody = _PreviewFallback(
                title: 'Preview not supported',
                message: 'This file type is not supported for in-app preview.',
                onOpenDetails: () => context.push('/resources/${widget.resourceId}'),
              );
            }

            return Column(
              children: [
                Expanded(child: previewBody),
                SafeArea(
                  top: false,
                  minimum: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                  child: SizedBox(
                    width: double.infinity,
                    child: FilledButton.icon(
                      onPressed: () => _download(context, ref, url),
                      icon: const Icon(Icons.download),
                      label: const Text('Download'),
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

  Future<void> _download(BuildContext context, WidgetRef ref, String url) async {
    ref.invalidate(downloadsHistoryProvider);
    final downloadUri = Uri.tryParse(url);
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
      return;
    }

    await Clipboard.setData(ClipboardData(text: url));
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
              SelectableText(url),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () async {
                await Clipboard.setData(ClipboardData(text: url));
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

  _PreviewFileType _detectFileType({
    required String url,
    String? fileName,
    String? mimeType,
  }) {
    final lowerMime = mimeType?.toLowerCase().trim() ?? '';
    final lowerName = fileName?.toLowerCase().trim() ?? '';
    final lowerUrl = url.toLowerCase();

    if (lowerMime.contains('pdf') ||
        lowerName.endsWith('.pdf') ||
        lowerUrl.contains('.pdf')) {
      return _PreviewFileType.pdf;
    }

    final isImageByMime = lowerMime.startsWith('image/');
    final isImageByName = lowerName.endsWith('.png') ||
        lowerName.endsWith('.jpg') ||
        lowerName.endsWith('.jpeg');
    final isImageByUrl = lowerUrl.contains('.png') ||
        lowerUrl.contains('.jpg') ||
        lowerUrl.contains('.jpeg');

    if (isImageByMime || isImageByName || isImageByUrl) {
      return _PreviewFileType.image;
    }

    return _PreviewFileType.unsupported;
  }
}

class _PreviewFallback extends StatelessWidget {
  const _PreviewFallback({
    required this.title,
    required this.message,
    required this.onOpenDetails,
  });

  final String title;
  final String message;
  final VoidCallback onOpenDetails;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            AppEmptyStateCard(
              icon: Icons.visibility_off_outlined,
              title: title,
              message: message,
            ),
            const SizedBox(height: 12),
            FilledButton(
              onPressed: onOpenDetails,
              child: const Text('Open Details / Download'),
            ),
          ],
        ),
      ),
    );
  }
}

enum _PreviewFileType {
  pdf,
  image,
  unsupported,
}
