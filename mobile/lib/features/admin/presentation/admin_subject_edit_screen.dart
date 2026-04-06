import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/widgets/ui_state_widgets.dart';
import '../../auth/application/auth_controller.dart';
import '../../subjects/domain/subject.dart';
import '../application/admin_controller.dart';
import 'admin_access_denied_view.dart';

class AdminSubjectEditScreen extends ConsumerStatefulWidget {
  const AdminSubjectEditScreen({super.key});

  @override
  ConsumerState<AdminSubjectEditScreen> createState() =>
      _AdminSubjectEditScreenState();
}

class _AdminSubjectEditScreenState extends ConsumerState<AdminSubjectEditScreen> {
  final _formKey = GlobalKey<FormState>();
  final _codeController = TextEditingController();
  final _nameController = TextEditingController();
  final _departmentController = TextEditingController();
  int _semester = 1;
  bool _isActive = true;
  String? _selectedSubjectId;
  String? _lastSyncedSignature;

  int _normalizeSemester(int value) {
    if (value < 1 || value > 8) {
      return 1;
    }
    return value;
  }

  @override
  void dispose() {
    _codeController.dispose();
    _nameController.dispose();
    _departmentController.dispose();
    super.dispose();
  }

  void _applySubject(Subject subject) {
    _selectedSubjectId = subject.id;
    _codeController.text = subject.code;
    _nameController.text = subject.name;
    _departmentController.text = subject.department;
    _semester = _normalizeSemester(subject.semester);
    _isActive = subject.isActive;
    _lastSyncedSignature = _subjectSignature(subject);
  }

  String _subjectSignature(Subject subject) {
    return '${subject.id}|${subject.code}|${subject.name}|${subject.department}|${subject.semester}|${subject.isActive}|${subject.updatedAt?.toIso8601String() ?? ''}';
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authControllerProvider);
    if (authState.user?.role != 'admin') {
      return const AdminAccessDeniedView();
    }

    final subjectsAsync = ref.watch(adminSubjectsProvider);

