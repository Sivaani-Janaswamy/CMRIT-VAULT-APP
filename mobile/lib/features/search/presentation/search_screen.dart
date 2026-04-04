import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/ui_state_widgets.dart';
import '../../resources/presentation/widgets/resource_card_widget.dart';
import '../application/search_controller.dart';
import '../domain/search_suggestion_result.dart';

class SearchScreen extends ConsumerStatefulWidget {
  const SearchScreen({super.key});

  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends ConsumerState<SearchScreen> {
  late final TextEditingController _queryController;
  Timer? _searchDebounce;

  static const Duration _debounceDuration = Duration(milliseconds: 400);
  static const double _sectionSpacing = 12;

  String _submittedQuery = '';
  String _suggestionQuery = '';
  String? _subjectFilter;
  String? _typeFilter;

  @override
  void initState() {
    super.initState();
    _queryController = TextEditingController();
  }

  @override
  void dispose() {
    _searchDebounce?.cancel();
    _queryController.dispose();
    super.dispose();
  }

  void _submitQuery() {
    _searchDebounce?.cancel();
    final query = _queryController.text.trim();
    setState(() {
      _submittedQuery = query;
      _suggestionQuery = '';
    });
    FocusScope.of(context).unfocus();
  }

  void _onQueryChanged(String value) {
    final query = value.trim();

    _searchDebounce?.cancel();
    setState(() {
      _suggestionQuery = query;
    });

    if (query.isEmpty) {
      setState(() {
        _submittedQuery = '';
      });
      return;
    }

    _searchDebounce = Timer(_debounceDuration, () {
      if (!mounted) {
        return;
      }
      setState(() {
        _submittedQuery = query;
      });
    });
  }

  void _selectSuggestion(SearchSuggestionResult suggestion) {
    _searchDebounce?.cancel();
    _queryController.text = suggestion.title;
    setState(() {
      _submittedQuery = suggestion.title;
      _suggestionQuery = '';
    });
    FocusScope.of(context).unfocus();
  }

  @override
  Widget build(BuildContext context) {
    final resultsAsync = _submittedQuery.isEmpty
        ? null
        : ref.watch(searchResultsProvider(_submittedQuery));
    final suggestionsAsync = _suggestionQuery.isEmpty
        ? null
        : ref.watch(searchSuggestionsProvider(_suggestionQuery));

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
        title: const Text('Search'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              TextField(
                controller: _queryController,
                textInputAction: TextInputAction.search,
                onChanged: _onQueryChanged,
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
              if (suggestionsAsync != null) ...[
                const SizedBox(height: _sectionSpacing),
                suggestionsAsync.when(
                  loading: () => const LinearProgressIndicator(minHeight: 2),
                  error: (_, __) => const SizedBox.shrink(),
                  data: (items) {
                    if (items.isEmpty) {
                      return const Padding(
                        padding: EdgeInsets.symmetric(vertical: 8),
                        child: AppEmptyStateCard(
                          icon: Icons.search_off,
                          title: 'No suggestions',
                          message: 'Try a different keyword to get suggestions.',
                        ),
                      );
                    }

                    return Card(
                      margin: EdgeInsets.zero,
                      elevation: 1,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Column(
                        children: [
                          for (var i = 0; i < items.length && i < 5; i++) ...[
                            ListTile(
                              dense: true,
                              title: Text(
                                items[i].title,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              subtitle: Text(
                                items[i].subtitleLabel,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              onTap: () => _selectSuggestion(items[i]),
                            ),
                            if (i < items.length - 1 && i < 4)
                              const Divider(height: 1),
                          ],
                        ],
                      ),
                    );
                  },
                ),
              ],
              const SizedBox(height: _sectionSpacing),
              if (resultsAsync == null)
                const AppEmptyStateCard(
                  icon: Icons.search,
                  title: 'Search resources',
                  message: 'Type a query to find notes and study material.',
                )
              else
                resultsAsync.when(
                  loading: () => const SizedBox(
                    height: 160,
                    child: Center(
                      child: CircularProgressIndicator(),
                    ),
                  ),
                  error: (_, __) => const AppEmptyStateCard(
                    icon: Icons.error_outline,
                    title: 'Something went wrong',
                    message: 'Please try searching again.',
                  ),
                  data: (page) {
                    if (page.items.isEmpty) {
                      return const AppEmptyStateCard(
                        icon: Icons.inbox_outlined,
                        title: 'No resources found',
                        message: 'Try searching or explore subjects.',
                      );
                    }

                    final subjectOptions = <String>{
                      for (final item in page.items)
                        if (item.subjectName.trim().isNotEmpty) item.subjectName,
                    }.toList()
                      ..sort();
                    final typeOptions = <String>{
                      for (final item in page.items)
                        if (item.resourceType.trim().isNotEmpty) item.resourceType,
                    }.toList()
                      ..sort();

                    if (_subjectFilter != null &&
                        !subjectOptions.contains(_subjectFilter)) {
                      _subjectFilter = null;
                    }
                    if (_typeFilter != null && !typeOptions.contains(_typeFilter)) {
                      _typeFilter = null;
                    }

                    final filtered = page.items.where((item) {
                      final matchesSubject =
                          _subjectFilter == null || item.subjectName == _subjectFilter;
                      final matchesType =
                          _typeFilter == null || item.resourceType == _typeFilter;
                      return matchesSubject && matchesType;
                    }).toList();

                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const AppSectionHeader(title: 'Search Results'),
                        const SizedBox(height: 8),
                        _FilterRow(
                          subjectOptions: subjectOptions,
                          typeOptions: typeOptions,
                          selectedSubject: _subjectFilter,
                          selectedType: _typeFilter,
                          onSubjectSelected: (value) {
                            setState(() {
                              _subjectFilter = value;
                            });
                          },
                          onTypeSelected: (value) {
                            setState(() {
                              _typeFilter = value;
                            });
                          },
                        ),
                        const SizedBox(height: 12),
                        if (filtered.isEmpty)
                          const AppEmptyStateCard(
                            icon: Icons.inbox_outlined,
                            title: 'No resources found',
                            message: 'Try searching or explore subjects.',
                          )
                        else
                          GridView.builder(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            itemCount: filtered.length,
                            gridDelegate:
                                const SliverGridDelegateWithFixedCrossAxisCount(
                              crossAxisCount: 2,
                              crossAxisSpacing: 12,
                              mainAxisSpacing: 12,
                              childAspectRatio: 0.9,
                            ),
                            itemBuilder: (context, index) {
                              final resource = filtered[index];
                              return ResourceCardWidget(
                                data: ResourceCardData(
                                  resourceId: resource.resourceId,
                                  title: resource.title,
                                  subjectLabel: resource.subjectName,
                                  resourceType: resource.resourceType,
                                  downloadCount: resource.downloadCount,
                                  fileHint:
                                      '${resource.fileName} ${resource.resourceType}',
                                ),
                                onTap: () =>
                                    context.push('/resources/${resource.resourceId}'),
                              );
                            },
                          ),
                      ],
                    );
                  },
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _FilterRow extends StatelessWidget {
  const _FilterRow({
    required this.subjectOptions,
    required this.typeOptions,
    required this.selectedSubject,
    required this.selectedType,
    required this.onSubjectSelected,
    required this.onTypeSelected,
  });

  final List<String> subjectOptions;
  final List<String> typeOptions;
  final String? selectedSubject;
  final String? selectedType;
  final ValueChanged<String?> onSubjectSelected;
  final ValueChanged<String?> onTypeSelected;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          _FilterChipButton(
            label: selectedSubject == null ? 'Subject: All' : 'Subject: $selectedSubject',
            onTap: () => _showOptions(
              context,
              title: 'Subject',
              options: subjectOptions,
              selected: selectedSubject,
              onSelected: onSubjectSelected,
            ),
          ),
          const SizedBox(width: 8),
          _FilterChipButton(
            label: selectedType == null ? 'Type: All' : 'Type: $selectedType',
            onTap: () => _showOptions(
              context,
              title: 'Resource Type',
              options: typeOptions,
              selected: selectedType,
              onSelected: onTypeSelected,
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _showOptions(
    BuildContext context, {
    required String title,
    required List<String> options,
    required String? selected,
    required ValueChanged<String?> onSelected,
  }) async {
    await showModalBottomSheet<void>(
      context: context,
      builder: (context) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                title: Text(title),
              ),
              ListTile(
                leading: Icon(
                  selected == null ? Icons.radio_button_checked : Icons.radio_button_unchecked,
                ),
                title: const Text('All'),
                onTap: () {
                  onSelected(null);
                  Navigator.of(context).pop();
                },
              ),
              for (final option in options)
                ListTile(
                  leading: Icon(
                    selected == option
                        ? Icons.radio_button_checked
                        : Icons.radio_button_unchecked,
                  ),
                  title: Text(option),
                  onTap: () {
                    onSelected(option);
                    Navigator.of(context).pop();
                  },
                ),
            ],
          ),
        );
      },
    );
  }
}

class _FilterChipButton extends StatelessWidget {
  const _FilterChipButton({
    required this.label,
    required this.onTap,
  });

  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return ActionChip(
      backgroundColor: Colors.white,
      label: Text(
        label,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
      ),
      avatar: const Icon(Icons.filter_list, color: AppColors.primary),
      onPressed: onTap,
    );
  }
}
