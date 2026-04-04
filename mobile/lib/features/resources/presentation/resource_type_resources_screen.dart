import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/widgets/ui_state_widgets.dart';
import '../../subjects/application/subjects_controller.dart';
import '../../subjects/domain/resource_item.dart';
import 'widgets/resource_card_widget.dart';

class ResourceTypeResourcesScreen extends ConsumerWidget {
  const ResourceTypeResourcesScreen({
    super.key,
    required this.resourceType,
  });

  final String resourceType;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final resourcesAsync = ref.watch(resourcesByTypeProvider(resourceType));
    final subjectsAsync = ref.watch(subjectsListProvider);
    final Map<String, String> subjectNameById = {
      for (final subject in subjectsAsync.valueOrNull?.items ?? const [])
        subject.id: subject.name,
    };

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
        title: Text(_screenTitle(resourceType)),
      ),
      body: SafeArea(
        child: resourcesAsync.when(
          loading: () => Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _TypeBannerCard(resourceType: resourceType),
                const SizedBox(height: 12),
                const AppLoadingStateCard(label: 'Loading resources...'),
              ],
            ),
          ),
          error: (_, __) => Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _TypeBannerCard(resourceType: resourceType),
                const SizedBox(height: 12),
                const AppEmptyStateCard(
                  icon: Icons.error_outline,
                  title: 'Unable to load resources',
                  message: 'Please try again in a moment.',
                ),
              ],
            ),
          ),
          data: (page) {
            return Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  _TypeBannerCard(resourceType: resourceType),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: AppSectionHeader(
                          title: _screenTitle(resourceType),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Text(
                          'Count: ${page.items.length}',
                          style: const TextStyle(fontSize: 12),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  if (page.items.isEmpty)
                    const Expanded(
                      child: AppEmptyStateCard(
                        icon: Icons.folder_open_outlined,
                        title: 'No resources found',
                        message: 'Try searching or explore subjects.',
                      ),
                    )
                  else
                    Expanded(
                      child: LayoutBuilder(
                        builder: (context, constraints) {
                          final width = constraints.maxWidth;
                          final crossAxisCount = width < 380 ? 1 : 2;
                          return GridView.builder(
                            itemCount: page.items.length,
                            gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                              crossAxisCount: crossAxisCount,
                              crossAxisSpacing: 12,
                              mainAxisSpacing: 12,
                              // Slightly taller cards avoid sub-pixel text overflow
                              // on some devices/text scales (e.g., overflow by 0.2 px).
                              childAspectRatio: width < 380 ? 1.85 : 0.82,
                            ),
                            itemBuilder: (context, index) {
                              final resource = page.items[index];
                              return ResourceCardWidget(
                                data: _toCardData(resource, subjectNameById),
                                onTap: () => context.push('/resources/${resource.id}'),
                              );
                            },
                          );
                        },
                      ),
                    ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }

  ResourceCardData _toCardData(
    ResourceItem resource,
    Map<String, String> subjectNameById,
  ) {
    return ResourceCardData(
      resourceId: resource.id,
      title: resource.title,
      subjectLabel: subjectNameById[resource.subjectId] ?? 'Unknown subject',
      resourceType: resource.resourceType,
      downloadCount: resource.downloadCount,
      fileHint: resource.mimeType,
    );
  }

  String _screenTitle(String type) {
    switch (type) {
      case 'note':
        return 'Notes';
      case 'question_paper':
        return 'PYQs';
      case 'faculty_upload':
        return 'Faculty Uploads';
      default:
        return 'Resources';
    }
  }
}

class _TypeBannerCard extends StatelessWidget {
  const _TypeBannerCard({required this.resourceType});

  final String resourceType;

  @override
  Widget build(BuildContext context) {
    final title = _title(resourceType);
    final message = _message(resourceType);
    final icon = _icon(resourceType);

    return Card(
      margin: EdgeInsets.zero,
      elevation: 1,
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            Icon(icon, size: 28),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    message,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 12),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _title(String type) {
    switch (type) {
      case 'note':
        return 'Notes Collection';
      case 'question_paper':
        return 'PYQ Collection';
      case 'faculty_upload':
        return 'Faculty Uploads';
      default:
        return 'Resources';
    }
  }

  String _message(String type) {
    switch (type) {
      case 'note':
        return 'Browse all note resources in one place.';
      case 'question_paper':
        return 'Browse previous year question papers.';
      case 'faculty_upload':
        return 'Browse content shared by faculty members.';
      default:
        return 'Browse resources by selected type.';
    }
  }

  IconData _icon(String type) {
    switch (type) {
      case 'note':
        return Icons.sticky_note_2_outlined;
      case 'question_paper':
        return Icons.quiz_outlined;
      case 'faculty_upload':
        return Icons.school_outlined;
      default:
        return Icons.folder_open_outlined;
    }
  }
}
