import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../auth/application/auth_controller.dart';
import '../application/admin_controller.dart';
import '../domain/admin_query_filters.dart';
import '../domain/admin_user_item.dart';
import 'admin_access_denied_view.dart';

class AdminUsersScreen extends ConsumerStatefulWidget {
  const AdminUsersScreen({super.key});

  @override
  ConsumerState<AdminUsersScreen> createState() => _AdminUsersScreenState();
}

class _AdminUsersScreenState extends ConsumerState<AdminUsersScreen> {
  final TextEditingController _departmentController = TextEditingController();
  int _page = 1;
  String? _role;
  int? _semester;

  @override
  void dispose() {
    _departmentController.dispose();
    super.dispose();
  }

  AdminUsersFilters get _filters => AdminUsersFilters(
        page: _page,
        pageSize: 20,
        role: _role,
        department: _departmentController.text.trim().isEmpty
            ? null
            : _departmentController.text.trim(),
        semester: _semester,
      );

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authControllerProvider);
    if (authState.user?.role != 'admin') {
      return const AdminAccessDeniedView();
    }

    final filters = _filters;
    final usersAsync = ref.watch(adminUsersProvider(filters));

    return Scaffold(
      appBar: AppBar(
        leading: const BackButton(),
        title: const Text('Admin Users'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            _buildFilters(),
            const SizedBox(height: 12),
            Expanded(
              child: usersAsync.when(
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (error, _) => Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text('Failed to load users'),
                      const SizedBox(height: 8),
                      Text(error.toString(), textAlign: TextAlign.center),
                      const SizedBox(height: 12),
                      FilledButton(
                        onPressed: () => ref.invalidate(adminUsersProvider(filters)),
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                ),
                data: (page) {
                  if (page.items.isEmpty) {
                    return const Center(child: Text('No users found'));
                  }

                  return Column(
                    children: [
                      Expanded(
                        child: ListView.separated(
                          itemCount: page.items.length,
                          separatorBuilder: (context, index) =>
                              const SizedBox(height: 8),
                          itemBuilder: (context, index) {
                            final item = page.items[index];
                            return _AdminUserCard(
                              item: item,
                              onUpdateRole: (role) => _updateRole(item, role),
                              onToggleStatus: (value) =>
                                  _updateStatus(item, value),
                            );
                          },
                        ),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              'Page ${page.pageInfo.page}',
                            ),
                          ),
                          IconButton(
                            onPressed: page.pageInfo.page > 1
                                ? () {
                                    setState(() {
                                      _page = page.pageInfo.page - 1;
                                    });
                                  }
                                : null,
                            icon: const Icon(Icons.chevron_left),
                          ),
                          IconButton(
                            onPressed:
                                (page.pageInfo.page * page.pageInfo.pageSize) <
                                        page.pageInfo.total
                                    ? () {
                                        setState(() {
                                          _page = page.pageInfo.page + 1;
                                        });
                                      }
                                    : null,
                            icon: const Icon(Icons.chevron_right),
                          ),
                        ],
                      ),
                    ],
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFilters() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          children: [
            DropdownButtonFormField<String?>(
              initialValue: _role,
              decoration: const InputDecoration(
                labelText: 'Role',
                border: OutlineInputBorder(),
              ),
              items: const [
                DropdownMenuItem<String?>(value: null, child: Text('All')),
                DropdownMenuItem<String?>(value: 'student', child: Text('student')),
                DropdownMenuItem<String?>(value: 'faculty', child: Text('faculty')),
                DropdownMenuItem<String?>(value: 'admin', child: Text('admin')),
              ],
              onChanged: (value) {
                setState(() {
                  _role = value;
                });
              },
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _departmentController,
              decoration: const InputDecoration(
                labelText: 'Department (optional)',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 8),
            DropdownButtonFormField<int?>(
              initialValue: _semester,
              decoration: const InputDecoration(
                labelText: 'Semester',
                border: OutlineInputBorder(),
              ),
              items: [
                const DropdownMenuItem<int?>(value: null, child: Text('All')),
                ...List<DropdownMenuItem<int?>>.generate(
                  8,
                  (index) => DropdownMenuItem<int?>(
                    value: index + 1,
                    child: Text('Semester ${index + 1}'),
                  ),
                ),
              ],
              onChanged: (value) {
                setState(() {
                  _semester = value;
                });
              },
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: FilledButton(
                    onPressed: () {
                      setState(() {
                        _page = 1;
                      });
                    },
                    child: const Text('Apply Filters'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: OutlinedButton(
                    onPressed: () {
                      _departmentController.clear();
                      setState(() {
                        _role = null;
                        _semester = null;
                        _page = 1;
                      });
                    },
                    child: const Text('Clear'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _updateRole(AdminUserItem item, String role) async {
    await ref.read(adminUserManagementControllerProvider.notifier).updateUserRole(
          userId: item.id,
          role: role,
        );

    final state = ref.read(adminUserManagementControllerProvider);
    if (!mounted) {
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
    ref.invalidate(adminUsersProvider(_filters));
  }

  Future<void> _updateStatus(AdminUserItem item, bool isActive) async {
    await ref
        .read(adminUserManagementControllerProvider.notifier)
        .updateUserStatus(
          userId: item.id,
          isActive: isActive,
        );

    final state = ref.read(adminUserManagementControllerProvider);
    if (!mounted) {
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
    ref.invalidate(adminUsersProvider(_filters));
  }
}

class _AdminUserCard extends StatelessWidget {
  const _AdminUserCard({
    required this.item,
    required this.onUpdateRole,
    required this.onToggleStatus,
  });

  final AdminUserItem item;
  final ValueChanged<String> onUpdateRole;
  final ValueChanged<bool> onToggleStatus;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              item.fullName,
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 6),
            Text('Email: ${item.email}'),
            Text('Role: ${item.role}'),
            Text('Status: ${item.isActive ? 'active' : 'inactive'}'),
            if (item.department != null) Text('Department: ${item.department}'),
            if (item.semester != null) Text('Semester: ${item.semester}'),
            if (item.rollNo != null) Text('Roll no: ${item.rollNo}'),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => context.push('/admin/users/${item.id}'),
                    child: const Text('View Detail'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: DropdownButtonFormField<String>(
                    initialValue: item.role,
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
                      if (value == null || value == item.role) {
                        return;
                      }
                      onUpdateRole(value);
                    },
                  ),
                ),
              ],
            ),
            Row(
              children: [
                const Text('Enabled'),
                const SizedBox(width: 8),
                Switch(
                  value: item.isActive,
                  onChanged: (value) {
                    if (value == item.isActive) {
                      return;
                    }
                    onToggleStatus(value);
                  },
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
