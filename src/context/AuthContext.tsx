import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { AuthError } from '@supabase/supabase-js';
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
    console.error('Supabase profile upsert error:', error);
    throw error;
  }
}

const SESSION_TIMEOUT_MS = 15000; // Aumentado a 15 segundos para conexiones lentas

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
      console.error('[AuthContext] Error al buscar perfil:', profileError);
      setError(profileError.message);
      return null;
    }

    // Si no se encuentra el perfil, reintentar una vez
    if (!data) {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const { data: retryData, error: retryError } = await supabase
        .from('profiles')
        .select('id, username, avatar, created_at')
        .eq('id', userId)
        .maybeSingle();
      
      if (retryError) {
        console.error('[AuthContext] Error en reintento:', retryError);
      } else {
        const userProfile = retryData ?? null;
        setProfile(userProfile);
        return userProfile;
      }
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
      try {
        let timeoutId: ReturnType<typeof setTimeout> | null = null;
        const timeoutPromise: Promise<{ data: { session: Session | null }; error: AuthError | null }> = new Promise(
          (resolve) => {
            timeoutId = setTimeout(
              () =>
                resolve({
                  data: { session: null },
                  error: {
                    name: 'timeout',
                    message: 'getSession timeout',
                    status: 408,
                  } as AuthError,
                }),
              SESSION_TIMEOUT_MS,
            );
          },
        );

        const raceResult = (await Promise.race([supabase.auth.getSession(), timeoutPromise])) as {
          data: { session: Session | null };
          error: AuthError | null;
        };

        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        if (raceResult.error) {
          if (raceResult.error.message === 'getSession timeout') {
            console.warn(`Supabase getSession tardó más de ${SESSION_TIMEOUT_MS}ms. Continuando sin sesión.`);
          } else {
            console.error('Supabase getSession error:', raceResult.error);
          }
        }

        await resolveSession(raceResult.data.session ?? null);
      } catch (initError) {
        console.error('Supabase getSession arrojó una excepción:', initError);
        await resolveSession(null);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
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

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.debug('AuthProvider estado → loading:', loading, 'session:', session?.user?.id ?? null);
    }
  }, [loading, session]);

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
      
      // IMPORTANTE: Establecer la sesión PRIMERO antes de buscar el perfil
      // Esto asegura que auth.uid() esté disponible para las políticas RLS
      setSession(data.session ?? null);
      
      // Esperar un poco para que la sesión se propague
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const userId = data.user?.id ?? data.session?.user.id ?? '';
      const existingProfile = await fetchProfile(userId);
      
      if (!existingProfile) {
        setError('Tu cuenta existe pero falta información de perfil. Contacta soporte o vuelve a registrarte.');
        await supabase.auth.signOut();
        setSession(null);
        return;
      }
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

      const email = buildSyntheticEmail(sanitizedUsername);

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password: pin,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            username: sanitizedUsername,
            createdFrom: 'pitagoritas-app',
          },
        },
      });

      if (signUpError || !data.user) {
        if (signUpError) {
          console.error('Supabase signUp error:', signUpError);
        }
        const message = signUpError?.message ?? '';
        if (message.includes('already registered')) {
          setError('Ese nombre de usuario ya está en uso. Elige otro.');
        } else if (message.includes('password')) {
          setError('El PIN no cumple con los requisitos de seguridad. Usa 6 dígitos.');
        } else if (message.includes('retry') || message.includes('security purposes')) {
          setError('Hiciste demasiados intentos seguidos. Espera unos segundos antes de intentarlo de nuevo.');
        } else if (message.includes('Failed to fetch') || message.includes('abort') || message.includes('TypeError')) {
          setError('No pudimos conectar con Supabase. Revisa tu conexión y variables VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY.');
        } else if (message.includes('invalid email')) {
          setError('El nombre de usuario no es válido. Usa solo letras y números.');
        } else {
          setError('No pudimos crear tu cuenta. Intenta de nuevo.');
        }
        return;
      }

      let resolvedSession = data.session ?? null;
      if (!resolvedSession) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password: pin });
        if (signInError) {
          console.error('Supabase signIn after signUp error:', signInError);
        } else {
          resolvedSession = signInData.session ?? null;
        }
      }

      if (!resolvedSession?.user) {
        setError('Cuenta creada. Revisa tu correo o intenta iniciar sesión manualmente.');
        return;
      }

      try {
        await upsertProfile({ id: resolvedSession.user.id, username: sanitizedUsername, avatar });
      } catch (profileError) {
        const message = profileError instanceof Error ? profileError.message : String(profileError);
        if (message.includes('duplicate key value') || message.includes('23505')) {
          setError('Ese nombre de usuario ya está en uso. Elige otro.');
        } else {
          setError('Cuenta creada, pero no pudimos guardar tu perfil. Intenta iniciar sesión.');
        }
      }

      if (resolvedSession?.user) {
        await fetchProfile(resolvedSession.user.id);
      }

      setSession(resolvedSession);
    },
    [clearError, fetchProfile]
  );

  const signOut = useCallback(async () => {
    clearError();
    
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('[AuthContext] Error en signOut:', error);
    }
    
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
