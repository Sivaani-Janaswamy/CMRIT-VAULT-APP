import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart' as supabase;

import '../../../core/services/backend_api_service.dart';
import '../../../core/services/supabase_service.dart';
import '../domain/app_user.dart';
import '../domain/auth_state.dart';

final authControllerProvider =
    NotifierProvider<AuthController, AuthState>(AuthController.new);

class AuthController extends Notifier<AuthState> {
  StreamSubscription<supabase.AuthState>? _authSubscription;

  @override
  AuthState build() {
    debugPrint('AuthController.build(): start');
    ref.onDispose(() {
      debugPrint('AuthController.build(): disposed, cancelling auth subscription');
      _authSubscription?.cancel();
    });

    _authSubscription ??= ref
        .read(supabaseClientProvider)
        .auth
        .onAuthStateChange
        .listen((data) {
      debugPrint('AuthController.build(): auth state changed -> session=${data.session != null}');
      unawaited(_handleSession(data.session));
    });
    debugPrint('AuthController.build(): returning bootstrapping state');
    return AuthState.bootstrapping();
  }

  Future<void> _bootstrap() async {
    debugPrint('AuthController._bootstrap(): start');
    try {
      final session = ref.read(supabaseClientProvider).auth.currentSession;
      debugPrint('AuthController._bootstrap(): currentSession=${session != null}');
      if (session == null) {
        state = AuthState.unauthenticated();
        debugPrint('AuthController._bootstrap(): no session -> unauthenticated');
        return;
      }

      await _handleSession(session);
      debugPrint('AuthController._bootstrap(): completed');
    } catch (error, stackTrace) {
      debugPrint('AuthController._bootstrap(): error -> $error');
      debugPrint('$stackTrace');
      state = AuthState.error(message: error.toString());
    }
  }

  Future<void> signIn({
    required String email,
    required String password,
  }) async {
    debugPrint('AuthController.signIn(): start for $email');
    state = AuthState.signingIn();
    try {
      await ref.read(supabaseClientProvider).auth.signInWithPassword(
            email: email,
            password: password,
          );
      debugPrint('AuthController.signIn(): Supabase signInWithPassword completed');
    } on supabase.AuthException catch (error) {
      debugPrint('AuthController.signIn(): auth exception -> ${error.message}');
      state = AuthState.unauthenticated(message: error.message);
    } catch (error) {
      debugPrint('AuthController.signIn(): error -> $error');
      state = AuthState.unauthenticated(message: error.toString());
    }
  }

  Future<void> signOut() async {
    debugPrint('AuthController.signOut(): start');
    await ref.read(supabaseClientProvider).auth.signOut();
    state = AuthState.unauthenticated();
    debugPrint('AuthController.signOut(): completed');
  }

  Future<void> retryBootstrap() {
    debugPrint('AuthController.retryBootstrap(): called');
    return _bootstrap();
  }

  Future<void> _handleSession(supabase.Session? session) async {
    debugPrint('AuthController._handleSession(): start session=${session != null}');
    if (session == null) {
      state = AuthState.unauthenticated();
      debugPrint('AuthController._handleSession(): no session -> unauthenticated');
      return;
    }

    state = AuthState.bootstrapping();
    try {
      final api = ref.read(backendApiServiceProvider);
      debugPrint('AuthController._handleSession(): calling /v1/auth/sync');
      await api.syncAuth();
      debugPrint('AuthController._handleSession(): calling /v1/users/me');
      final userJson = await api.fetchCurrentUser();
      final user = AppUser.fromJson(userJson);

      state = AuthState.authenticated(
        session: session,
        user: user,
      );
      debugPrint(
        'AuthController._handleSession(): authenticated role=${user.role}, email=${user.email}',
      );
    } on supabase.AuthException catch (error) {
      debugPrint('AuthController._handleSession(): auth exception -> ${error.message}');
      state = AuthState.error(
        session: session,
        message: error.message,
      );
    } catch (error) {
      debugPrint('AuthController._handleSession(): error -> $error');
      state = AuthState.error(
        session: session,
        message: error.toString(),
      );
    }
  }
  Future<void> bootstrap() => _bootstrap();
}
