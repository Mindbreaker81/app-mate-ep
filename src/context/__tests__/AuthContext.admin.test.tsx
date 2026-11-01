import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Session } from '@supabase/supabase-js';

type AuthCallback = (event: string, session: Session | null) => Promise<void> | void;

const supabaseState = vi.hoisted(() => {
  const state = {
    authCallback: null as AuthCallback | null,
    adminRowDelayMs: 0,
    adminRow: null as { user_id: string } | null,
    // Modelo del lock `lock:sb-<ref>-auth-token` de supabase-js: mientras el
    // emitter retiene el lock, getSession y las consultas (que piden el token)
    // esperan a que se libere.
    heldLock: null as Promise<void> | null,
  };

  const waitForLock = async () => {
    if (state.heldLock) {
      await state.heldLock;
    }
  };

  const makeChain = (table: string) => {
    const chain: Record<string, unknown> = {};
    chain.select = vi.fn(() => chain);
    chain.eq = vi.fn(() => chain);
    chain.order = vi.fn(() => chain);
    chain.maybeSingle = vi.fn(
      () =>
        new Promise((resolve) => {
          void waitForLock().then(() => {
            const data = table === 'admin_users' ? state.adminRow : null;
            setTimeout(() => resolve({ data, error: null }), state.adminRowDelayMs);
          });
        }),
    );
    return chain;
  };

  const auth = {
    getSession: vi.fn(async () => {
      await waitForLock();
      return { data: { session: null }, error: null };
    }),
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

const kidSession = {
  user: { id: 'kid-1' },
  access_token: 'token-kid',
} as unknown as Session;

/** Emite un evento como auth-js v2: retiene el lock de token mientras ejecuta
 *  el callback y no lo libera hasta que la promesa del callback resuelve. */
function emitAuthStateChange(event: string, session: Session | null) {
  const state = supabaseState.state;
  let releaseLock!: () => void;
  state.heldLock = new Promise<void>((resolve) => {
    releaseLock = resolve;
  });
  const callbackResult = state.authCallback?.(event, session);
  void Promise.resolve(callbackResult).finally(() => {
    state.heldLock = null;
    releaseLock();
  });
  return callbackResult;
}

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

  it('regresión: la sesión se resuelve aunque auth-js retenga el lock durante onAuthStateChange', async () => {
    supabaseState.state.adminRow = null; // niño, no admin
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('auth-state')).toHaveTextContent('anon'));

    // auth-js emite INITIAL_SESSION/SIGNED_IN con el lock retenido mientras el
    // callback no resuelve. Con el interbloqueo (await de supabase dentro del
    // callback) la sesión nunca llega y el niño vuelve al login tras 15 s.
    emitAuthStateChange('INITIAL_SESSION', kidSession);

    await waitFor(
      () => expect(screen.getByTestId('auth-state')).toHaveTextContent('kid'),
      { timeout: 2000 },
    );
  });
});
