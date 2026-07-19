import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const adminServiceState = vi.hoisted(() => ({
  listChildren: vi.fn(),
  resetChildPin: vi.fn(),
  fetchAllAttempts: vi.fn(),
}));

const statsServiceState = vi.hoisted(() => ({
  fetchUserStats: vi.fn(),
}));

vi.mock('../../../services/adminService', () => ({
  listChildren: adminServiceState.listChildren,
  resetChildPin: adminServiceState.resetChildPin,
  fetchAllAttempts: adminServiceState.fetchAllAttempts,
}));

vi.mock('../../../services/statsService', () => ({
  fetchUserStats: statsServiceState.fetchUserStats,
}));

import { AdminDashboard } from '../AdminDashboard';
import { AuthContext, type AuthContextValue } from '../../../context/AuthContext';

const child = {
  id: 'uuid-1',
  username: 'nico',
  avatar: '🦊',
  createdAt: '2026-01-01T00:00:00Z',
  totalAttempts: 20,
  correctAttempts: 15,
  lastActivity: '2026-07-18T10:00:00Z',
};

const renderDashboard = (overrides: Partial<AuthContextValue> = {}) => {
  const signOut = vi.fn();
  const changePassword = vi.fn().mockResolvedValue({ ok: true });
  const value: AuthContextValue = {
    session: null,
    profile: null,
    isAdmin: true,
    loading: false,
    error: null,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signInAdmin: vi.fn(),
    changePassword,
    signOut,
    clearError: vi.fn(),
    ...overrides,
  };
  return {
    signOut,
    changePassword,
    ...render(
      <AuthContext.Provider value={value}>
        <AdminDashboard />
      </AuthContext.Provider>
    ),
  };
};

describe('AdminDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminServiceState.listChildren.mockResolvedValue([child]);
    adminServiceState.resetChildPin.mockResolvedValue({ ok: true });
    adminServiceState.fetchAllAttempts.mockResolvedValue([]);
    statsServiceState.fetchUserStats.mockResolvedValue(null);
  });

  it('muestra la lista de niños con sus métricas', async () => {
    renderDashboard();

    expect(await screen.findByText('nico')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('resetea el PIN de un niño desde el diálogo', async () => {
    renderDashboard();

    fireEvent.click(await screen.findByRole('button', { name: /nuevo pin/i }));

    const pinInput = await screen.findByLabelText(/pin nuevo/i);
    fireEvent.change(pinInput, { target: { value: '654321' } });
    fireEvent.click(screen.getByRole('button', { name: /confirmar/i }));

    await waitFor(() => {
      expect(adminServiceState.resetChildPin).toHaveBeenCalledWith('nico', '654321');
    });
    expect(await screen.findByText(/654321/)).toBeInTheDocument();
  });

  it('valida la confirmación al cambiar la contraseña', async () => {
    const { changePassword } = renderDashboard();

    fireEvent.change(await screen.findByLabelText(/nueva contraseña/i), {
      target: { value: 'clave12345' },
    });
    fireEvent.change(screen.getByLabelText(/repite la contraseña/i), {
      target: { value: 'otra12345' },
    });
    fireEvent.click(screen.getByRole('button', { name: /cambiar contraseña/i }));

    expect(await screen.findByText(/las contraseñas no coinciden/i)).toBeInTheDocument();
    expect(changePassword).not.toHaveBeenCalled();
  });

  it('cambia la contraseña cuando los campos coinciden', async () => {
    const { changePassword } = renderDashboard();

    fireEvent.change(await screen.findByLabelText(/nueva contraseña/i), {
      target: { value: 'clave12345' },
    });
    fireEvent.change(screen.getByLabelText(/repite la contraseña/i), {
      target: { value: 'clave12345' },
    });
    fireEvent.click(screen.getByRole('button', { name: /cambiar contraseña/i }));

    await waitFor(() => {
      expect(changePassword).toHaveBeenCalledWith('clave12345');
    });
    expect(await screen.findByText(/contraseña actualizada/i)).toBeInTheDocument();
  });

  it('muestra insignias de aviso en la lista y el informe en el detalle', async () => {
    const badAttempts = Array.from({ length: 10 }, (_, i) => ({
      userId: 'uuid-1',
      operation: 'division',
      grade: '5e',
      isCorrect: i < 3,
      timeSpent: 10,
      createdAt: new Date().toISOString(),
    }));
    adminServiceState.fetchAllAttempts.mockResolvedValue(badAttempts);

    renderDashboard();

    // Insignia en la lista: 1 refuerzo
    expect(await screen.findByText('⚠️ 1')).toBeInTheDocument();

    // En el detalle: aviso completo y desglose por curso
    fireEvent.click(screen.getByRole('button', { name: /nico/i }));
    expect(await screen.findByText(/reforzar divisiones/i)).toBeInTheDocument();
    expect(screen.getByText('5.º de Primaria')).toBeInTheDocument();
    expect(screen.getByText('Divisiones')).toBeInTheDocument();
  });

  it('permite cerrar sesión', async () => {
    const { signOut } = renderDashboard();

    fireEvent.click(await screen.findByRole('button', { name: /cerrar sesión/i }));

    expect(signOut).toHaveBeenCalled();
  });
});
