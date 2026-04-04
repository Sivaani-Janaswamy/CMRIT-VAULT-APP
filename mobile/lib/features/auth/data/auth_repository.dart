import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/services/backend_api_service.dart';
import '../domain/app_user.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(
    apiService: ref.watch(backendApiServiceProvider),
  );
});

class AuthRepository {
  AuthRepository({
    required this.apiService,
  });

  final BackendApiService apiService;

  Future<AppUser> fetchCurrentUser() async {
    final json = await apiService.fetchCurrentUser();
    return AppUser.fromJson(json);
  }

  Future<AppUser> updateCurrentUser({
    String? fullName,
    String? rollNo,
    String? department,
    int? semester,
  }) async {
    final json = await apiService.updateCurrentUser(
      fullName: fullName,
      rollNo: rollNo,
      department: department,
      semester: semester,
    );
    return AppUser.fromJson(json);
  }
}
