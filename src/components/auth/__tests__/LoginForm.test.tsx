import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LoginForm } from '../LoginForm';
import { AuthContext, type AuthContextValue } from '../../../context/AuthContext';

const renderWithAuth = (ui: React.ReactElement) => {
  const signIn = vi.fn().mockResolvedValue(undefined);
  const value: AuthContextValue = {
    session: null,
    profile: null,
    loading: false,
    error: null,
    signIn,
    signUp: vi.fn(),
    signOut: vi.fn(),
    clearError: vi.fn(),
  };
  return {
    signIn,
    ...render(
      <AuthContext.Provider value={value}>
        {ui}
      </AuthContext.Provider>
    ),
  };
};

describe('LoginForm', () => {
  it('trims PIN input to six digits and calls signIn', async () => {
    const { signIn } = renderWithAuth(<LoginForm onSwitch={() => undefined} />);

    const usernameInput = screen.getByLabelText(/nombre de usuario/i);
    const pinInput = screen.getByLabelText(/pin/i);
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

    fireEvent.change(usernameInput, { target: { value: 'usuario' } });
    fireEvent.change(pinInput, { target: { value: '1234567' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith({ username: 'usuario', pin: '123456' });
    });
  });
});
