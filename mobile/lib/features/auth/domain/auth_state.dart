import 'package:supabase_flutter/supabase_flutter.dart';

import 'app_user.dart';

enum AuthStatus {
  bootstrapping,
  unauthenticated,
  signingIn,
  authenticated,
  error,
}

class AuthState {
  static const Object _messageUnset = Object();

  const AuthState({
    required this.status,
    this.session,
    this.user,
    this.message,
  });

  final AuthStatus status;
  final Session? session;
  final AppUser? user;
  final String? message;

  bool get isBusy =>
      status == AuthStatus.bootstrapping || status == AuthStatus.signingIn;

  bool get hasUser => user != null;

  AuthState copyWith({
    AuthStatus? status,
    Session? session,
    AppUser? user,
    Object? message = _messageUnset,
  }) {
    return AuthState(
      status: status ?? this.status,
      session: session ?? this.session,
      user: user ?? this.user,
      message: identical(message, _messageUnset)
          ? this.message
          : message as String?,
    );
  }

  factory AuthState.bootstrapping() {
    return const AuthState(status: AuthStatus.bootstrapping);
  }

  factory AuthState.unauthenticated({String? message}) {
    return AuthState(
      status: AuthStatus.unauthenticated,
      message: message,
    );
  }

  factory AuthState.signingIn() {
    return const AuthState(status: AuthStatus.signingIn);
  }

  factory AuthState.authenticated({
    required Session session,
    required AppUser user,
  }) {
    return AuthState(
      status: AuthStatus.authenticated,
      session: session,
      user: user,
    );
  }

  factory AuthState.error({
    Session? session,
    AppUser? user,
    String? message,
  }) {
    return AuthState(
      status: AuthStatus.error,
      session: session,
      user: user,
      message: message,
    );
  }
}
