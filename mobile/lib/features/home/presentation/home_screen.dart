import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'dart:async';

import '../../auth/application/auth_controller.dart';
import '../../auth/domain/auth_state.dart';
import '../../resources/application/recently_viewed_provider.dart';
import '../../resources/presentation/widgets/resource_card_widget.dart';
import '../../subjects/application/subjects_controller.dart';
import '../../subjects/domain/paginated_result.dart';
import '../../subjects/domain/resource_item.dart';
import '../../../core/widgets/ui_state_widgets.dart';
import '../../../core/theme/app_colors.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  static const double _horizontalPadding = 16;
  static const double _sectionSpacing = 16;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authControllerProvider);
    final user = authState.user;
    final recentlyViewed = ref.watch(recentlyViewedProvider);
    final subjectsAsync = ref.watch(subjectsListProvider);
    final subjects = subjectsAsync.valueOrNull?.items ?? const [];
    final subjectNameById = {
      for (final subject in subjects)
        subject.id: subject.name,
    };
    final selectedSubjectId = subjects.isNotEmpty ? subjects.first.id : null;
    final selectedSubjectResourcesAsync = selectedSubjectId == null
        ? null
        : ref.watch(subjectResourcesProvider(selectedSubjectId));

    if (authState.status == AuthStatus.bootstrapping ||
        authState.status == AuthStatus.signingIn ||
        authState.status == AuthStatus.signingUp) {
      return const Scaffold(
        body: SafeArea(
          child: Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                CircularProgressIndicator(),
                SizedBox(height: 12),
                Text('Loading your account...'),
              ],
            ),
          ),
        ),
      );
    }

    final canShowAvatar =
        authState.status == AuthStatus.authenticated && user != null;

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.all(_horizontalPadding),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _HomeTopHeader(
                  showAvatar: canShowAvatar,
                  name: user?.fullName,
                  role: user?.role,
                  onMenuSelected: (action) =>
                      _handleHeaderAction(context, ref, action),
                ),
                const SizedBox(height: _sectionSpacing),
                _HomeSearchBar(
                  onTap: () => context.go('/search'),
                ),
                const SizedBox(height: _sectionSpacing),
                const _HomeHeroBanner(),
                const SizedBox(height: _sectionSpacing),
                QuickActionsWidget(
                  actions: _buildQuickActions(context),
                ),
                const SizedBox(height: _sectionSpacing),
                ContinueStudyingSection(
                  item: recentlyViewed.isEmpty ? null : recentlyViewed.first,
                ),
                const SizedBox(height: _sectionSpacing),
                RecentlyViewedSection(items: recentlyViewed),
                const SizedBox(height: _sectionSpacing),
                subjectsAsync.when(
                  loading: () => CategoryGridWidget(
                    title: 'Subjects',
                    isLoading: true,
                    actionLabel: 'See all',
                    onAction: () => context.go('/subjects'),
                  ),
                  error: (_, __) => CategoryGridWidget(
                    title: 'Subjects',
                    emptyStateMessage: 'Unable to load subjects right now.',
                    actionLabel: 'See all',
                    onAction: () => context.go('/subjects'),
                  ),
                  data: (page) {
                    final items = page.items
                        .take(10)
                        .map(
                          (subject) => CategoryGridItem(
                            title: subject.name,
                            subtitle: subject.code,
                            icon: Icons.menu_book_outlined,
                            onTap: () => context.push(
                              '/subjects/${subject.id}',
                              extra: subject,
                            ),
                          ),
                        )
                        .toList();

                    return CategoryGridWidget(
                      title: 'Subjects',
                      items: items,
                      actionLabel: 'See all',
                      onAction: () => context.go('/subjects'),
                      emptyStateMessage: 'No subjects available yet.',
                    );
                  },
                ),
                const SizedBox(height: _sectionSpacing),
                CategoryGridWidget(
                  title: 'Resource Types',
                  items: [
                    CategoryGridItem(
                      title: 'Notes',
                      subtitle: 'All note resources',
                      icon: Icons.sticky_note_2_outlined,
                      onTap: () => context.push('/resources/type/note'),
                    ),
                    CategoryGridItem(
                      title: 'PYQs',
                      subtitle: 'Previous year papers',
                      icon: Icons.quiz_outlined,
                      onTap: () => context.push('/resources/type/question_paper'),
                    ),
                    CategoryGridItem(
                      title: 'Other materials',
                      subtitle: 'Faculty shared resources',
                      icon: Icons.school_outlined,
                      onTap: () => context.push('/resources/type/faculty_upload'),
                    ),
                  ],
                ),
                const SizedBox(height: _sectionSpacing),
                ResourceGridSection(
                  title: 'Recently Uploaded',
                  resourcesAsync: selectedSubjectResourcesAsync,
                  hasSubjects: subjects.isNotEmpty,
                  subjectNameById: subjectNameById,
                  sortMode: ResourceSectionSort.recent,
                  actionLabel: selectedSubjectId == null ? null : 'See all',
                  onAction: selectedSubjectId == null
                      ? null
                      : () => context.push('/subjects/$selectedSubjectId'),
                ),
                const SizedBox(height: _sectionSpacing),
                ResourceGridSection(
                  title: 'Top Downloads',
                  resourcesAsync: selectedSubjectResourcesAsync,
                  hasSubjects: subjects.isNotEmpty,
                  subjectNameById: subjectNameById,
                  sortMode: ResourceSectionSort.topDownloads,
                  actionLabel: selectedSubjectId == null ? null : 'See all',
                  onAction: selectedSubjectId == null
                      ? null
                      : () => context.push('/subjects/$selectedSubjectId'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _handleHeaderAction(
    BuildContext context,
    WidgetRef ref,
    _HomeHeaderMenuAction action,
  ) {
    switch (action) {
      case _HomeHeaderMenuAction.profile:
        context.push('/profile/edit');
      case _HomeHeaderMenuAction.signOut:
        ref.read(authControllerProvider.notifier).signOut();
      case _HomeHeaderMenuAction.subjects:
        context.go('/subjects');
      case _HomeHeaderMenuAction.downloads:
        context.go('/downloads');
      case _HomeHeaderMenuAction.admin:
        context.go('/admin');
      case _HomeHeaderMenuAction.faculty:
        context.go('/faculty');
    }
  }

  List<QuickActionItem> _buildQuickActions(BuildContext context) {
    return [
      QuickActionItem(
        label: 'Notes',
        icon: Icons.sticky_note_2_outlined,
        onTap: () => context.push('/resources/type/note'),
      ),
      QuickActionItem(
        label: 'PYQs',
        icon: Icons.quiz_outlined,
        onTap: () => context.push('/resources/type/question_paper'),
      ),
      QuickActionItem(
        label: 'Subjects',
        icon: Icons.menu_book_outlined,
        onTap: () => context.go('/subjects'),
      ),
      QuickActionItem(
        label: 'Downloads',
        icon: Icons.download_outlined,
        onTap: () => context.go('/downloads'),
      ),
      const QuickActionItem(
        label: 'Favorites',
        icon: Icons.favorite_border,
      ),
      const QuickActionItem(
        label: 'Trending',
        icon: Icons.trending_up,
      ),
    ];
  }
}

enum _HomeHeaderMenuAction {
  profile,
  signOut,
  subjects,
  downloads,
  admin,
  faculty,
}

class _HomeTopHeader extends StatelessWidget {
  const _HomeTopHeader({
    required this.showAvatar,
    required this.name,
    required this.role,
    required this.onMenuSelected,
  });

  final bool showAvatar;
  final String? name;
  final String? role;
  final ValueChanged<_HomeHeaderMenuAction> onMenuSelected;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        const Expanded(
          child: Text(
            'CMRIT Vault',
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.w700,
              color: AppColors.text,
            ),
          ),
        ),
        const SizedBox(width: 12),
        if (showAvatar)
          PopupMenuButton<_HomeHeaderMenuAction>(
            tooltip: 'Account',
            onSelected: onMenuSelected,
            itemBuilder: (context) {
              final canAccessAdmin = role == 'admin';
              final canAccessFaculty = role == 'faculty' || role == 'admin';
              final items = <PopupMenuEntry<_HomeHeaderMenuAction>>[
                const PopupMenuItem<_HomeHeaderMenuAction>(
                  value: _HomeHeaderMenuAction.profile,
                  child: Text('Edit Profile'),
                ),
                const PopupMenuItem<_HomeHeaderMenuAction>(
                  value: _HomeHeaderMenuAction.subjects,
                  child: Text('Browse Subjects'),
                ),
                const PopupMenuItem<_HomeHeaderMenuAction>(
                  value: _HomeHeaderMenuAction.downloads,
                  child: Text('Downloads History'),
                ),
              ];
              if (canAccessAdmin) {
                items.add(
                  const PopupMenuItem<_HomeHeaderMenuAction>(
                    value: _HomeHeaderMenuAction.admin,
                    child: Text('Admin Panel'),
                  ),
                );
              }
              if (canAccessFaculty) {
                items.add(
                  const PopupMenuItem<_HomeHeaderMenuAction>(
                    value: _HomeHeaderMenuAction.faculty,
                    child: Text('Faculty Panel'),
                  ),
                );
              }
              items.add(const PopupMenuDivider());
              items.add(
                const PopupMenuItem<_HomeHeaderMenuAction>(
                  value: _HomeHeaderMenuAction.signOut,
                  child: Text('Sign Out'),
                ),
              );
              return items;
            },
            child: CircleAvatar(
              radius: 18,
              backgroundColor: AppColors.primary,
              foregroundColor: AppColors.text,
              child: Text(
                _avatarInitial(name),
                style: const TextStyle(fontWeight: FontWeight.w700),
              ),
            ),
          )
        else
          TextButton(
            onPressed: () => context.go('/login'),
            child: const Text('Sign Up / Sign In'),
          ),
      ],
    );
  }

  static String _avatarInitial(String? name) {
    final trimmed = name?.trim() ?? '';
    if (trimmed.isEmpty) {
      return 'U';
    }
    return trimmed[0].toUpperCase();
  }
}

