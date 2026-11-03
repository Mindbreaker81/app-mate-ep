import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AdminLogin } from '../AdminLogin';
import { AuthContext, type AuthContextValue } from '../../../context/AuthContext';

const renderWithAuth = (ui: React.ReactElement, overrides: Partial<AuthContextValue> = {}) => {
  const signInAdmin = vi.fn().mockResolvedValue(undefined);
  const requestPasswordReset = vi.fn().mockResolvedValue({ ok: true });
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
    requestPasswordReset,
    passwordRecovery: false,
    finishPasswordRecovery: vi.fn(),
    signOut: vi.fn(),
    clearError: vi.fn(),
    ...overrides,
  };
  return {
    signInAdmin,
    requestPasswordReset: value.requestPasswordReset as typeof requestPasswordReset,
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

  it('«¿Olvidaste tu contraseña?» envía el enlace al email escrito', async () => {
    const { requestPasswordReset } = renderWithAuth(<AdminLogin onBack={() => undefined} />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'admin@ejemplo.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /olvidaste tu contraseña/i }));

    await waitFor(() => {
      expect(requestPasswordReset).toHaveBeenCalledWith('admin@ejemplo.com');
    });
    expect(await screen.findByText(/te hemos enviado un enlace/i)).toBeInTheDocument();
  });

  it('pide escribir el email antes de enviar el enlace', () => {
    const { requestPasswordReset } = renderWithAuth(<AdminLogin onBack={() => undefined} />);

    fireEvent.click(screen.getByRole('button', { name: /olvidaste tu contraseña/i }));

    expect(requestPasswordReset).not.toHaveBeenCalled();
    expect(screen.getByText(/escribe tu email/i)).toBeInTheDocument();
  });

  it('muestra el error si no se pudo enviar el enlace', async () => {
    renderWithAuth(<AdminLogin onBack={() => undefined} />, {
      requestPasswordReset: vi.fn().mockResolvedValue({ ok: false, error: 'Demasiados intentos.' }),
    });

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'admin@ejemplo.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /olvidaste tu contraseña/i }));

    expect(await screen.findByText('Demasiados intentos.')).toBeInTheDocument();
  });
});
