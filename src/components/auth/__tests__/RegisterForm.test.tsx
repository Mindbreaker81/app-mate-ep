import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RegisterForm } from '../RegisterForm';
import { AuthContext, type AuthContextValue } from '../../../context/AuthContext';

const renderWithAuth = (ui: React.ReactElement, overrides: Partial<AuthContextValue> = {}) => {
  const value: AuthContextValue = {
    session: null,
    profile: null,
    loading: false,
    error: null,
    signIn: vi.fn(),
    signUp: vi.fn().mockResolvedValue(undefined),
    signOut: vi.fn(),
    clearError: vi.fn(),
    ...overrides,
  };

  const view = render(<AuthContext.Provider value={value}>{ui}</AuthContext.Provider>);
  return { ...view, value };
};

describe('RegisterForm', () => {
  it('shows error when PIN confirmation mismatches', async () => {
    renderWithAuth(<RegisterForm onSwitch={() => undefined} />);

    fireEvent.change(screen.getByLabelText(/nombre de usuario/i), { target: { value: 'usuario' } });
    fireEvent.change(screen.getByLabelText(/^PIN/), { target: { value: '123456' } });
    fireEvent.change(screen.getByLabelText(/Confirma tu PIN/i), { target: { value: '654321' } });

    fireEvent.click(screen.getByRole('button', { name: /crear mi perfil/i }));

    await waitFor(() => {
      expect(screen.getByText(/deben coincidir/i)).toBeInTheDocument();
    });
  });

  it('calls signUp with sanitized data when valid', async () => {
    const signUp = vi.fn().mockResolvedValue(undefined);
    renderWithAuth(<RegisterForm onSwitch={() => undefined} />, { signUp });

    fireEvent.change(screen.getByLabelText(/nombre de usuario/i), { target: { value: 'Usuario' } });
    const pinInput = screen.getByLabelText(/^PIN/);
    fireEvent.change(pinInput, { target: { value: '123456' } });
    fireEvent.change(screen.getByLabelText(/Confirma tu PIN/i), { target: { value: '123456' } });

    fireEvent.click(screen.getByRole('button', { name: /crear mi perfil/i }));

    await waitFor(() => {
      expect(signUp).toHaveBeenCalledWith({ username: 'Usuario', pin: '123456', avatar: expect.any(String) });
    });
  });
});
