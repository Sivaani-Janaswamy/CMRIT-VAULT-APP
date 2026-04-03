import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../application/search_controller.dart';
import '../domain/search_resource_result.dart';

class SearchScreen extends ConsumerStatefulWidget {
  const SearchScreen({super.key});

  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends ConsumerState<SearchScreen> {
  late final TextEditingController _queryController;
  String _submittedQuery = '';

  @override
  void initState() {
    super.initState();
    _queryController = TextEditingController();
  }

  @override
  void dispose() {
    _queryController.dispose();
    super.dispose();
  }

  void _submitQuery() {
    final query = _queryController.text.trim();
    setState(() {
      _submittedQuery = query;
    });
    FocusScope.of(context).unfocus();
  }

  @override
  Widget build(BuildContext context) {
    final resultsAsync = _submittedQuery.isEmpty
        ? null
        : ref.watch(searchResultsProvider(_submittedQuery));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Search'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            TextField(
              controller: _queryController,
              textInputAction: TextInputAction.search,
              onSubmitted: (_) => _submitQuery(),
              decoration: InputDecoration(
                hintText: 'Search notes, papers, and uploads',
                border: const OutlineInputBorder(),
                suffixIcon: IconButton(
                  onPressed: _submitQuery,
                  icon: const Icon(Icons.search),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Expanded(
              child: resultsAsync == null
                  ? const Center(
                      child: Text('No data available'),
                    )
                  : resultsAsync.when(
                      loading: () =>
                          const Center(child: CircularProgressIndicator()),
                      error: (_, __) => const Center(
                        child: Text('Something went wrong'),
                      ),
                      data: (page) {
                        if (page.items.isEmpty) {
                          return const Center(child: Text('No data available'));
                        }

                        return ListView.separated(
                          itemCount: page.items.length,
                          separatorBuilder: (context, index) =>
                              const SizedBox(height: 8),
                          itemBuilder: (context, index) {
                            final resource = page.items[index];
                            return _SearchResultCard(
                              resource: resource,
                              onTap: () => context.push(
                                '/resources/${resource.resourceId}',
                              ),
                            );
                          },
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SearchResultCard extends StatelessWidget {
  const _SearchResultCard({
    required this.resource,
    required this.onTap,
  });

  final SearchResourceResult resource;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        onTap: onTap,
        leading: const Icon(
          Icons.search,
          color: AppColors.primary,
        ),
        title: Text(resource.title),
        subtitle: Text(resource.subtitleLabel),
        trailing: const Icon(Icons.arrow_forward_ios, size: 16),
      ),
    );
  }
}