class _HomeSearchBar extends StatelessWidget {
  const _HomeSearchBar({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
          child: Row(
            children: const [
              Icon(Icons.search, color: AppColors.text),
              SizedBox(width: 10),
              Expanded(
                child: Text(
                  'Search notes, PYQs, subjects...',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              SizedBox(width: 8),
              Icon(Icons.tune, color: AppColors.text),
            ],
          ),
        ),
      ),
    );
  }
}

class _HomeHeroBanner extends StatefulWidget {
  const _HomeHeroBanner();

  @override
  State<_HomeHeroBanner> createState() => _HomeHeroBannerState();
}

class _HomeHeroBannerState extends State<_HomeHeroBanner> {
  static const _banners = [
    'assets/banner1.png',
    'assets/banner2.png',
    'assets/banner3.png',
  ];

  final PageController _pageController = PageController();
  Timer? _timer;
  int _currentIndex = 0;

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(seconds: 4), (_) {
      if (!mounted) {
        return;
      }
      final nextIndex = (_currentIndex + 1) % _banners.length;
      _pageController.animateToPage(
        nextIndex,
        duration: const Duration(milliseconds: 350),
        curve: Curves.easeInOut,
      );
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final screenHeight = MediaQuery.sizeOf(context).height;

    return ConstrainedBox(
      constraints: BoxConstraints(
        maxHeight: screenHeight * 0.3,
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(18),
        child: AspectRatio(
          aspectRatio: 16 / 9,
          child: Stack(
            children: [
              PageView.builder(
                controller: _pageController,
                itemCount: _banners.length,
                onPageChanged: (index) {
                  setState(() {
                    _currentIndex = index;
                  });
                },
                itemBuilder: (context, index) {
                  return Image.asset(
                    _banners[index],
                    fit: BoxFit.cover,
                  );
                },
              ),
              Positioned(
                right: 10,
                bottom: 10,
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    color: Colors.black45,
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    child: Text(
                      '${_currentIndex + 1}/${_banners.length}',
                      style: const TextStyle(color: Colors.white, fontSize: 11),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class QuickActionItem {
  const QuickActionItem({
    required this.label,
    required this.icon,
    this.onTap,
  });

  final String label;
  final IconData icon;
  final VoidCallback? onTap;
}

class QuickActionsWidget extends StatelessWidget {
  const QuickActionsWidget({
    super.key,
    required this.actions,
  });

  final List<QuickActionItem> actions;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const AppSectionHeader(title: 'Quick Actions'),
        const SizedBox(height: 12),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: [
              for (var index = 0; index < actions.length; index++) ...[
                _QuickActionCard(item: actions[index]),
                if (index < actions.length - 1) const SizedBox(width: 12),
              ],
            ],
          ),
        ),
      ],
    );
  }
}

class _QuickActionCard extends StatelessWidget {
  const _QuickActionCard({required this.item});

  final QuickActionItem item;

  @override
  Widget build(BuildContext context) {
    final enabled = item.onTap != null;

    return Opacity(
      opacity: enabled ? 1 : 0.55,
      child: Material(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          onTap: item.onTap,
          child: SizedBox(
            width: 92,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(item.icon, color: AppColors.primary),
                  const SizedBox(height: 8),
                  Text(
                    item.label,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class CategoryGridItem {
  const CategoryGridItem({
    required this.title,
    required this.icon,
    this.subtitle,
    this.onTap,
  });

  final String title;
  final String? subtitle;
  final IconData icon;
  final VoidCallback? onTap;
}

class CategoryGridWidget extends StatelessWidget {
  const CategoryGridWidget({
    super.key,
    required this.title,
    this.items = const [],
    this.emptyStateMessage = 'No data available',
    this.isLoading = false,
    this.actionLabel,
    this.onAction,
  });

  final String title;
  final List<CategoryGridItem> items;
  final String emptyStateMessage;
  final bool isLoading;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    final width = MediaQuery.sizeOf(context).width;
    final crossAxisCount = (width / 160).floor().clamp(2, 4);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        AppSectionHeader(
          title: title,
          actionLabel: actionLabel,
          onAction: onAction,
        ),
        const SizedBox(height: 12),
        if (isLoading)
          const _CategoryGridStatusCard(
            child: SizedBox(
              height: 32,
              width: 32,
              child: CircularProgressIndicator(strokeWidth: 2.5),
            ),
          )
        else if (items.isEmpty)
          _CategoryGridStatusCard(
            child: Text(
              emptyStateMessage,
              textAlign: TextAlign.center,
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(color: AppColors.text),
            ),
          )
        else
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: items.length,
            gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: crossAxisCount,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: 1.4,
            ),
            itemBuilder: (context, index) {
              final item = items[index];
              return Material(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
                child: InkWell(
                  borderRadius: BorderRadius.circular(14),
                  onTap: item.onTap,
                  child: Padding(
                    padding: const EdgeInsets.all(10),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(item.icon, color: AppColors.primary),
                        const SizedBox(height: 8),
                        Expanded(
                          child: Text(
                            item.title,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(fontWeight: FontWeight.w600),
                          ),
                        ),
                        if (item.subtitle != null && item.subtitle!.isNotEmpty)
                          Text(
                            item.subtitle!,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(fontSize: 12),
                          ),
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
      ],
    );
  }
}

class _CategoryGridStatusCard extends StatelessWidget {
  const _CategoryGridStatusCard({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: EdgeInsets.zero,
      elevation: 1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      child: SizedBox(
        width: double.infinity,
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Center(child: child),
        ),
      ),
    );
  }
}

class ResourceGridSection extends StatelessWidget {
  const ResourceGridSection({
    super.key,
    required this.title,
    required this.resourcesAsync,
    required this.hasSubjects,
    required this.subjectNameById,
    required this.sortMode,
    this.actionLabel,
    this.onAction,
  });

  final String title;
  final AsyncValue<PaginatedResult<ResourceItem>>? resourcesAsync;
  final bool hasSubjects;
  final Map<String, String> subjectNameById;
  final ResourceSectionSort sortMode;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    final asyncResources = resourcesAsync;
    final width = MediaQuery.sizeOf(context).width;
    final crossAxisCount = width < 380 ? 1 : 2;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        AppSectionHeader(
          title: title,
          actionLabel: actionLabel,
          onAction: onAction,
        ),
        const SizedBox(height: 12),
        if (!hasSubjects)
          const AppEmptyStateCard(
            icon: Icons.folder_open_outlined,
            title: 'No resources found',
            message: 'Try searching or explore subjects.',
          )
        else if (asyncResources == null || asyncResources.isLoading)
          const SizedBox(
            height: 160,
            child: Center(
              child: CircularProgressIndicator(),
            ),
          )
        else if (asyncResources.hasError)
          const AppEmptyStateCard(
            icon: Icons.error_outline,
            title: 'Unable to load resources',
            message: 'Please try again in a moment.',
          )
        else
          Builder(
            builder: (context) {
              final resources = asyncResources.valueOrNull?.items ?? const <ResourceItem>[];
              final items = _sortedItems(resources);
              if (items.isEmpty) {
                return const AppEmptyStateCard(
                  icon: Icons.folder_open_outlined,
                  title: 'No resources found',
                  message: 'Try searching or explore subjects.',
                );
              }

              return GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: items.length,
                gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: crossAxisCount,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                  childAspectRatio: width < 380 ? 2.1 : 0.9,
                ),
                itemBuilder: (context, index) {
                  final resource = items[index];
                  return ResourceCardWidget(
                    data: ResourceCardData(
                      resourceId: resource.id,
                      title: resource.title,
                      subjectLabel: subjectNameById[resource.subjectId] ??
                          'Unknown subject',
                      resourceType: resource.resourceType,
                      downloadCount: resource.downloadCount,
                      fileHint: resource.mimeType,
                    ),
                    onTap: () => context.push('/resources/${resource.id}'),
                  );
                },
              );
            },
          ),
      ],
    );
  }

  List<ResourceItem> _sortedItems(List<ResourceItem> input) {
    final items = [...input];
    switch (sortMode) {
      case ResourceSectionSort.recent:
        items.sort((a, b) {
          final aDate = a.createdAt;
          final bDate = b.createdAt;
          if (aDate == null && bDate == null) {
            return b.id.compareTo(a.id);
          }
          if (aDate == null) {
            return 1;
          }
          if (bDate == null) {
            return -1;
          }
          return bDate.compareTo(aDate);
        });
      case ResourceSectionSort.topDownloads:
        items.sort((a, b) {
          final byDownloads = b.downloadCount.compareTo(a.downloadCount);
          if (byDownloads != 0) {
            return byDownloads;
          }

          final aDate = a.createdAt;
          final bDate = b.createdAt;
          if (aDate == null && bDate == null) {
            return b.id.compareTo(a.id);
          }
          if (aDate == null) {
            return 1;
          }
          if (bDate == null) {
            return -1;
          }
          return bDate.compareTo(aDate);
        });
    }
    return items;
  }
}

enum ResourceSectionSort {
  recent,
  topDownloads,
}

class ContinueStudyingSection extends StatelessWidget {
  const ContinueStudyingSection({
    super.key,
    required this.item,
  });

  final ResourceCardData? item;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const AppSectionHeader(
          title: 'Continue Studying',
        ),
        const SizedBox(height: 12),
        if (item == null)
          const AppEmptyStateCard(
            icon: Icons.school_outlined,
            title: 'Start exploring resources',
            message: 'Open a resource to continue learning here.',
          )
        else
          ResourceCardWidget(
            data: item!,
            onTap: () => context.push('/resources/${item!.resourceId}'),
          ),
      ],
    );
  }
}

class RecentlyViewedSection extends ConsumerWidget {
  const RecentlyViewedSection({
    super.key,
    required this.items,
  });

