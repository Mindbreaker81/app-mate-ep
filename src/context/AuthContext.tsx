import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import type { UserProfile } from '../types';
import {
  buildSyntheticEmail,
  isValidPin,
  isValidUsername,
  normalizeUsername,
} from '../utils/authHelpers';

interface SignInPayload {
  username: string;
  pin: string;
}

interface SignUpPayload extends SignInPayload {
  avatar: string;
}

export interface AuthContextValue {
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  signIn: (payload: SignInPayload) => Promise<void>;
  signUp: (payload: SignUpPayload) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
AuthContext.displayName = 'AuthContext';

async function upsertProfile(payload: { id: string; username: string; avatar: string }): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .upsert({ id: payload.id, username: payload.username, avatar: payload.avatar }, { onConflict: 'id' });

  if (error) {
    throw error;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, avatar, created_at')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) {
      setError(profileError.message);
      return null;
    }

    const userProfile = data ?? null;
    setProfile(userProfile);
    return userProfile;
  }, []);

  const clearError = useCallback(() => setError(null), []);

  useEffect(() => {
    let isMounted = true;

    const resolveSession = async (incomingSession: Session | null) => {
      if (!isMounted) return;
      setSession(incomingSession);
      if (incomingSession?.user) {
        await fetchProfile(incomingSession.user.id);
      } else {
        setProfile(null);
      }
    };

    const initialize = async () => {
      const { data } = await supabase.auth.getSession();
      await resolveSession(data.session ?? null);
      if (isMounted) {
        setLoading(false);
      }
    };

    void initialize();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      clearError();
      await resolveSession(newSession ?? null);
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, [clearError, fetchProfile]);

  const signIn = useCallback(
    async ({ username, pin }: SignInPayload) => {
      clearError();

      const sanitizedUsername = normalizeUsername(username);
      if (!isValidUsername(sanitizedUsername)) {
        setError('El nombre de usuario debe tener 3-15 caracteres, solo letras y números.');
        return;
      }
      if (!isValidPin(pin)) {
        setError('El PIN debe contener exactamente 6 dígitos.');
        return;
      }

      const email = buildSyntheticEmail(sanitizedUsername);
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password: pin });

      if (signInError) {
        setError('No pudimos iniciar sesión. Verifica tu usuario y PIN.');
        return;
      }

      await fetchProfile(data.user?.id ?? data.session?.user.id ?? '');
      setSession(data.session ?? null);
    },
    [clearError, fetchProfile]
  );

  const signUp = useCallback(
    async ({ username, pin, avatar }: SignUpPayload) => {
      clearError();

      const sanitizedUsername = normalizeUsername(username);
      if (!isValidUsername(sanitizedUsername)) {
        setError('El nombre de usuario debe tener 3-15 caracteres, solo letras y números.');
        return;
      }
      if (!isValidPin(pin)) {
        setError('El PIN debe contener exactamente 6 dígitos.');
        return;
      }

      const { data: existingUser, error: usernameCheckError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', sanitizedUsername)
        .maybeSingle();

      if (usernameCheckError) {
        setError('Tuvimos un problema revisando el usuario. Intenta de nuevo.');
        return;
      }

      if (existingUser) {
        setError('Ese nombre de usuario ya está en uso.');
        return;
      }

      const email = buildSyntheticEmail(sanitizedUsername);

      const { data, error: signUpError } = await supabase.auth.signUp({ email, password: pin });

      if (signUpError || !data.user) {
        setError('No pudimos crear tu cuenta. Intenta de nuevo.');
        return;
      }

      try {
        await upsertProfile({ id: data.user.id, username: sanitizedUsername, avatar });
      } catch (profileError) {
        setError('Cuenta creada, pero no pudimos guardar tu perfil. Intenta iniciar sesión.');
      }

      await fetchProfile(data.user.id);
      setSession(data.session ?? null);
    },
    [clearError, fetchProfile]
  );

  const signOut = useCallback(async () => {
    clearError();
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  }, [clearError]);

  const value = useMemo<AuthContextValue>(
    () => ({ session, profile, loading, error, signIn, signUp, signOut, clearError }),
    [session, profile, loading, error, signIn, signUp, signOut, clearError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}

export { AuthContext };
