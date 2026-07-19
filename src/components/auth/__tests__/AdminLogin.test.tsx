import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AdminLogin } from '../AdminLogin';
import { AuthContext, type AuthContextValue } from '../../../context/AuthContext';

const renderWithAuth = (ui: React.ReactElement, overrides: Partial<AuthContextValue> = {}) => {
  const signInAdmin = vi.fn().mockResolvedValue(undefined);
  const value: AuthContextValue = {
    session: null,
    profile: null,
    isAdmin: false,
    loading: false,
    error: null,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signInAdmin,
    changePassword: vi.fn(),
    signOut: vi.fn(),
    clearError: vi.fn(),
    ...overrides,
  };
  return {
    signInAdmin,
    ...render(
      <AuthContext.Provider value={value}>
        {ui}
      </AuthContext.Provider>
    ),
  };
};

describe('AdminLogin', () => {
  it('envía email y contraseña a signInAdmin', async () => {
    const { signInAdmin } = renderWithAuth(<AdminLogin onBack={() => undefined} />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'admin@ejemplo.com' },
    });
    fireEvent.change(screen.getByLabelText(/contraseña/i), {
      target: { value: 'supersecreta1' },
    });
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(signInAdmin).toHaveBeenCalledWith({
        email: 'admin@ejemplo.com',
        password: 'supersecreta1',
      });
    });
  });

  it('muestra el error del contexto', () => {
    renderWithAuth(<AdminLogin onBack={() => undefined} />, {
      error: 'Esta cuenta no tiene permisos de administrador.',
    });

    expect(screen.getByText('Esta cuenta no tiene permisos de administrador.')).toBeInTheDocument();
  });

  it('permite volver al acceso de niños', () => {
    const onBack = vi.fn();
    renderWithAuth(<AdminLogin onBack={onBack} />);

    fireEvent.click(screen.getByRole('button', { name: /volver/i }));

    expect(onBack).toHaveBeenCalled();
  });
});
