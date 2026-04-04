import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../subjects/domain/resource_item.dart';
import '../presentation/widgets/resource_card_widget.dart';

final recentlyViewedProvider =
    StateNotifierProvider<RecentlyViewedNotifier, List<ResourceCardData>>(
  (ref) => RecentlyViewedNotifier(),
);

class RecentlyViewedNotifier extends StateNotifier<List<ResourceCardData>> {
  RecentlyViewedNotifier() : super(const []) {
    _loadPersisted();
  }

  static const int _maxItems = 10;
  static const String _storageKey = 'recently_viewed';

  final Future<SharedPreferences> _prefsFuture = SharedPreferences.getInstance();

  void trackFromResource(ResourceItem resource) {
    final item = ResourceCardData(
      resourceId: resource.id,
      title: resource.title,
      subjectLabel: resource.subjectId.isEmpty ? 'Subject unavailable' : resource.subjectId,
      resourceType: resource.resourceType,
      downloadCount: resource.downloadCount,
      fileHint: resource.mimeType,
    );

    final next = [
      item,
      ...state.where((existing) => existing.resourceId != item.resourceId),
    ];

    state = next.take(_maxItems).toList(growable: false);
    _persist();
  }

  void clear() {
    state = const [];
    _clearPersisted();
  }

  Future<void> _loadPersisted() async {
    try {
      final prefs = await _prefsFuture;
      final raw = prefs.getString(_storageKey);
      if (raw == null || raw.isEmpty) {
        return;
      }

      final decoded = jsonDecode(raw);
      if (decoded is! List) {
        await prefs.remove(_storageKey);
        return;
      }

      final loaded = <ResourceCardData>[];
      for (final entry in decoded) {
        if (entry is! Map) {
          continue;
        }

        final map = Map<String, dynamic>.from(entry);
        final resourceId = (map['resourceId'] as String? ?? '').trim();
        final title = (map['title'] as String? ?? '').trim();
        final subjectId = (map['subjectId'] as String? ?? '').trim();
        if (resourceId.isEmpty || title.isEmpty) {
          continue;
        }

        loaded.add(
          ResourceCardData(
            resourceId: resourceId,
            title: title,
            subjectLabel: subjectId.isEmpty ? 'Subject unavailable' : subjectId,
            resourceType: (map['resourceType'] as String? ?? 'note'),
            downloadCount: _readInt(map['downloadCount']),
            fileHint: (map['fileHint'] as String? ?? ''),
          ),
        );
      }

      final deduped = <ResourceCardData>[];
      final seen = <String>{};
      for (final item in loaded) {
        if (seen.add(item.resourceId)) {
          deduped.add(item);
        }
        if (deduped.length >= _maxItems) {
          break;
        }
      }

      state = deduped;
      await _persist();
    } catch (_) {
      try {
        final prefs = await _prefsFuture;
        await prefs.remove(_storageKey);
      } catch (_) {
        // Ignore persistence cleanup failures.
      }
    }
  }

  Future<void> _persist() async {
    try {
      final prefs = await _prefsFuture;
      final payload = state
          .take(_maxItems)
          .map(
            (item) => <String, dynamic>{
              'resourceId': item.resourceId,
              'title': item.title,
              'subjectId': item.subjectLabel,
              'resourceType': item.resourceType,
              'downloadCount': item.downloadCount,
              'fileHint': item.fileHint,
            },
          )
          .toList(growable: false);
      await prefs.setString(_storageKey, jsonEncode(payload));
    } catch (_) {
      // Ignore persistence failures to keep UI flow non-blocking.
    }
  }

  Future<void> _clearPersisted() async {
    try {
      final prefs = await _prefsFuture;
      await prefs.remove(_storageKey);
    } catch (_) {
      // Ignore persistence failures to keep UI flow non-blocking.
    }
  }

  int _readInt(dynamic value) {
    if (value is num) {
      return value.toInt();
    }
    return int.tryParse(value?.toString() ?? '') ?? 0;
  }
}
