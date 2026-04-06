import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/ui_state_widgets.dart';
import '../application/subjects_controller.dart';
import '../domain/subject.dart';

class SubjectListScreen extends ConsumerStatefulWidget {
  const SubjectListScreen({super.key});

  @override
  ConsumerState<SubjectListScreen> createState() => _SubjectListScreenState();
}

class _SubjectListScreenState extends ConsumerState<SubjectListScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final subjectsAsync = ref.watch(subjectsListProvider);

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
        title: const Text('Subjects'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: subjectsAsync.when(
          loading: () => const AppLoadingStateCard(label: 'Loading subjects...'),
          error: (_, __) => const AppEmptyStateCard(
            icon: Icons.error_outline,
            title: 'Unable to load subjects',
            message: 'Please try again in a moment.',
          ),
          data: (page) {
            if (page.items.isEmpty) {
              return const AppEmptyStateCard(
                icon: Icons.menu_book_outlined,
                title: 'No subjects found',
                message: 'Try again after new subjects are published.',
              );
            }

            final query = _searchQuery.trim().toLowerCase();
            final filteredSubjects = query.isEmpty
                ? page.items
                : page.items
                    .where(
                      (subject) =>
                          subject.name.toLowerCase().contains(query) ||
                          subject.code.toLowerCase().contains(query),
                    )
                    .toList(growable: false);

            return Column(
              children: [
                TextField(
                  controller: _searchController,
                  onChanged: (value) {
                    setState(() {
                      _searchQuery = value;
                    });
                  },
                  textInputAction: TextInputAction.search,
                  decoration: InputDecoration(
                    hintText: 'Search by subject name or code',
                    hintStyle: const TextStyle(color: AppColors.text),
                    filled: true,
                    fillColor: Colors.white,
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 14,
                    ),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: BorderSide.none,
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: BorderSide.none,
                    ),
                    prefixIcon: const Icon(Icons.search, color: AppColors.text),
                    suffixIcon: const Icon(Icons.tune, color: AppColors.text),
                  ),
                ),
                const SizedBox(height: 12),
                Expanded(
                  child: filteredSubjects.isEmpty
                      ? const AppEmptyStateCard(
                          icon: Icons.search_off,
                          title: 'No matching subjects',
                          message: 'Try a different name or code.',
                        )
                      : ListView.separated(
                          itemCount: filteredSubjects.length,
                          separatorBuilder: (context, index) =>
                              const SizedBox(height: 8),
                          itemBuilder: (context, index) {
                            final subject = filteredSubjects[index];
                            return _SubjectCard(
                              subject: subject,
                              onTap: () => context.push(
                                '/subjects/${subject.id}',
                                extra: subject,
                              ),
                            );
                          },
                        ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}

class _SubjectCard extends StatelessWidget {
  const _SubjectCard({
    required this.subject,
    required this.onTap,
  });

  final Subject subject;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: EdgeInsets.zero,
      elevation: 1,
      child: ListTile(
        onTap: onTap,
        leading: const Icon(
          Icons.menu_book,
          color: AppColors.primary,
        ),
        title: Text(subject.name),
        subtitle: Text(subject.code),
        trailing: const Icon(Icons.arrow_forward_ios, size: 16),
      ),
    );
  }
}
