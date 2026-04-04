import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../subjects/application/subjects_controller.dart';

class ResourceCardData {
  const ResourceCardData({
    required this.resourceId,
    required this.title,
    required this.subjectLabel,
    required this.resourceType,
    required this.downloadCount,
    required this.fileHint,
  });

  final String resourceId;
  final String title;
  final String subjectLabel;
  final String resourceType;
  final int downloadCount;
  final String fileHint;
}

class ResourceCardWidget extends ConsumerWidget {
  const ResourceCardWidget({
    super.key,
    required this.data,
    required this.onTap,
    this.compact = false,
  });

  final ResourceCardData data;
  final VoidCallback onTap;
  final bool compact;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final subjectsAsync = ref.watch(subjectsListProvider);
    final subjectNameById = {
      for (final subject in subjectsAsync.valueOrNull?.items ?? const [])
        subject.id: subject.name,
    };
    final resolvedSubjectLabel = subjectNameById[data.subjectLabel] ?? data.subjectLabel;

    return Card(
      elevation: 1,
      shadowColor: Colors.black12,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(10),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(_previewIcon(data.fileHint), color: AppColors.primary),
              const SizedBox(height: 8),
              Text(
                data.title,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontWeight: FontWeight.w600,
                  color: AppColors.text,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                resolvedSubjectLabel.isEmpty ? 'Subject unavailable' : resolvedSubjectLabel,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontSize: 12),
              ),
              const SizedBox(height: 4),
              Text(
                '${data.resourceType} • ${data.downloadCount} downloads',
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontSize: 12),
              ),
              if (!compact) ...[
                const SizedBox(height: 8),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton(
                    onPressed: onTap,
                    child: const Text('View'),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  static IconData _previewIcon(String hint) {
    final lower = hint.toLowerCase();
    if (lower.contains('pdf')) {
      return Icons.picture_as_pdf_outlined;
    }
    if (lower.contains('image') || lower.contains('.png') || lower.contains('.jpg')) {
      return Icons.image_outlined;
    }
    if (lower.contains('presentation') || lower.contains('powerpoint') || lower.contains('.ppt')) {
      return Icons.slideshow_outlined;
    }
    return Icons.description_outlined;
  }
}
