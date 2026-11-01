import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearDailySession,
  dailySessionStorageKey,
  loadDailySession,
  parseDailySession,
  saveDailySession,
  serializeDailySession,
} from '../dailySessionStorage';

const TODAY = '2026-11-01';

const sampleSession = {
  date: TODAY,
  skillId: 'sumas-restas',
  queue: ['division-con-resto', 'multiplicacion-division'],
  done: 3,
};

describe('dailySessionStorage: serialización y validación', () => {
  it('serializa y parsea una sesión válida (ida y vuelta)', () => {
    const parsed = parseDailySession(JSON.parse(serializeDailySession(sampleSession)), TODAY);
    expect(parsed).toEqual(sampleSession);
  });

  it('acepta cola vacía con habilidad en curso (último ejercicio de la sesión)', () => {
    const session = { ...sampleSession, queue: [], done: 9 };
    expect(parseDailySession(session, TODAY)).toEqual(session);
  });

  it('acepta skillId null cuando queda cola pendiente', () => {
    const session = { ...sampleSession, skillId: null };
    expect(parseDailySession(session, TODAY)).toEqual(session);
  });

  it('rechaza lo que no es un objeto', () => {
    expect(parseDailySession(null, TODAY)).toBeNull();
    expect(parseDailySession('texto', TODAY)).toBeNull();
    expect(parseDailySession(42, TODAY)).toBeNull();
    expect(parseDailySession([], TODAY)).toBeNull();
  });

  it('rechaza una sesión de otro día', () => {
    expect(parseDailySession({ ...sampleSession, date: '2026-10-31' }, TODAY)).toBeNull();
    expect(parseDailySession({ ...sampleSession, date: 123 }, TODAY)).toBeNull();
    expect(parseDailySession({ ...sampleSession, date: undefined }, TODAY)).toBeNull();
  });

  it('rechaza habilidades que ya no existen en el catálogo', () => {
    expect(parseDailySession({ ...sampleSession, skillId: 'skill-inventada' }, TODAY)).toBeNull();
    expect(
      parseDailySession({ ...sampleSession, queue: ['sumas-restas', 'skill-inventada'] }, TODAY),
    ).toBeNull();
  });

  it('rechaza una cola que no sea un array de strings', () => {
    expect(parseDailySession({ ...sampleSession, queue: 'sumas-restas' }, TODAY)).toBeNull();
    expect(parseDailySession({ ...sampleSession, queue: [5, null] }, TODAY)).toBeNull();
    expect(parseDailySession({ ...sampleSession, queue: undefined }, TODAY)).toBeNull();
  });

  it('rechaza un contador corrupto', () => {
    expect(parseDailySession({ ...sampleSession, done: -1 }, TODAY)).toBeNull();
    expect(parseDailySession({ ...sampleSession, done: 1.5 }, TODAY)).toBeNull();
    expect(parseDailySession({ ...sampleSession, done: '3' }, TODAY)).toBeNull();
    expect(parseDailySession({ ...sampleSession, done: undefined }, TODAY)).toBeNull();
  });

  it('acepta la sesión completada de hoy: se sigue mostrando completada tras recargar', () => {
    const completed = { date: TODAY, skillId: null, queue: [], done: 10 };
    expect(parseDailySession(completed, TODAY)).toEqual(completed);
  });

  it('sigue descartando una sesión sin cola ni habilidad que no está completa', () => {
    expect(parseDailySession({ date: TODAY, skillId: null, queue: [], done: 2 }, TODAY)).toBeNull();
    expect(parseDailySession({ date: TODAY, skillId: null, queue: [], done: 9 }, TODAY)).toBeNull();
  });
});

describe('dailySessionStorage: localStorage por usuario', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('la clave incluye el userId (aislamiento entre niños del mismo dispositivo)', () => {
    expect(dailySessionStorageKey('user-a')).not.toBe(dailySessionStorageKey('user-b'));
    expect(dailySessionStorageKey('user-a')).toContain('user-a');
  });

  it('guarda y recupera la sesión del día', () => {
    saveDailySession('user-a', sampleSession);
    expect(loadDailySession('user-a', TODAY)).toEqual(sampleSession);
    // Otro usuario no ve la sesión.
    expect(loadDailySession('user-b', TODAY)).toBeNull();
  });

  it('devuelve null si no hay nada guardado', () => {
    expect(loadDailySession('user-a', TODAY)).toBeNull();
  });

  it('descarta y borra una sesión caducada (de otro día)', () => {
    saveDailySession('user-a', { ...sampleSession, date: '2026-10-31' });
    expect(loadDailySession('user-a', TODAY)).toBeNull();
    expect(window.localStorage.getItem(dailySessionStorageKey('user-a'))).toBeNull();
  });

  it('descarta y borra datos corruptos (JSON inválido)', () => {
    window.localStorage.setItem(dailySessionStorageKey('user-a'), '{no es json');
    expect(loadDailySession('user-a', TODAY)).toBeNull();
    expect(window.localStorage.getItem(dailySessionStorageKey('user-a'))).toBeNull();
  });

  it('descarta y borra datos con forma inválida (p. ej. de una versión vieja)', () => {
    window.localStorage.setItem(
      dailySessionStorageKey('user-a'),
      JSON.stringify({ skillId: 'sumas-restas' }),
    );
    expect(loadDailySession('user-a', TODAY)).toBeNull();
    expect(window.localStorage.getItem(dailySessionStorageKey('user-a'))).toBeNull();
  });

  it('clearDailySession elimina la clave', () => {
    saveDailySession('user-a', sampleSession);
    clearDailySession('user-a');
    expect(window.localStorage.getItem(dailySessionStorageKey('user-a'))).toBeNull();
  });

  it('la sesión completada de hoy sobrevive a la recarga (ida y vuelta por localStorage)', () => {
    const completed = { date: TODAY, skillId: null, queue: [], done: 10 };
    saveDailySession('user-a', completed);
    expect(loadDailySession('user-a', TODAY)).toEqual(completed);
    // Al día siguiente ya no cuenta: caduca como cualquier otra.
    expect(loadDailySession('user-a', '2026-11-02')).toBeNull();
    expect(window.localStorage.getItem(dailySessionStorageKey('user-a'))).toBeNull();
  });
});
