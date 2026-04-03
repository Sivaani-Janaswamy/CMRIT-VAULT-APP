import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart' as supabase;

import '../../../core/services/backend_api_service.dart';
import '../../../core/services/supabase_service.dart';
import '../../../core/utils/app_logger.dart';
import '../data/auth_repository.dart';
import '../domain/auth_state.dart';

final authControllerProvider =
    NotifierProvider<AuthController, AuthState>(AuthController.new);

class AuthController extends Notifier<AuthState> {
  StreamSubscription<supabase.AuthState>? _authSubscription;

  @override
  AuthState build() {
    appLog('AuthController.build(): start');
    ref.onDispose(() {
      appLog('AuthController.build(): disposed, cancelling auth subscription');
      _authSubscription?.cancel();
    });

    _authSubscription ??= ref
        .read(supabaseClientProvider)
        .auth
        .onAuthStateChange
        .listen((data) {
      appLog('AuthController.build(): auth state changed -> session=${data.session != null}');
      unawaited(_handleSession(data.session));
    });
    appLog('AuthController.build(): returning bootstrapping state');
    return AuthState.bootstrapping();
  }

  Future<void> _bootstrap() async {
    appLog('AuthController._bootstrap(): start');
    try {
      final session = ref.read(supabaseClientProvider).auth.currentSession;
      appLog('AuthController._bootstrap(): currentSession=${session != null}');
      if (session == null) {
        state = AuthState.unauthenticated();
        appLog('AuthController._bootstrap(): no session -> unauthenticated');
        return;
      }

      await _handleSession(session);
      appLog('AuthController._bootstrap(): completed');
    } catch (error, stackTrace) {
      appLogError('AuthController._bootstrap(): error', error, stackTrace);
      state = AuthState.error(message: error.toString());
    }
  }

  Future<void> signIn({
    required String email,
    required String password,
  }) async {
    appLog('AuthController.signIn(): start for $email');
    state = AuthState.signingIn();
    try {
      await ref.read(supabaseClientProvider).auth.signInWithPassword(
            email: email,
            password: password,
          );
      appLog('AuthController.signIn(): Supabase signInWithPassword completed');
    } on supabase.AuthException catch (error) {
      appLog('AuthController.signIn(): auth exception -> ${error.message}');
      state = AuthState.unauthenticated(message: error.message);
    } catch (error) {
      appLog('AuthController.signIn(): error -> $error');
      state = AuthState.unauthenticated(message: error.toString());
    }
  }

  Future<void> signUp({
    required String fullName,
    required String email,
    required String password,
  }) async {
    appLog('AuthController.signUp(): start for $email');
    state = AuthState.signingUp();
    try {
      final result = await ref.read(supabaseClientProvider).auth.signUp(
            email: email,
            password: password,
            data: {
              'full_name': fullName,
              'role': 'student',
            },
          );

      appLog('AuthController.signUp(): Supabase signUp completed session=${result.session != null}');
      if (result.session == null) {
        state = AuthState.unauthenticated(
          message: 'Account created. Please sign in to continue.',
        );
      }
    } on supabase.AuthException catch (error) {
      appLog('AuthController.signUp(): auth exception -> ${error.message}');
      state = AuthState.unauthenticated(message: error.message);
    } catch (error) {
      appLog('AuthController.signUp(): error -> $error');
      state = AuthState.unauthenticated(message: error.toString());
    }
  }

  Future<void> signOut() async {
    appLog('AuthController.signOut(): start');
    await ref.read(supabaseClientProvider).auth.signOut();
    state = AuthState.unauthenticated();
    appLog('AuthController.signOut(): completed');
  }

  Future<void> retryBootstrap() {
    appLog('AuthController.retryBootstrap(): called');
    return _bootstrap();
  }

  Future<void> _handleSession(supabase.Session? session) async {
    appLog('AuthController._handleSession(): start session=${session != null}');
    if (session == null) {
      state = AuthState.unauthenticated();
      appLog('AuthController._handleSession(): no session -> unauthenticated');
      return;
    }

    state = AuthState.bootstrapping();
    try {
      final api = ref.read(backendApiServiceProvider);
      appLog('AuthController._handleSession(): calling /v1/auth/sync');
      await api.syncAuth();
      appLog('AuthController._handleSession(): calling /v1/users/me');
      final user = await ref.read(authRepositoryProvider).fetchCurrentUser();

      state = AuthState.authenticated(
        session: session,
        user: user,
      );
      appLog(
        'AuthController._handleSession(): authenticated role=${user.role}, email=${user.email}',
      );
    } on supabase.AuthException catch (error) {
      appLog('AuthController._handleSession(): auth exception -> ${error.message}');
      state = AuthState.error(
        session: session,
        message: error.message,
      );
    } catch (error) {
      appLog('AuthController._handleSession(): error -> $error');
      state = AuthState.error(
        session: session,
        message: error.toString(),
      );
    }
  }

  Future<void> bootstrap() {
    appLog('AuthController.bootstrap(): called');
    return _bootstrap();
  }

  Future<void> updateProfile({
    required String fullName,
  }) async {
    final currentState = state;
    final currentSession = currentState.session;
    final currentUser = currentState.user;

    if (currentSession == null || currentUser == null) {
      state = AuthState.unauthenticated(message: 'Session expired. Please sign in again.');
      return;
    }

    try {
      appLog('AuthController.updateProfile(): start');
      final updatedUser = await ref.read(authRepositoryProvider).updateCurrentUser(
            fullName: fullName,
          );

      state = AuthState.authenticated(
        session: currentSession,
        user: updatedUser,
      );
      appLog('AuthController.updateProfile(): success');
    } catch (error) {
      appLog('AuthController.updateProfile(): error -> $error');
      state = AuthState.error(
        session: currentSession,
        user: currentUser,
        message: error.toString(),
      );
      rethrow;
    }
  }
}
