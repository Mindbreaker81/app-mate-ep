import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import type { Session } from '@supabase/supabase-js';
import { AuthGate } from '../AuthGate';
import { AuthContext, type AuthContextValue } from '../../../context/AuthContext';

vi.mock('../../admin/AdminDashboard', () => ({
  AdminDashboard: () => <div>Panel admin</div>,
}));

const session = { user: { id: 'admin-1' }, access_token: 't' } as unknown as Session;

function renderGate(overrides: Partial<AuthContextValue>) {
  const value: AuthContextValue = {
    session,
    profile: null,
    isAdmin: true,
    loading: false,
    error: null,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signInAdmin: vi.fn(),
    changePassword: vi.fn().mockResolvedValue({ ok: true }),
    requestPasswordReset: vi.fn(),
    passwordRecovery: false,
    finishPasswordRecovery: vi.fn(),
    signOut: vi.fn(),
    clearError: vi.fn(),
    ...overrides,
  };
  render(
    <AuthContext.Provider value={value}>
      <AuthGate>
        <div>Juego</div>
      </AuthGate>
    </AuthContext.Provider>,
  );
  return value;
}

describe('AuthGate — recuperación de contraseña', () => {
  it('tras el enlace del email pide la nueva contraseña antes del panel', async () => {
    const value = renderGate({ passwordRecovery: true });

    expect(screen.getByRole('heading', { name: /nueva contraseña/i })).toBeInTheDocument();
    expect(screen.queryByText('Panel admin')).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Nueva contraseña'), { target: { value: 'otraClave123' } });
    fireEvent.change(screen.getByLabelText(/repite/i), { target: { value: 'otraClave123' } });
    fireEvent.click(screen.getByRole('button', { name: /cambiar contraseña/i }));

    await waitFor(() => expect(value.changePassword).toHaveBeenCalledWith('otraClave123'));
    await waitFor(() => expect(value.finishPasswordRecovery).toHaveBeenCalled());
  });

  it('sin recuperación en curso muestra el panel', () => {
    renderGate({ passwordRecovery: false });

    expect(screen.getByText('Panel admin')).toBeInTheDocument();
  });
});