    return Scaffold(
      appBar: AppBar(
        leading: const BackButton(),
        title: const Text('Manage Subjects'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: subjectsAsync.when(
          loading: () => const AppLoadingStateCard(label: 'Loading subjects...'),
          error: (error, _) => Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const AppEmptyStateCard(
                  icon: Icons.error_outline,
                  title: 'Failed to load subjects',
                  message: 'Please retry to continue.',
                ),
                const SizedBox(height: 12),
                FilledButton(
                  onPressed: () => ref.invalidate(adminSubjectsProvider),
                  child: const Text('Retry'),
                ),
              ],
            ),
          ),
          data: (page) {
            final subjects = {
              for (final subject in page.items) subject.id: subject,
            }.values.toList();
            if (subjects.isEmpty) {
              return const AppEmptyStateCard(
                icon: Icons.menu_book_outlined,
                title: 'No subjects found',
                message: 'Create a subject to start managing it.',
              );
            }

            if (_selectedSubjectId != null &&
                !subjects.any((item) => item.id == _selectedSubjectId)) {
              _applySubject(subjects.first);
            }

            Subject selected;
            if (_selectedSubjectId == null) {
              selected = subjects.first;
              WidgetsBinding.instance.addPostFrameCallback((_) {
                if (!mounted) {
                  return;
                }
                setState(() {
                  _applySubject(selected);
                });
              });
            } else {
              selected = subjects.firstWhere(
                (item) => item.id == _selectedSubjectId,
                orElse: () => subjects.first,
              );
            }

            final actionState = ref.watch(adminSubjectManagementControllerProvider);
            final isLoading = actionState.isLoading;
            final selectedSignature = _subjectSignature(selected);
            if (_selectedSubjectId != null &&
                _lastSyncedSignature != selectedSignature &&
                !isLoading) {
              WidgetsBinding.instance.addPostFrameCallback((_) {
                if (!mounted) {
                  return;
                }
                setState(() {
                  _applySubject(selected);
                });
              });
            }

            return SingleChildScrollView(
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const AppSectionHeader(title: 'Subject Management'),
                    const SizedBox(height: 12),
                    Card(
                      margin: EdgeInsets.zero,
                      child: Padding(
                        padding: const EdgeInsets.all(14),
                        child: Column(
                          children: [
                    DropdownButtonFormField<String>(
                      key: ValueKey(selected.id),
                      initialValue: selected.id,
                      isExpanded: true,
                      decoration: const InputDecoration(
                        labelText: 'Select Subject',
                        border: OutlineInputBorder(),
                      ),
                      items: subjects
                          .map(
                            (subject) => DropdownMenuItem<String>(
                              value: subject.id,
                              child: Text(
                                '${subject.code} - ${subject.name}',
                                overflow: TextOverflow.ellipsis,
                                maxLines: 1,
                              ),
                            ),
                          )
                          .toList(),
                      onChanged: isLoading
                          ? null
                          : (value) {
                              if (value == null) {
                                return;
                              }
                              final next = subjects.firstWhere((item) => item.id == value);
                              setState(() {
                                _applySubject(next);
                              });
                            },
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _codeController,
                      decoration: const InputDecoration(
                        labelText: 'Code',
                        border: OutlineInputBorder(),
                      ),
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return 'Code is required';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 10),
                    TextFormField(
                      controller: _nameController,
                      decoration: const InputDecoration(
                        labelText: 'Name',
                        border: OutlineInputBorder(),
                      ),
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return 'Name is required';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 10),
                    TextFormField(
                      controller: _departmentController,
                      decoration: const InputDecoration(
                        labelText: 'Department',
                        border: OutlineInputBorder(),
                      ),
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return 'Department is required';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 10),
                    DropdownButtonFormField<int>(
                      key: ValueKey(_semester),
                      initialValue: _semester,
                      decoration: const InputDecoration(
                        labelText: 'Semester',
                        border: OutlineInputBorder(),
                      ),
                      items: List.generate(
                        8,
                        (index) => DropdownMenuItem<int>(
                          value: index + 1,
                          child: Text('Semester ${index + 1}'),
                        ),
                      ),
                      onChanged: isLoading
                          ? null
                          : (value) {
                              if (value == null) {
                                return;
                              }
                              setState(() {
                                _semester = value;
                              });
                            },
                    ),
                    const SizedBox(height: 10),
                    SwitchListTile(
                      value: _isActive,
                      title: const Text('Active'),
                      contentPadding: EdgeInsets.zero,
                      onChanged: isLoading
                          ? null
                          : (value) {
                              setState(() {
                                _isActive = value;
                              });
                            },
                    ),
                                ],
                              ),
                            ),
                          ),
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      child: FilledButton(
                        onPressed: isLoading ? null : _updateSubject,
                        child: Text(isLoading ? 'Saving...' : 'Update Subject'),
                      ),
                    ),
                    const SizedBox(height: 8),
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton(
                        onPressed: isLoading ? null : () => _confirmDelete(selected),
                        child: const Text('Delete Subject'),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  Future<void> _updateSubject() async {
    if (!(_formKey.currentState?.validate() ?? false)) {
      return;
    }

    final subjectId = _selectedSubjectId;
    if (subjectId == null || subjectId.isEmpty) {
      return;
    }

    await ref.read(adminSubjectManagementControllerProvider.notifier).updateSubject(
          subjectId: subjectId,
          code: _codeController.text.trim(),
          name: _nameController.text.trim(),
          department: _departmentController.text.trim(),
          semester: _semester,
          isActive: _isActive,
        );

    final state = ref.read(adminSubjectManagementControllerProvider);
    if (!mounted) {
      return;
    }

    if (state.hasError) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Update failed: ${state.error}')),
      );
      return;
    }

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Subject updated successfully')),
    );
    ref.invalidate(adminSubjectsProvider);
  }

  Future<void> _confirmDelete(Subject subject) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Delete subject'),
          content: Text('Are you sure you want to delete ${subject.code} - ${subject.name}?'),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(false),
              child: const Text('Cancel'),
            ),
            FilledButton(
              onPressed: () => Navigator.of(context).pop(true),
              child: const Text('Delete'),
            ),
          ],
        );
      },
    );

    if (confirmed != true) {
      return;
    }

    await ref.read(adminSubjectManagementControllerProvider.notifier).deleteSubject(
          subjectId: subject.id,
        );

    final state = ref.read(adminSubjectManagementControllerProvider);
    if (!mounted) {
      return;
    }

    if (state.hasError) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Delete failed: ${state.error}')),
      );
      return;
    }

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Subject deleted successfully')),
    );

    setState(() {
      _selectedSubjectId = null;
    });
    ref.invalidate(adminSubjectsProvider);
  }
}
