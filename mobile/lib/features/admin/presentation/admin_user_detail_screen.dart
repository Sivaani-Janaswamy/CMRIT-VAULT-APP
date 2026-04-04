import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/application/auth_controller.dart';
import '../application/admin_controller.dart';
import '../domain/admin_user_item.dart';
import 'admin_access_denied_view.dart';

class AdminUserDetailScreen extends ConsumerWidget {
  const AdminUserDetailScreen({
    super.key,
    required this.userId,
  });

  final String userId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authControllerProvider);
    if (authState.user?.role != 'admin') {
      return const AdminAccessDeniedView();
    }

    final userAsync = ref.watch(adminUserDetailProvider(userId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('User Detail'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: userAsync.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, _) => Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text('Failed to load user detail'),
                const SizedBox(height: 8),
                Text(error.toString(), textAlign: TextAlign.center),
                const SizedBox(height: 12),
                FilledButton(
                  onPressed: () => ref.invalidate(adminUserDetailProvider(userId)),
                  child: const Text('Retry'),
                ),
              ],
            ),
          ),
          data: (user) => _DetailContent(
            user: user,
            onUpdateRole: (role) => _updateRole(context, ref, user, role),
            onToggleStatus: (isActive) =>
                _updateStatus(context, ref, user, isActive),
          ),
        ),
      ),
    );
  }

  Future<void> _updateRole(
    BuildContext context,
    WidgetRef ref,
    AdminUserItem user,
    String role,
  ) async {
    await ref.read(adminUserManagementControllerProvider.notifier).updateUserRole(
          userId: user.id,
          role: role,
        );

    final state = ref.read(adminUserManagementControllerProvider);
    if (!context.mounted) {
      return;
    }

    if (state.hasError) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Role update failed: ${state.error}')),
      );
      return;
    }

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Role updated to $role')),
    );
    ref.invalidate(adminUserDetailProvider(userId));
  }

  Future<void> _updateStatus(
    BuildContext context,
    WidgetRef ref,
    AdminUserItem user,
    bool isActive,
  ) async {
    await ref
        .read(adminUserManagementControllerProvider.notifier)
        .updateUserStatus(
          userId: user.id,
          isActive: isActive,
        );

    final state = ref.read(adminUserManagementControllerProvider);
    if (!context.mounted) {
      return;
    }

    if (state.hasError) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Status update failed: ${state.error}')),
      );
      return;
    }

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          isActive ? 'User enabled successfully' : 'User disabled successfully',
        ),
      ),
    );
    ref.invalidate(adminUserDetailProvider(userId));
  }
}

class _DetailContent extends StatelessWidget {
  const _DetailContent({
    required this.user,
    required this.onUpdateRole,
    required this.onToggleStatus,
  });

  final AdminUserItem user;
  final ValueChanged<String> onUpdateRole;
  final ValueChanged<bool> onToggleStatus;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    user.fullName,
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 6),
                  Text('Email: ${user.email}'),
                  Text('Role: ${user.role}'),
                  Text('Status: ${user.isActive ? 'active' : 'inactive'}'),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            initialValue: user.role,
            decoration: const InputDecoration(
              labelText: 'Update Role',
              border: OutlineInputBorder(),
            ),
            items: const [
              DropdownMenuItem(value: 'student', child: Text('student')),
              DropdownMenuItem(value: 'faculty', child: Text('faculty')),
              DropdownMenuItem(value: 'admin', child: Text('admin')),
            ],
            onChanged: (value) {
              if (value == null || value == user.role) {
                return;
              }
              onUpdateRole(value);
            },
          ),
          const SizedBox(height: 8),
          SwitchListTile(
            value: user.isActive,
            title: const Text('Enabled'),
            contentPadding: EdgeInsets.zero,
            onChanged: (value) {
              if (value == user.isActive) {
                return;
              }
              onToggleStatus(value);
            },
          ),
        ],
      ),
    );
  }
}
