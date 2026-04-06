import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/widgets/ui_state_widgets.dart';
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
  final TextEditingController _searchController = TextEditingController();
  final TextEditingController _departmentController = TextEditingController();
  String _searchQuery = '';
  int _page = 1;
  String? _role;
  int? _semester;

  @override
  void dispose() {
    _searchController.dispose();
    _departmentController.dispose();
    super.dispose();
  }

  InputDecoration _adminFieldDecoration({
    required String labelText,
    String? hintText,
    IconData? prefixIcon,
    IconData? suffixIcon,
  }) {
    return InputDecoration(
      labelText: labelText,
      hintText: hintText,
      filled: true,
      fillColor: Colors.white,
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: BorderSide.none,
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: BorderSide.none,
      ),
      prefixIcon: prefixIcon == null ? null : Icon(prefixIcon),
      suffixIcon: suffixIcon == null ? null : Icon(suffixIcon),
    );
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
            _buildTopBar(),
            const SizedBox(height: 12),
            Expanded(
              child: usersAsync.when(
                loading: () => const AppLoadingStateCard(
                  label: 'Loading users...',
                ),
                error: (error, _) => Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const AppEmptyStateCard(
                        icon: Icons.error_outline,
                        title: 'Failed to load users',
                        message: 'Please retry to continue.',
                      ),
                      const SizedBox(height: 12),
                      FilledButton(
                        onPressed: () => ref.invalidate(adminUsersProvider(filters)),
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                ),
                data: (page) {
                  final query = _searchQuery.trim().toLowerCase();
                  final filteredItems = query.isEmpty
                      ? page.items
                      : page.items
                          .where(
                            (item) => item.email.toLowerCase().contains(query),
                          )
                          .toList(growable: false);

                  if (filteredItems.isEmpty) {
                    return const AppEmptyStateCard(
                      icon: Icons.group_outlined,
                      title: 'No users found',
                      message: 'Try adjusting your filters.',
                    );
                  }

                  return Column(
                    children: [
                      Expanded(
                        child: ListView.separated(
                          itemCount: filteredItems.length,
                          separatorBuilder: (context, index) =>
                              const SizedBox(height: 8),
                          itemBuilder: (context, index) {
                            final item = filteredItems[index];
                            return _AdminUserCard(
                              item: item,
                              onUpdateRole: (role) => _confirmUpdateRole(item, role),
                              onToggleStatus: (value) =>
                                  _confirmToggleStatus(item, value),
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

  Widget _buildTopBar() {
    return Row(
      children: [
        Expanded(
          child: TextField(
            controller: _searchController,
            onChanged: (value) {
              setState(() {
                _searchQuery = value;
                _page = 1;
              });
            },
            textInputAction: TextInputAction.search,
            decoration: _adminFieldDecoration(
              labelText: 'Search email',
              hintText: 'Search by email',
              prefixIcon: Icons.search,
              suffixIcon: Icons.tune,
            ),
          ),
        ),
        const SizedBox(width: 8),
        FilledButton.icon(
          onPressed: _openFiltersSheet,
          icon: const Icon(Icons.filter_alt_outlined),
          label: const Text('Filters'),
        ),
      ],
    );
  }

  Future<void> _openFiltersSheet() async {
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (context) {
        return SafeArea(
          child: Padding(
            padding: EdgeInsets.only(
              left: 16,
              right: 16,
              top: 12,
              bottom: MediaQuery.of(context).viewInsets.bottom + 12,
            ),
            child: SingleChildScrollView(
              child: _buildFilters(),
            ),
          ),
        );
      },
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
              decoration: _adminFieldDecoration(
                labelText: 'Role',
                prefixIcon: Icons.manage_accounts,
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
              decoration: _adminFieldDecoration(
                labelText: 'Department (optional)',
                prefixIcon: Icons.apartment,
              ),
            ),
            const SizedBox(height: 8),
            DropdownButtonFormField<int?>(
              initialValue: _semester,
              decoration: _adminFieldDecoration(
                labelText: 'Semester',
                prefixIcon: Icons.school_outlined,
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
                      Navigator.of(context).pop();
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
                      Navigator.of(context).pop();
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

  Future<void> _confirmUpdateRole(AdminUserItem item, String role) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          title: const Text('Are you sure?'),
          content: Text('Update role for ${item.email} to $role?'),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(false),
              child: const Text('Cancel'),
            ),
            FilledButton(
              onPressed: () => Navigator.of(dialogContext).pop(true),
              child: const Text('Confirm'),
            ),
          ],
        );
      },
    );

    if (confirmed != true) {
      return;
    }
    await _updateRole(item, role);
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

  Future<void> _confirmToggleStatus(AdminUserItem item, bool isActive) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          title: const Text('Are you sure?'),
          content: Text(
            isActive
                ? 'Enable this user?'
                : 'Disable this user?',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(false),
              child: const Text('Cancel'),
            ),
            FilledButton(
              onPressed: () => Navigator.of(dialogContext).pop(true),
              child: const Text('Confirm'),
            ),
          ],
        );
      },
    );

    if (confirmed != true) {
      return;
    }
    await _updateStatus(item, isActive);
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
      margin: EdgeInsets.zero,
      elevation: 1,
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
                    decoration: InputDecoration(
                      labelText: 'Update Role',
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
