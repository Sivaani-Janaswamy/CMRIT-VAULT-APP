# MOBILE

This document is the operational and maintenance guide for the Flutter mobile app.

## 1. Scope

Mobile app path:
- `mobile/`

Primary goals:
- Stable student browsing experience
- Faculty resource lifecycle management
- Admin moderation and analytics surfaces
- Consistent UI behavior aligned with `UI_DESIGN.md`

## 2. Prerequisites

Required tools:
- Flutter SDK (stable channel)
- Dart SDK (bundled with Flutter)
- Android Studio or VS Code with Flutter/Dart extensions
- Android SDK / emulator (and Xcode for iOS on macOS)

Verify setup:

```bash
flutter doctor
```

## 3. Install and Run

From repository root:

```bash
cd mobile
flutter pub get
flutter analyze
flutter test
flutter run
```

## 4. Build Commands

Android APK:

```bash
flutter build apk --release
```

Android App Bundle:

```bash
flutter build appbundle --release
```

iOS (macOS only):

```bash
flutter build ios --release
```

## 5. Quality Gates

Minimum gate before merge:
- `flutter analyze` passes
- `flutter test` passes
- Manual smoke test of auth, subject browse, resource detail, and download flow

Recommended gate for larger changes:
- Test on at least one small-screen Android device/emulator
- Validate loading/empty/error states for touched screens
- Validate text overflow for all newly added labels and cards

## 6. Feature Structure

App follows feature-first organization under `mobile/lib/features/`.

Common pattern inside each feature:
- `application/` Riverpod providers/controllers
- `data/` repositories, API adapters, DTO mapping
- `domain/` entities/value models
- `presentation/` screens/widgets

Core shared layers:
- `mobile/lib/app/` bootstrapping/router/theme
- `mobile/lib/core/` config/services/theme/widgets/utils

## 7. State and Navigation Standards

State management:
- Riverpod providers/notifiers only
- Keep UI state local only for view-only concerns (e.g., expanded/collapsed flags)

Navigation:
- `go_router` routes defined in `mobile/lib/app/router/app_router.dart`
- Route guards must remain role-aware and test-covered

## 8. UI Standards (Required)

Follow `UI_DESIGN.md` strictly for:
- Spacing rhythm
- Rounded cards
- Typography hierarchy
- Overflow safety
- SafeArea usage

Mandatory UI rules for new widgets/screens:
- Use `SafeArea` for scaffold bodies
- Use `maxLines` + `TextOverflow.ellipsis` for potentially long labels
- Reuse shared UI components first:
  - `AppSectionHeader`
  - `AppLoadingStateCard`
  - `AppEmptyStateCard`
  - `ResourceCardWidget`
- Keep horizontal and vertical spacing consistent with existing screens

## 9. API Integration Rules

- All backend access must flow through `BackendApiService` and feature repositories
- Do not call HTTP directly from widgets
- Keep response parsing in repository layer
- Keep role/permission decisions in backend and route guards

## 10. Testing Guide

Test locations:
- `mobile/test/features/**`
- `mobile/test/widget_test.dart`

When updating UI labels/layout:
- Prefer widget-type targeted finders in tests (`widgetWithText`) over generic text-only counts where duplicate headings can exist

When adding new routes/role behavior:
- Add/extend route guard tests

When adding forms:
- Add at least one rendering test and one validation/action test

## 11. How to Add a New Home Section (Future Playbook)

1. Add data source in feature `application/` provider or repository.
2. Reuse `ResourceCardWidget`/shared cards for rendering.
3. Add section title with `AppSectionHeader`.
4. Handle all three states:
   - loading
   - empty
   - error
5. Add overflow-safe text for all labels.
6. Add/adjust widget tests.
7. Run `flutter analyze` and `flutter test`.

## 12. How to Add a New Screen (Future Playbook)

1. Create screen in corresponding feature `presentation/`.
2. Register route in `app_router.dart`.
3. Add role guard if role-restricted.
4. Add provider/repository wiring if API-backed.
5. Ensure UI states and overflow behavior are covered.
6. Add at least one widget test.
7. Validate with analyze/tests/manual smoke.

## 13. Known Current Constraints

- Home `Top Downloads` is currently derived from fetched in-memory items on the client.
- For global and fully accurate top-download ranking, backend-supported sorting/querying should be used.

## 14. Release Smoke Checklist

- Login and signup work
- Home loads without overflow on small screen
- Subject list and subject detail load
- Resource detail opens and download action works
- Search suggestions and results work
- Faculty routes/actions work for faculty role
- Admin routes/actions work for admin role
- Unauthorized role access is blocked correctly

## 15. Maintenance Ownership Notes

When touching shared components (`core/widgets`, router, auth bootstrap):
- Run full test suite, not only targeted tests
- Check downstream screens for visual and behavioral regressions
- Update this document if standards or playbooks change
