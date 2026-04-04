import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../application/auth_controller.dart';

class ProfileEditScreen extends ConsumerStatefulWidget {
  const ProfileEditScreen({super.key});

  @override
  ConsumerState<ProfileEditScreen> createState() => _ProfileEditScreenState();
}

class _ProfileEditScreenState extends ConsumerState<ProfileEditScreen> {
  final _formKey = GlobalKey<FormState>();
  final _fullNameController = TextEditingController();
  final _rollNoController = TextEditingController();
  final _departmentController = TextEditingController();
  final _semesterController = TextEditingController();
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    final user = ref.read(authControllerProvider).user;
    _fullNameController.text = user?.fullName ?? '';
    _rollNoController.text = user?.rollNo ?? '';
    _departmentController.text = user?.department ?? '';
    _semesterController.text = user?.semester?.toString() ?? '';
  }

  @override
  void dispose() {
    _fullNameController.dispose();
    _rollNoController.dispose();
    _departmentController.dispose();
    _semesterController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!(_formKey.currentState?.validate() ?? false)) {
      return;
    }

    setState(() {
      _isSaving = true;
    });

    try {
      final parsedSemester = int.tryParse(_semesterController.text.trim());
      if (_semesterController.text.trim().isNotEmpty &&
          (parsedSemester == null || parsedSemester < 1 || parsedSemester > 8)) {
        if (!mounted) {
          return;
        }
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Semester must be between 1 and 8')),
        );
        return;
      }

      await ref.read(authControllerProvider.notifier).updateProfile(
            fullName: _fullNameController.text.trim(),
            rollNo: _rollNoController.text.trim().isEmpty
                ? null
                : _rollNoController.text.trim(),
            department: _departmentController.text.trim().isEmpty
                ? null
                : _departmentController.text.trim(),
            semester: parsedSemester,
          );

      if (!mounted) {
        return;
      }

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Profile updated successfully')),
      );
      Navigator.of(context).pop();
    } catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Profile update failed: $error')),
      );
    } finally {
      if (mounted) {
        setState(() {
          _isSaving = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: const BackButton(),
        title: const Text('Edit Profile'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              TextFormField(
                controller: _fullNameController,
                decoration: const InputDecoration(
                  labelText: 'Full name',
                  border: OutlineInputBorder(),
                ),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Name is required';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _rollNoController,
                decoration: const InputDecoration(
                  labelText: 'Roll no',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _departmentController,
                decoration: const InputDecoration(
                  labelText: 'Department',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _semesterController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Semester (1-8)',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: _isSaving ? null : _save,
                  child: Text(_isSaving ? 'Saving...' : 'Save'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
