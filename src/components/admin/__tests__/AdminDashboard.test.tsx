import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const adminServiceState = vi.hoisted(() => ({
  listChildren: vi.fn(),
  resetChildPin: vi.fn(),
  fetchAllAttempts: vi.fn(),
  fetchChildSkillProgress: vi.fn(),
}));

const statsServiceState = vi.hoisted(() => ({
  fetchUserStats: vi.fn(),
}));

vi.mock('../../../services/adminService', () => ({
  listChildren: adminServiceState.listChildren,
  resetChildPin: adminServiceState.resetChildPin,
  fetchAllAttempts: adminServiceState.fetchAllAttempts,
  fetchChildSkillProgress: adminServiceState.fetchChildSkillProgress,
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

const child2 = {
  id: 'uuid-2',
  username: 'lucia',
  avatar: '🐰',
  createdAt: '2026-01-02T00:00:00Z',
  totalAttempts: 5,
  correctAttempts: 5,
  lastActivity: '2026-07-19T10:00:00Z',
};

const emptyMastery = { ok: true as const, progress: { skills: {}, updatedAt: null } };

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
    adminServiceState.fetchChildSkillProgress.mockResolvedValue(emptyMastery);
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

    // En el detalle: aviso completo y desglose por curso elegido
    fireEvent.click(screen.getByRole('button', { name: /nico/i }));
    expect(await screen.findByText(/reforzar divisiones/i)).toBeInTheDocument();
    const gradeCard = screen.getByText('Curso elegido: 5.º de Primaria').closest('div')!;
    expect(gradeCard).toBeInTheDocument();
    expect(within(gradeCard).getByText('Divisiones')).toBeInTheDocument();
  });

  it('muestra la evolución semanal en el detalle del niño', async () => {
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

    fireEvent.click(await screen.findByRole('button', { name: /nico/i }));

    expect(await screen.findByText(/evolución/i)).toBeInTheDocument();
  });

  it('exporta CSV con los intentos cargados', async () => {
    const attempts = [
      {
        userId: 'uuid-1',
        operation: 'division',
        grade: '5e',
        isCorrect: true,
        timeSpent: 12,
        createdAt: '2026-07-18T10:00:00Z',
      },
    ];
    adminServiceState.fetchAllAttempts.mockResolvedValue(attempts);

    const createObjectURL = vi.fn<(blob: Blob) => string>(() => 'blob:fake');
    const revokeObjectURL = vi.fn();
    Object.assign(URL, { createObjectURL, revokeObjectURL });

    renderDashboard();

    const exportButton = await screen.findByRole('button', { name: /exportar csv/i });
    await waitFor(() => expect(exportButton).toBeEnabled());

    fireEvent.click(exportButton);

    expect(createObjectURL).toHaveBeenCalled();
    const blob = createObjectURL.mock.calls[0][0] as unknown as Blob;
    expect(blob.type).toContain('text/csv');
  });

  it('muestra el dominio por habilidad del niño seleccionado (PIT-30)', async () => {
    adminServiceState.fetchChildSkillProgress.mockResolvedValue({
      ok: true,
      progress: {
        updatedAt: '2026-10-31T12:00:00Z',
        skills: {
          'sumas-restas': {
            state: 'dominated',
            recentResults: [true, true, true, true, true, true, true, true, true, true],
            streakCorrect: 0,
            streakWrong: 0,
            activeDays: ['2026-10-30', '2026-10-31'],
            reviewDueDate: '2026-12-01',
            reviewCount: 0,
            level: 3,
            updatedAt: '2026-10-31T10:00:00Z',
          },
        },
      },
    });

    renderDashboard();

    fireEvent.click(await screen.findByRole('button', { name: /nico/i }));

    expect(await screen.findByText(/Dominio por habilidad/)).toBeInTheDocument();
    expect(await screen.findByText('Dominada')).toBeInTheDocument();
    expect(adminServiceState.fetchChildSkillProgress).toHaveBeenCalledWith('uuid-1');
  });

  it('avisa claramente cuando la migración 0009 aún no está aplicada', async () => {
    adminServiceState.fetchChildSkillProgress.mockResolvedValue({
      ok: false,
      reason: 'migration-missing',
      message: 'El dominio por habilidad todavía no está disponible: falta aplicar la migración 0009 en Supabase.',
    });

    renderDashboard();

    fireEvent.click(await screen.findByRole('button', { name: /nico/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/migración 0009/);
  });

  it('ignora la respuesta tardía del niño anterior al cambiar de niño', async () => {
    adminServiceState.listChildren.mockResolvedValue([child, child2]);
    let resolveSlow: (value: unknown) => void = () => {};
    const slowPromise = new Promise((resolve) => {
      resolveSlow = resolve;
    });
    adminServiceState.fetchChildSkillProgress.mockImplementation((id: string) =>
      id === 'uuid-1' ? slowPromise : Promise.resolve(emptyMastery),
    );

    renderDashboard();

    // Abre a nico: su carga queda en vuelo.
    fireEvent.click(await screen.findByRole('button', { name: /nico/i }));
    expect(await screen.findByText('Cargando dominio por habilidad...')).toBeInTheDocument();

    // Vuelve y abre a lucia: su dominio llega primero.
    fireEvent.click(screen.getByRole('button', { name: /volver a la lista/i }));
    fireEvent.click(await screen.findByRole('button', { name: /lucia/i }));
    expect(await screen.findByText(/Dominio por habilidad/)).toBeInTheDocument();

    // La respuesta tardía de nico llega después: no debe pisar la vista de lucia.
    await act(async () => {
      resolveSlow({ ok: false, reason: 'unknown', message: 'MENSAJE_TARDIO_DE_NICO' });
      await slowPromise;
    });

    expect(screen.queryByText('MENSAJE_TARDIO_DE_NICO')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /lucia/i })).toBeInTheDocument();
    expect(screen.getByText(/Dominio por habilidad/)).toBeInTheDocument();
  });

  it('permite cerrar sesión', async () => {
    const { signOut } = renderDashboard();

    fireEvent.click(await screen.findByRole('button', { name: /cerrar sesión/i }));

    expect(signOut).toHaveBeenCalled();
  });
});
