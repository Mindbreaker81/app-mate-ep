import { beforeEach, describe, expect, it, vi } from 'vitest';

const supabaseState = vi.hoisted(() => {
  const rpc = vi.fn();
  return { rpc };
});

vi.mock('../../lib/supabaseClient', () => ({
  supabase: {
    rpc: supabaseState.rpc,
  },
}));

import { listChildren, resetChildPin } from '../adminService';

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
