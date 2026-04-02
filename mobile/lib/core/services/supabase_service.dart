import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

final supabaseClientProvider = Provider<SupabaseClient>((ref) {
  return Supabase.instance.client;
});

final authStateChangesProvider = StreamProvider<Session?>((ref) {
  return ref.watch(supabaseClientProvider).auth.onAuthStateChange.map(
        (event) => event.session,
      );
});
