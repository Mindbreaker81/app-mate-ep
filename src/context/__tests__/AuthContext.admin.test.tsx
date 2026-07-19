import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Session } from '@supabase/supabase-js';

type AuthCallback = (event: string, session: Session | null) => Promise<void> | void;

const supabaseState = vi.hoisted(() => {
  const state = {
    authCallback: null as AuthCallback | null,
    adminRowDelayMs: 0,
    adminRow: null as { user_id: string } | null,
  };

  const makeChain = (table: string) => {
    const chain: Record<string, unknown> = {};
    chain.select = vi.fn(() => chain);
    chain.eq = vi.fn(() => chain);
    chain.order = vi.fn(() => chain);
    chain.maybeSingle = vi.fn(
      () =>
        new Promise((resolve) => {
          const data = table === 'admin_users' ? state.adminRow : null;
          setTimeout(() => resolve({ data, error: null }), state.adminRowDelayMs);
        }),
    );
    return chain;
  };

  const auth = {
    getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    onAuthStateChange: vi.fn((cb: AuthCallback) => {
      state.authCallback = cb;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    }),
    signInWithPassword: vi.fn(),
    signOut: vi.fn().mockResolvedValue({ error: null }),
  };

  return {
    state,
    auth,
    from: vi.fn((table: string) => makeChain(table)),
  };
});

vi.mock('../../lib/supabaseClient', () => ({
  supabase: {
    auth: supabaseState.auth,
    from: supabaseState.from,
  },
}));

import { AuthProvider, useAuth } from '../AuthContext';

const observedStates: string[] = [];

function Probe() {
  const { session, isAdmin, loading } = useAuth();
  const current = loading ? 'loading' : session ? (isAdmin ? 'admin' : 'kid') : 'anon';
  observedStates.push(current);
  return <div data-testid="auth-state">{current}</div>;
}

const adminSession = {
  user: { id: 'admin-1' },
  access_token: 'token',
} as unknown as Session;

describe('AuthContext — resolución de isAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    observedStates.length = 0;
    supabaseState.state.adminRow = { user_id: 'admin-1' };
    supabaseState.state.adminRowDelayMs = 60;
  });

  it('nunca expone la sesión del admin como si fuera un niño mientras resuelve isAdmin', async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('auth-state')).toHaveTextContent('anon'));

    // Simula el evento SIGNED_IN tal y como lo dispara supabase-js (sin act,
    // para observar los renders intermedios igual que en un navegador real)
    void supabaseState.state.authCallback?.('SIGNED_IN', adminSession);

    await waitFor(() => expect(screen.getByTestId('auth-state')).toHaveTextContent('admin'), {
      timeout: 2000,
    });

    // Durante la ventana en que isAdmin aún se resolvía no debe haberse mostrado el juego
    expect(observedStates).not.toContain('kid');
  });
});
