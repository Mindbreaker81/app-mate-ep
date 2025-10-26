import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../App';

const supabaseState = vi.hoisted(() => {
  const unsubscribe = vi.fn();
  const chain = {
    select: vi.fn(),
    eq: vi.fn(),
    maybeSingle: vi.fn(),
    upsert: vi.fn(),
    insert: vi.fn(),
    order: vi.fn(),
  };

  const auth = {
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
    signInWithPassword: vi.fn().mockResolvedValue({ data: { session: null, user: null }, error: null }),
    signUp: vi.fn().mockResolvedValue({ data: { user: { id: 'mock-user' }, session: null }, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
  };

  const from = vi.fn().mockImplementation(() => chain);

  return { unsubscribe, chain, auth, from };
});

vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    auth: supabaseState.auth,
    from: supabaseState.from,
  },
}));

describe('App smoke test', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    supabaseState.from.mockImplementation(() => supabaseState.chain);
    supabaseState.chain.select.mockReturnValue(supabaseState.chain);
    supabaseState.chain.eq.mockReturnValue(supabaseState.chain);
    supabaseState.chain.order.mockReturnValue(supabaseState.chain);
    supabaseState.chain.maybeSingle.mockResolvedValue({ data: null, error: null });
    supabaseState.chain.upsert.mockResolvedValue({ error: null });
    supabaseState.chain.insert.mockResolvedValue({ error: null });

    supabaseState.auth.getSession.mockResolvedValue({ data: { session: null } });
    supabaseState.auth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: supabaseState.unsubscribe } } });
  });

  it('renders authentication gate when no session is present', async () => {
    render(<App />);

    await waitFor(() => {
      expect(supabaseState.auth.getSession).toHaveBeenCalled();
    });

    expect(await screen.findByText(/Bienvenido a Pitágoritas/i)).toBeInTheDocument();
  });
});
