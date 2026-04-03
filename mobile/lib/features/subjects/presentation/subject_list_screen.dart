import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../application/subjects_controller.dart';
import '../domain/subject.dart';

class SubjectListScreen extends ConsumerWidget {
  const SubjectListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final subjectsAsync = ref.watch(subjectsListProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Subjects'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: subjectsAsync.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (_, __) => const Center(
            child: Text('Something went wrong'),
          ),
          data: (page) {
            if (page.items.isEmpty) {
              return const Center(child: Text('No data available'));
            }

            return ListView.separated(
              itemCount: page.items.length,
              separatorBuilder: (context, index) => const SizedBox(height: 8),
              itemBuilder: (context, index) {
                final subject = page.items[index];
                return _SubjectCard(
                  subject: subject,
                  onTap: () => context.push(
                    '/subjects/${subject.id}',
                    extra: subject,
                  ),
                );
              },
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