  final List<ResourceCardData> items;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
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

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        AppSectionHeader(
          title: 'Recently Viewed',
          actionLabel: items.isEmpty ? null : 'See all',
          onAction: items.isEmpty
              ? null
            : () => context.push('/recently-viewed'),
          secondaryActionIcon: items.isEmpty ? null : Icons.delete_outline,
          onSecondaryAction: items.isEmpty
            ? null
              : () async {
                  final shouldClear = await showDialog<bool>(
                    context: context,
                    builder: (dialogContext) {
                      return AlertDialog(
                        title: const Text('Clear history?'),
                        content: const Text('This will remove all recently viewed resources.'),
                        actions: [
                          TextButton(
                            onPressed: () => Navigator.of(dialogContext).pop(false),
                            child: const Text('Cancel'),
                          ),
                          TextButton(
                            onPressed: () => Navigator.of(dialogContext).pop(true),
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
            title: 'Start exploring resources',
            message: 'Viewed resources will appear here.',
          )
        else
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                for (var i = 0; i < resolvedItems.length; i++) ...[
                  SizedBox(
                    width: 220,
                    child: ResourceCardWidget(
                      data: resolvedItems[i],
                      compact: true,
                      onTap: () => context.push('/resources/${resolvedItems[i].resourceId}'),
                    ),
                  ),
                  if (i < resolvedItems.length - 1) const SizedBox(width: 12),
                ],
              ],
            ),
          ),
      ],
    );
  }
}

