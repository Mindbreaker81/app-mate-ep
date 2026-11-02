import { beforeEach, describe, expect, it, vi } from 'vitest';

const supabaseState = vi.hoisted(() => {
  const rpc = vi.fn();
  const select = vi.fn();
  const from = vi.fn(() => ({ select }));
  return { rpc, from, select };
});

vi.mock('../../lib/supabaseClient', () => ({
  supabase: {
    rpc: supabaseState.rpc,
    from: supabaseState.from,
  },
}));

import { fetchAllAttempts, fetchChildSkillProgress, listChildren, resetChildPin } from '../adminService';

describe('adminService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listChildren', () => {
    it('mapea las filas del RPC a camelCase', async () => {
      supabaseState.rpc.mockResolvedValue({
        data: [
          {
            id: 'uuid-1',
            username: 'nico',
            avatar: '🦊',
            created_at: '2026-01-01T00:00:00Z',
            total_attempts: 20,
            correct_attempts: 15,
            last_activity: '2026-07-18T10:00:00Z',
          },
        ],
        error: null,
      });

      const result = await listChildren();

      expect(supabaseState.rpc).toHaveBeenCalledWith('admin_list_children');
      expect(result).toEqual([
        {
          id: 'uuid-1',
          username: 'nico',
          avatar: '🦊',
          createdAt: '2026-01-01T00:00:00Z',
          totalAttempts: 20,
          correctAttempts: 15,
          lastActivity: '2026-07-18T10:00:00Z',
        },
      ]);
    });

    it('devuelve null si el RPC falla', async () => {
      supabaseState.rpc.mockResolvedValue({ data: null, error: { message: 'boom' } });

      expect(await listChildren()).toBeNull();
    });
  });

  describe('fetchAllAttempts', () => {
    it('mapea los intentos a camelCase con su procedencia', async () => {
      supabaseState.select.mockResolvedValue({
        data: [
          {
            user_id: 'uuid-1',
            operation: 'division',
            grade: '5e',
            is_correct: false,
            time_spent: 12,
            created_at: '2026-07-18T10:00:00Z',
            source: 'daily-session',
          },
          {
            user_id: 'uuid-1',
            operation: 'addition',
            grade: '4t',
            is_correct: true,
            time_spent: 5,
            created_at: '2026-07-18T11:00:00Z',
            // Fila antigua sin source → 'free'
          },
        ],
        error: null,
      });

      const result = await fetchAllAttempts();

      expect(supabaseState.from).toHaveBeenCalledWith('attempts');
      expect(supabaseState.select).toHaveBeenCalledWith(
        expect.stringContaining('source'),
      );
      expect(result).toEqual([
        {
          userId: 'uuid-1',
          operation: 'division',
          grade: '5e',
          isCorrect: false,
          timeSpent: 12,
          createdAt: '2026-07-18T10:00:00Z',
          source: 'daily-session',
        },
        {
          userId: 'uuid-1',
          operation: 'addition',
          grade: '4t',
          isCorrect: true,
          timeSpent: 5,
          createdAt: '2026-07-18T11:00:00Z',
          source: 'free',
        },
      ]);
    });

    it('devuelve null si la consulta falla', async () => {
      supabaseState.select.mockResolvedValue({ data: null, error: { message: 'boom' } });
      expect(await fetchAllAttempts()).toBeNull();
    });
  });

  describe('fetchChildSkillProgress', () => {
    const skillProgress = {
      'sumas-restas': {
        state: 'dominated',
        recentResults: [true, true],
        streakCorrect: 0,
        streakWrong: 0,
        activeDays: ['2026-10-30', '2026-10-31'],
        reviewDueDate: '2026-11-05',
        reviewCount: 0,
        level: 3,
        updatedAt: '2026-10-31T10:00:00Z',
      },
    };

    it('llama al RPC con el id del niño y devuelve skills y updatedAt', async () => {
      supabaseState.rpc.mockResolvedValue({
        data: [{ skills: skillProgress, updated_at: '2026-10-31T12:00:00Z' }],
        error: null,
      });

      const result = await fetchChildSkillProgress('uuid-1');

      expect(supabaseState.rpc).toHaveBeenCalledWith('admin_get_skill_progress', {
        target_user_id: 'uuid-1',
      });
      expect(result).toEqual({
        ok: true,
        progress: { skills: skillProgress, updatedAt: '2026-10-31T12:00:00Z' },
      });
    });

    it('devuelve skills vacías cuando el niño aún no tiene fila en game_state', async () => {
      supabaseState.rpc.mockResolvedValue({ data: [], error: null });

      const result = await fetchChildSkillProgress('uuid-1');

      expect(result).toEqual({ ok: true, progress: { skills: {}, updatedAt: null } });
    });

    it('devuelve skills vacías cuando la fila no tiene progreso guardado', async () => {
      supabaseState.rpc.mockResolvedValue({
        data: [{ skills: null, updated_at: '2026-10-31T12:00:00Z' }],
        error: null,
      });

      const result = await fetchChildSkillProgress('uuid-1');

      expect(result).toEqual({ ok: true, progress: { skills: {}, updatedAt: '2026-10-31T12:00:00Z' } });
    });

    it('descarta entradas de skills malformadas', async () => {
      supabaseState.rpc.mockResolvedValue({
        data: [
          {
            skills: { ...skillProgress, 'entrada-rota': 'no-es-un-objeto', 'sin-ventana': { state: 'practicing' } },
            updated_at: '2026-10-31T12:00:00Z',
          },
        ],
        error: null,
      });

      const result = await fetchChildSkillProgress('uuid-1');

      expect(result).toEqual({
        ok: true,
        progress: { skills: skillProgress, updatedAt: '2026-10-31T12:00:00Z' },
      });
    });

    it('detecta la migración 0009 no aplicada (función ausente en PostgREST)', async () => {
      supabaseState.rpc.mockResolvedValue({
        data: null,
        error: {
          code: 'PGRST202',
          message:
            'Could not find the function public.admin_get_skill_progress(target_user_id) in the schema cache',
        },
      });

      const result = await fetchChildSkillProgress('uuid-1');

      expect(result).toEqual({
        ok: false,
        reason: 'migration-missing',
        message: expect.stringContaining('migración 0009'),
      });
    });

    it('detecta la función ausente en Postgres (42883)', async () => {
      supabaseState.rpc.mockResolvedValue({
        data: null,
        error: { code: '42883', message: 'function public.admin_get_skill_progress(uuid) does not exist' },
      });

      const result = await fetchChildSkillProgress('uuid-1');

      expect(result).toEqual({ ok: false, reason: 'migration-missing', message: expect.any(String) });
    });

    it('mapea not_admin a sin permisos', async () => {
      supabaseState.rpc.mockResolvedValue({ data: null, error: { code: 'P0001', message: 'not_admin' } });

      const result = await fetchChildSkillProgress('uuid-1');

      expect(result).toEqual({
        ok: false,
        reason: 'not-authorized',
        message: 'No tienes permisos de administrador.',
      });
    });

    it('mapea permiso denegado (42501) a sin permisos', async () => {
      supabaseState.rpc.mockResolvedValue({
        data: null,
        error: { code: '42501', message: 'permission denied for function admin_get_skill_progress' },
      });

      const result = await fetchChildSkillProgress('uuid-1');

      expect(result).toEqual({ ok: false, reason: 'not-authorized', message: expect.any(String) });
    });

    it('mapea user_not_found a niño no encontrado', async () => {
      supabaseState.rpc.mockResolvedValue({ data: null, error: { code: 'P0001', message: 'user_not_found' } });

      const result = await fetchChildSkillProgress('uuid-1');

      expect(result).toEqual({
        ok: false,
        reason: 'child-not-found',
        message: 'Este niño ya no existe o no es una cuenta de niño.',
      });
    });

    it('devuelve un mensaje genérico ante errores desconocidos', async () => {
      supabaseState.rpc.mockResolvedValue({ data: null, error: { message: 'network down' } });

      const result = await fetchChildSkillProgress('uuid-1');

      expect(result).toEqual({
        ok: false,
        reason: 'unknown',
        message: 'No pudimos cargar el dominio de este niño. Inténtalo de nuevo.',
      });
    });
  });

  describe('resetChildPin', () => {
    it('invoca el RPC con username y pin', async () => {
      supabaseState.rpc.mockResolvedValue({ data: null, error: null });

      const result = await resetChildPin('Nico', '123456');

      expect(supabaseState.rpc).toHaveBeenCalledWith('admin_reset_pin', {
        target_username: 'Nico',
        new_pin: '123456',
      });
      expect(result).toEqual({ ok: true });
    });

    it('rechaza un PIN mal formado sin llamar al RPC', async () => {
      const result = await resetChildPin('nico', '12ab');

      expect(supabaseState.rpc).not.toHaveBeenCalled();
      expect(result).toEqual({ ok: false, error: 'El PIN debe contener exactamente 6 dígitos.' });
    });

    it('traduce user_not_found a un mensaje en español', async () => {
      supabaseState.rpc.mockResolvedValue({ data: null, error: { message: 'user_not_found' } });

      const result = await resetChildPin('nadie', '123456');

      expect(result).toEqual({ ok: false, error: 'No encontramos ningún niño con ese nombre de usuario.' });
    });

    it('traduce not_admin a un mensaje en español', async () => {
      supabaseState.rpc.mockResolvedValue({ data: null, error: { message: 'not_admin' } });

      const result = await resetChildPin('nico', '123456');

      expect(result).toEqual({ ok: false, error: 'No tienes permisos de administrador.' });
    });

    it('devuelve un mensaje genérico ante errores desconocidos', async () => {
      supabaseState.rpc.mockResolvedValue({ data: null, error: { message: 'network down' } });

      const result = await resetChildPin('nico', '123456');

      expect(result).toEqual({ ok: false, error: 'No pudimos resetear el PIN. Intenta de nuevo.' });
    });
  });
});
