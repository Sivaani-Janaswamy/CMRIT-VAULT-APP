import 'dart:typed_data';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../subjects/domain/resource_item.dart';
import '../application/faculty_controller.dart';
import '../domain/faculty_resource_form_input.dart';
import '../domain/faculty_upload_flow_error.dart';

class FacultyResourceFormScreen extends ConsumerStatefulWidget {
  const FacultyResourceFormScreen({
    super.key,
    this.resourceId,
    this.initialResource,
  });

  final String? resourceId;
  final ResourceItem? initialResource;

  bool get isEdit => resourceId != null && resourceId!.isNotEmpty;

  @override
  ConsumerState<FacultyResourceFormScreen> createState() =>
      _FacultyResourceFormScreenState();
}

class _FacultyResourceFormScreenState
    extends ConsumerState<FacultyResourceFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _subjectIdController = TextEditingController();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _academicYearController = TextEditingController();
  final _fileNameController = TextEditingController();
  final _filePathController = TextEditingController();
  final _fileSizeController = TextEditingController();
  final _mimeTypeController = TextEditingController();

  String _resourceType = 'note';
  int _semester = 1;
  bool _isSaving = false;
  String? _loadError;
  String? _uploadStateLabel;

  Uint8List? _selectedFileBytes;
  String? _selectedFileName;
  String? _selectedMimeType;
  FacultyUploadFlowError? _pendingUploadError;

  @override
  void initState() {
    super.initState();
    final initial = widget.initialResource;
    if (initial != null) {
      _applyResource(initial);
    }
  }

  @override
  void dispose() {
    _subjectIdController.dispose();
    _titleController.dispose();
    _descriptionController.dispose();
    _academicYearController.dispose();
    _fileNameController.dispose();
    _filePathController.dispose();
    _fileSizeController.dispose();
    _mimeTypeController.dispose();
    super.dispose();
  }

  void _applyResource(ResourceItem resource) {
    _subjectIdController.text = resource.subjectId;
    _titleController.text = resource.title;
    _descriptionController.text = resource.description ?? '';
    _academicYearController.text = resource.academicYear;
    _fileNameController.text = resource.fileName;
    _filePathController.text = resource.filePath;
    _fileSizeController.text = resource.fileSizeBytes.toString();
    _mimeTypeController.text = resource.mimeType;
    _resourceType = resource.resourceType;
    _semester = resource.semester;
  }

  Future<void> _pickFile() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowMultiple: false,
      withData: true,
      allowedExtensions: const ['pdf', 'doc', 'docx', 'png', 'jpg', 'jpeg'],
    );

    if (result == null || result.files.isEmpty) {
      return;
    }

    final file = result.files.single;
    final bytes = file.bytes;
    if (bytes == null) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Unable to read selected file bytes')),
      );
      return;
    }

    final name = file.name.trim();
    final mimeType = _inferMimeType(name);
    final generatedPath = _buildFilePath(name, _resourceType);

    setState(() {
      _selectedFileBytes = bytes;
      _selectedFileName = name;
      _selectedMimeType = mimeType;
      _fileNameController.text = name;
      _fileSizeController.text = bytes.length.toString();
      _mimeTypeController.text = mimeType;
      _filePathController.text = generatedPath;
      _pendingUploadError = null;
    });
  }

  FacultyResourceFormInput? _buildInput() {
    if (!(_formKey.currentState?.validate() ?? false)) {
      return null;
    }

    final size = int.tryParse(_fileSizeController.text.trim());
    if (size == null || size <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('File size must be a positive number')),
      );
      return null;
    }

    final description = _descriptionController.text.trim();
    return FacultyResourceFormInput(
      subjectId: _subjectIdController.text.trim(),
      title: _titleController.text.trim(),
      description: description.isEmpty ? null : description,
      resourceType: _resourceType,
      academicYear: _academicYearController.text.trim(),
      semester: _semester,
      fileName: _fileNameController.text.trim(),
      filePath: _filePathController.text.trim(),
      fileSizeBytes: size,
      mimeType: _mimeTypeController.text.trim(),
    );
  }

  Future<void> _save() async {
    final input = _buildInput();
    if (input == null) {
      return;
    }

    if (!widget.isEdit && _selectedFileBytes == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Select a file before creating resource')),
      );
      return;
    }

    setState(() {
      _isSaving = true;
      _uploadStateLabel = widget.isEdit ? 'saving...' : 'uploading...';
      _pendingUploadError = null;
    });

    try {
      if (widget.isEdit) {
        await ref
            .read(facultyResourceActionControllerProvider.notifier)
            .updateResource(
              resourceId: widget.resourceId!,
              input: input,
            );
      } else {
        await ref
            .read(facultyResourceActionControllerProvider.notifier)
            .createAndUploadResource(
              input: input,
              fileBytes: _selectedFileBytes!,
              mimeType: _selectedMimeType ?? input.mimeType,
            );
      }

      if (!mounted) {
        return;
      }

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            widget.isEdit
                ? 'Resource updated successfully'
                : 'Resource uploaded successfully',
          ),
        ),
      );
      Navigator.of(context).pop(true);
    } catch (error) {
      if (!mounted) {
        return;
      }

      if (!widget.isEdit && error is FacultyUploadFlowError) {
        setState(() {
          _pendingUploadError = error;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(error.message),
            action: SnackBarAction(
              label: 'Retry',
              onPressed: _retryUpload,
            ),
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Save failed: $error')),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isSaving = false;
          _uploadStateLabel = null;
        });
      }
    }
  }

  Future<void> _retryUpload() async {
    final failedFlow = _pendingUploadError;
    final fileBytes = _selectedFileBytes;
    if (failedFlow == null || fileBytes == null) {
      return;
    }

    setState(() {
      _isSaving = true;
      _uploadStateLabel = 'retrying upload...';
    });

    try {
      await ref
          .read(facultyResourceActionControllerProvider.notifier)
          .retryUploadFlow(
            failedFlow: failedFlow,
            fileBytes: fileBytes,
            mimeType: _selectedMimeType ?? _mimeTypeController.text.trim(),
          );

      if (!mounted) {
        return;
      }

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Upload completed successfully')),
      );
      Navigator.of(context).pop(true);
    } catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Retry failed: $error')),
      );
    } finally {
      if (mounted) {
        setState(() {
          _isSaving = false;
          _uploadStateLabel = null;
        });
      }
    }
  }

  String _buildFilePath(String fileName, String resourceType) {
    final safeName = fileName.replaceAll(RegExp(r'[^a-zA-Z0-9._-]'), '_');
    final millis = DateTime.now().millisecondsSinceEpoch;
    return 'resources/$resourceType/$millis-$safeName';
  }

  String _inferMimeType(String name) {
    final lower = name.toLowerCase();
    if (lower.endsWith('.pdf')) return 'application/pdf';
    if (lower.endsWith('.doc')) return 'application/msword';
    if (lower.endsWith('.docx')) {
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    }
    if (lower.endsWith('.png')) return 'image/png';
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
    return 'application/octet-stream';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.isEdit ? 'Edit Resource' : 'Create Resource'),
      ),
      body: _loadError != null
              ? Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text('Failed to load resource'),
                      const SizedBox(height: 8),
                      Text(_loadError!, textAlign: TextAlign.center),
                    ],
                  ),
                )
              : SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      children: [
                        TextFormField(
                          controller: _subjectIdController,
                          decoration: const InputDecoration(
                            labelText: 'Subject ID',
                            border: OutlineInputBorder(),
                          ),
                          validator: (value) {
                            if (value == null || value.trim().isEmpty) {
                              return 'Required';
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 10),
                        TextFormField(
                          controller: _titleController,
                          decoration: const InputDecoration(
                            labelText: 'Title',
                            border: OutlineInputBorder(),
                          ),
                          validator: (value) {
                            if (value == null || value.trim().isEmpty) {
                              return 'Required';
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 10),
                        TextFormField(
                          controller: _descriptionController,
                          decoration: const InputDecoration(
                            labelText: 'Description (optional)',
                            border: OutlineInputBorder(),
                          ),
                          maxLines: 3,
                        ),
                        const SizedBox(height: 10),
                        Row(
                          children: [
                            Expanded(
                              child: DropdownButtonFormField<String>(
                                initialValue: _resourceType,
                                decoration: const InputDecoration(
                                  labelText: 'Resource type',
                                  border: OutlineInputBorder(),
                                ),
                                items: const [
                                  DropdownMenuItem(
                                    value: 'note',
                                    child: Text('note'),
                                  ),
                                  DropdownMenuItem(
                                    value: 'question_paper',
                                    child: Text('question_paper'),
                                  ),
                                  DropdownMenuItem(
                                    value: 'faculty_upload',
                                    child: Text('faculty_upload'),
                                  ),
                                ],
                                onChanged: (value) {
                                  if (value == null) {
                                    return;
                                  }
                                  setState(() {
                                    _resourceType = value;
                                    if (_selectedFileName != null) {
                                      _filePathController.text =
                                          _buildFilePath(_selectedFileName!, value);
                                    }
                                  });
                                },
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: DropdownButtonFormField<int>(
                                initialValue: _semester,
                                decoration: const InputDecoration(
                                  labelText: 'Semester',
                                  border: OutlineInputBorder(),
                                ),
                                items: List.generate(
                                  8,
                                  (index) => DropdownMenuItem<int>(
                                    value: index + 1,
                                    child: Text('Sem ${index + 1}'),
                                  ),
                                ),
                                onChanged: (value) {
                                  if (value == null) {
                                    return;
                                  }
                                  setState(() {
                                    _semester = value;
                                  });
                                },
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        TextFormField(
                          controller: _academicYearController,
                          decoration: const InputDecoration(
                            labelText: 'Academic year',
                            border: OutlineInputBorder(),
                          ),
                          validator: (value) {
                            if (value == null || value.trim().isEmpty) {
                              return 'Required';
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 12),
                        if (!widget.isEdit) ...[
                          SizedBox(
                            width: double.infinity,
                            child: OutlinedButton.icon(
                              onPressed: _isSaving ? null : _pickFile,
                              icon: const Icon(Icons.attach_file),
                              label: const Text('Select File'),
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            _selectedFileName == null
                                ? 'No file selected'
                                : 'Selected: $_selectedFileName',
                          ),
                          const SizedBox(height: 8),
                        ],
                        TextFormField(
                          controller: _fileNameController,
                          readOnly: !widget.isEdit,
                          decoration: const InputDecoration(
                            labelText: 'File name',
                            border: OutlineInputBorder(),
                          ),
                          validator: (value) {
                            if (value == null || value.trim().isEmpty) {
                              return 'Required';
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 10),
                        TextFormField(
                          controller: _filePathController,
                          readOnly: !widget.isEdit,
                          decoration: const InputDecoration(
                            labelText: 'File path',
                            border: OutlineInputBorder(),
                          ),
                          validator: (value) {
                            if (value == null || value.trim().isEmpty) {
                              return 'Required';
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 10),
                        TextFormField(
                          controller: _fileSizeController,
                          readOnly: !widget.isEdit,
                          keyboardType: TextInputType.number,
                          decoration: const InputDecoration(
                            labelText: 'File size (bytes)',
                            border: OutlineInputBorder(),
                          ),
                          validator: (value) {
                            if (value == null || value.trim().isEmpty) {
                              return 'Required';
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 10),
                        TextFormField(
                          controller: _mimeTypeController,
                          readOnly: !widget.isEdit,
                          decoration: const InputDecoration(
                            labelText: 'MIME type',
                            border: OutlineInputBorder(),
                          ),
                          validator: (value) {
                            if (value == null || value.trim().isEmpty) {
                              return 'Required';
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 16),
                        if (_uploadStateLabel != null) ...[
                          Text(_uploadStateLabel!),
                          const SizedBox(height: 8),
                        ],
                        SizedBox(
                          width: double.infinity,
                          child: FilledButton(
                            onPressed: _isSaving ? null : _save,
                            child: Text(
                              _isSaving
                                  ? 'Working...'
                                  : (widget.isEdit ? 'Save' : 'Create & Upload'),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
    );
  }
}
