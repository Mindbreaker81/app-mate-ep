# Mejoras UX y Contenido (13 sugerencias) — Plan de implementación

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Aplicar las 13 mejoras identificadas en la revisión: persistencia por usuario en Supabase, negativos en móvil, celebraciones, fluidez de teclado, seguridad del botón reiniciar, inputs táctiles, meta diaria, práctica recomendada, más problemas verbales, subtítulo, evolución semanal en admin y export CSV.

**Architecture:** SPA Vite + React 19 + TypeScript + Tailwind, datos en Supabase cloud (`sezqtlebdodwwbekgnlw`). El estado de juego (logros, récords) pasa de localStorage global a una tabla `game_state` (jsonb por usuario) con caché local por-usuario. Las mejoras de UI viven en `Exercise.tsx`, `Home.tsx`, `PracticeModes.tsx` y `admin/`. La práctica recomendada reutiliza `buildChildReport` sobre los intentos propios del niño.

**Tech Stack:** React 19, Vitest + Testing Library, canvas-confetti (nuevo dep), Supabase JS, psql (Session pooler) para migraciones.

**Reglas de ejecución (pedidas por el usuario):**
- TDD en cada tarea (test primero, verlo fallar, implementar, verlo pasar).
- **Un commit al final de cada fase** (no por tarea).
- **NO hacer `git push` hasta la Fase 9**, tras verificación completa (tests + typecheck + lint + build + smoke manual).
- Trabajar en `main` directamente (el push final dispara el deploy de Vercel).

**Comandos de verificación del repo:**
- Tests: `npm test -- run` (o un archivo: `npm test -- run src/utils/__tests__/foo.test.ts`)
- Typecheck: `npm run typecheck`
- Lint: `npm run lint`
- Build: `npm run build`

**Acceso a BD (migraciones):** psql con Session pooler:
`psql "postgresql://postgres.sezqtlebdodwwbekgnlw:<PASSWORD>@aws-1-us-east-1.pooler.supabase.com:5432/postgres"`
(la contraseña la tiene el usuario; si fue rotada, pedírsela).

---

## Fase 1 — Persistencia del estado de juego por usuario (#1)

**Problema:** `maxScore`, `bestStreak`, `totalExercises`, `correctExercises`, `timedCorrectExercises` y `achievements` viven en claves localStorage **globales** (`GameContext.tsx:38-49`): se mezclan entre hermanos en el mismo dispositivo y no siguen al niño entre dispositivos.

**Diseño:**
- Nueva tabla `public.game_state` (`user_id uuid pk`, `data jsonb`, `updated_at`), RLS "solo tu fila".
- Nuevo servicio `gameStateService.ts` con `loadGameState` / `saveGameState` (upsert).
- `GameContext`: nueva acción `HYDRATE_PERSISTED`. Al iniciar sesión: cargar remoto; si no existe fila remota, sembrarla con el estado local actual (migración de logros existentes). Persistencia continua: el efecto debounced existente además de localStorage guarda en Supabase (debounce 2 s).
- Claves localStorage por usuario: una sola clave JSON `pitagoritas:gameState:<userId>` como caché. Las claves legacy se siguen leyendo al arrancar como fallback (para la siembra inicial).

### Task 1.1: Migración SQL `0007_game_state.sql`

**Files:**
- Create: `supabase/migrations/0007_game_state.sql`

**Step 1: Escribir la migración**

```sql
-- 0007: estado de juego por usuario (logros, récords) sincronizado entre dispositivos
create table if not exists public.game_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.game_state enable row level security;

create policy "game_state own" on public.game_state
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update, delete on public.game_state to authenticated;
revoke all on public.game_state from anon;
```

**Step 2: Aplicar a Supabase cloud y verificar**

```bash
psql "$SUPABASE_URL" -f supabase/migrations/0007_game_state.sql
psql "$SUPABASE_URL" -c "\d public.game_state" -c "select policyname from pg_policies where tablename='game_state';"
```
Expected: tabla creada, policy `game_state own` listada.

**Step 3: Documentar en `DATABASE_MIGRATION.md`** — añadir sección v3.2 con el comando de aplicación (mismo formato que v3.1).

### Task 1.2: `gameStateService` (TDD)

**Files:**
- Create: `src/services/gameStateService.ts`
- Test: `src/services/__tests__/gameStateService.test.ts`

**Step 1: Test que falla** (mock de supabase con `vi.hoisted`, mismo patrón que `adminService.test.ts`):

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';

const supabaseState = vi.hoisted(() => {
  const maybeSingle = vi.fn();
  const eq = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq }));
  const upsert = vi.fn();
  const from = vi.fn(() => ({ select, upsert }));
  return { from, select, eq, maybeSingle, upsert };
});

vi.mock('../../lib/supabaseClient', () => ({
  supabase: { from: supabaseState.from },
}));

import { loadGameState, saveGameState, type PersistedGameState } from '../gameStateService';

const sample: PersistedGameState = {
  maxScore: 12,
  bestStreak: 7,
  totalExercises: 40,
  correctExercises: 30,
  timedCorrectExercises: 5,
  achievements: [],
};

describe('gameStateService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('carga el estado remoto del usuario', async () => {
    supabaseState.maybeSingle.mockResolvedValue({ data: { data: sample }, error: null });
    expect(await loadGameState('uuid-1')).toEqual(sample);
    expect(supabaseState.from).toHaveBeenCalledWith('game_state');
    expect(supabaseState.eq).toHaveBeenCalledWith('user_id', 'uuid-1');
  });

  it('devuelve null si no hay fila', async () => {
    supabaseState.maybeSingle.mockResolvedValue({ data: null, error: null });
    expect(await loadGameState('uuid-1')).toBeNull();
  });

  it('devuelve null si hay error (sin lanzar)', async () => {
    supabaseState.maybeSingle.mockResolvedValue({ data: null, error: { message: 'boom' } });
    expect(await loadGameState('uuid-1')).toBeNull();
  });

  it('guarda con upsert', async () => {
    supabaseState.upsert.mockResolvedValue({ error: null });
    expect(await saveGameState('uuid-1', sample)).toBe(true);
    expect(supabaseState.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'uuid-1', data: sample }),
      { onConflict: 'user_id' },
    );
  });
});
```

**Step 2:** `npm test -- run src/services/__tests__/gameStateService.test.ts` → FAIL (módulo no existe).

**Step 3: Implementación mínima**

```ts
import { supabase } from '../lib/supabaseClient';
import type { Achievement } from '../types';
import { logger } from '../utils/logger';

export interface PersistedGameState {
  maxScore: number;
  bestStreak: number;
  totalExercises: number;
  correctExercises: number;
  timedCorrectExercises: number;
  achievements: Achievement[];
}

export async function loadGameState(userId: string): Promise<PersistedGameState | null> {
  const { data, error } = await supabase
    .from('game_state')
    .select('data')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    logger.error('[gameStateService] Error al cargar estado:', error);
    return null;
  }
  return (data?.data as PersistedGameState) ?? null;
}

export async function saveGameState(userId: string, state: PersistedGameState): Promise<boolean> {
  const { error } = await supabase
    .from('game_state')
    .upsert({ user_id: userId, data: state, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
  if (error) {
    logger.error('[gameStateService] Error al guardar estado:', error);
    return false;
  }
  return true;
}
```

**Step 4:** volver a correr el test → PASS.

### Task 1.3: `HYDRATE_PERSISTED` en el reducer (TDD)

**Files:**
- Modify: `src/types/index.ts` (añadir la acción a `GameAction`)
- Modify: `src/context/GameContext.tsx`
- Test: `src/context/__tests__/GameContext.hydrate.test.tsx`

**Step 1: Test que falla.** Render con un AuthContext mockeado con sesión de `uuid-1`; mock de `gameStateService.loadGameState` que devuelve `{maxScore: 99, bestStreak: 9, ...}` y de `statsService.fetchUserStats` (null). Asertar con un componente sonda que `state.maxScore === 99` y `state.bestStreak === 9` tras el login (waitFor). Añadir caso: si `loadGameState` devuelve null, se llama a `saveGameState` con el estado local actual (siembra).

**Step 2:** correr → FAIL.

**Step 3: Implementar.**
- En `GameAction`: `{ type: 'HYDRATE_PERSISTED'; payload: PersistedGameState }`.
- Reducer: fusionar con `Math.max` para contadores (nunca perder progreso local no sincronizado) y unión de achievements por `id`:

```ts
case 'HYDRATE_PERSISTED': {
  const p = action.payload;
  const mergedAchievements = [...state.achievements];
  for (const remote of p.achievements) {
    if (!mergedAchievements.some((a) => a.id === remote.id)) mergedAchievements.push(remote);
  }
  return {
    ...state,
    maxScore: Math.max(state.maxScore, p.maxScore),
    bestStreak: Math.max(state.bestStreak, p.bestStreak),
    totalExercises: Math.max(state.totalExercises, p.totalExercises),
    correctExercises: Math.max(state.correctExercises, p.correctExercises),
    timedCorrectExercises: Math.max(state.timedCorrectExercises, p.timedCorrectExercises),
    achievements: mergedAchievements,
  };
}
```
- En el efecto `sync` existente (tras `fetchUserStats`): `const remote = await loadGameState(userId); if (remote) dispatch({type:'HYDRATE_PERSISTED', payload: remote}); else void saveGameState(userId, snapshotPersisted());`

**Step 4:** test → PASS. Correr también la suite entera de GameContext existente: `npm test -- run src/context` → sin regresiones.

### Task 1.4: Escritura continua por usuario

**Files:**
- Modify: `src/context/GameContext.tsx` (efecto de persistencia, líneas ~596-628)

**Step 1:** Ampliar el efecto debounced existente: además de las claves legacy, si hay `sessionUserId`:
- guardar caché JSON local: `localStorage.setItem('pitagoritas:gameState:' + userId, JSON.stringify(persisted))`
- guardar remoto con debounce más largo (2000 ms, `setTimeout` separado) vía `saveGameState`.

`persisted` se construye con un helper `toPersistedGameState(state)` (exportable para tests).

**Step 2:** Test: en el test de hidratación, tras simular un `CHECK_ANSWER` correcto, `waitFor` a que `saveGameState` haya sido llamado con `totalExercises` incrementado (usar `vi.useFakeTimers` + `advanceTimersByTime(2500)`).

**Step 3:** Suite completa de context + typecheck → PASS.

### Task 1.5: Commit de fase

```bash
npm test -- run && npm run typecheck && npm run lint
git add -A && git commit -m "feat: estado de juego (logros y récords) por usuario sincronizado en Supabase"
```

---

## Fase 2 — Respuestas negativas en móvil (#2)

**Problema:** `inputMode="numeric"` no ofrece tecla «−» en iOS; los ejercicios de enteros de 6.º son irresolubles en móvil.

**Diseño:** botón `±` junto al input cuando el problema admite respuesta negativa. Alterna el signo de `userAnswer`.

### Task 2.1: Helper `allowsNegativeAnswer` (TDD)

**Files:**
- Modify: `src/utils/problemUtils.ts`
- Test: `src/utils/__tests__/problemUtils.negative.test.ts`

**Step 1: Test que falla:** `allowsNegativeAnswer(problem)` devuelve `true` para operaciones `integer-addition`, `integer-subtraction`, `integer-multiplication`, `integer-division` y `simple-equation`; `false` para `addition`, `fraction-addition`, etc.

**Step 2:** FAIL → **Step 3:** implementar con una lista de prefijos/claves. **Step 4:** PASS.

### Task 2.2: Botón ± en `PromptInput`/`NumericInput` (TDD)

**Files:**
- Modify: `src/components/Exercise.tsx`
- Test: `src/components/__tests__/Exercise.negative.test.tsx`

**Step 1: Test que falla:** render de `Exercise` con GameContext real forzando un problema de `integer-addition` (usar `setPracticeMode('integers')` con grade 6e, o mockear `generateProblem`). Asertar: existe botón accesible `Cambiar signo`; tras teclear `5` y pulsarlo, el input vale `-5`; pulsarlo otra vez → `5`. Con un problema de sumas normales el botón NO aparece.

**Step 2:** FAIL → **Step 3:** en `PromptInput` y `NumericInput` añadir prop `allowNegative`; renderizar:

```tsx
{allowNegative && (
  <button
    type="button"
    aria-label="Cambiar signo"
    onClick={() => setAnswer(typeof userAnswer === 'string' && userAnswer.startsWith('-') ? userAnswer.slice(1) : `-${typeof userAnswer === 'string' ? userAnswer : ''}`)}
    className="h-12 w-12 rounded-lg border-2 border-blue-400 text-xl font-bold text-blue-700"
  >
    ±
  </button>
)}
```
Pasar `allowNegative={allowsNegativeAnswer(currentProblem)}` en los puntos de render de enteros/ecuaciones. Cambiar esos inputs a `type="text"` + `inputMode="numeric"` para que el valor `-5` no sea rechazado por el input number en algunos navegadores.

**Step 4:** PASS + suite Exercise completa sin regresiones.

### Task 2.3: Commit de fase

```bash
npm test -- run && npm run typecheck && npm run lint
git add -A && git commit -m "fix: permitir respuestas negativas en móvil con botón ± (enteros y ecuaciones)"
```

---

## Fase 3 — Celebraciones y fluidez (#3, #5, #7)

### Task 3.1: Instalar canvas-confetti

```bash
npm install canvas-confetti
```
(los tipos ya existen en `src/types/canvas-confetti.d.ts`). En tests, mockear el módulo (`vi.mock('canvas-confetti')`) en `src/test/setup.ts` para evitar canvas en jsdom.

### Task 3.2: Confeti al acertar (TDD)

**Files:**
- Create: `src/utils/celebration.ts`
- Modify: `src/components/Exercise.tsx`
- Test: `src/utils/__tests__/celebration.test.ts`

**Step 1: Test que falla:** `celebrate(streak)` llama a confetti con `particleCount` pequeño (~40) para acierto normal y grande (~120, spread mayor) cuando `streak % 5 === 0 && streak > 0`.

**Step 2:** FAIL → **Step 3:** implementar `celebration.ts` (wrapper fino sobre `canvas-confetti`) y en `Exercise` un `useEffect`: `if (isCorrect === true) celebrate(state.streak)`.

**Step 4:** PASS.

### Task 3.3: Toast de logro desbloqueado (TDD)

**Files:**
- Modify: `src/types/index.ts` (`GameState.recentAchievement: Achievement | null`), `src/context/GameContext.tsx`
- Create: `src/components/AchievementToast.tsx`
- Modify: `src/components/Home.tsx` (renderizar el toast)
- Test: `src/components/__tests__/AchievementToast.test.tsx`

**Step 1: Test que falla:** reducer: tras `CHECK_ANSWER` que desbloquea un logro, `state.recentAchievement` es ese logro; tras `NEXT_PROBLEM` vuelve a `null`. Componente: renderiza `🏆 ¡Logro desbloqueado!` + nombre del logro cuando hay `recentAchievement`, nada cuando es null.

**Step 2:** FAIL → **Step 3:** en `CHECK_ANSWER`, `recentAchievement: unlockedAchievements[0] ?? null`; limpiar en `NEXT_PROBLEM` y `RESET_GAME`. Toast: banner fijo arriba (`fixed top-4 inset-x-0 mx-auto max-w-sm bg-amber-100 border-2 border-amber-400 …`, `role="status"`), auto-oculto local a los 4 s con `setTimeout`.

**Step 4:** PASS.

### Task 3.4: Enter para «Siguiente» + tap envía en opción múltiple (TDD)

**Files:**
- Modify: `src/components/Exercise.tsx`
- Test: `src/components/__tests__/Exercise.flow.test.tsx`

**Step 1: Tests que fallan:**
1. Con `isCorrect !== null`, `fireEvent.keyDown(window, { key: 'Enter' })` dispara `nextProblem` (aparece un problema nuevo).
2. En un problema de opción múltiple, hacer clic en una opción **envía directamente** la respuesta (aparece ¡Correcto!/Incorrecto sin pulsar Enviar) y el botón Enviar ya no se muestra para ese tipo.

**Step 2:** FAIL → **Step 3:**
- `useEffect` con listener global `keydown` (Enter y `isCorrect !== null` → `nextProblem()`; cleanup al desmontar).
- En `renderMultipleChoice`, `onClick` pasa a `submitAnswer(option.value)`; eliminar el bloque del botón Enviar para multiple choice (`Exercise.tsx:447-461`).

**Step 4:** PASS + revisar y adaptar los tests existentes de Exercise que pulsaban Enviar en multiple choice.

### Task 3.5: Botón «¿Por qué?» tras acertar (TDD)

**Files:**
- Modify: `src/components/Exercise.tsx`
- Test: en `Exercise.flow.test.tsx`

**Step 1: Test que falla:** tras acertar, existe botón `¿Por qué?`; al pulsarlo se muestra `currentProblem.explanation`.

**Step 2:** FAIL → **Step 3:** estado local `showExplanation` (reset en cambio de problema); junto al «¡Correcto!» renderizar botón que muestra el mismo `<pre>` de explicación que ya se usa al fallar (extraer a mini-componente `ExplanationBox` para no duplicar).

**Step 4:** PASS.

### Task 3.6: Commit de fase

```bash
npm test -- run && npm run typecheck && npm run lint
git add -A && git commit -m "feat: confeti, toast de logros, Enter para avanzar, tap-envía y explicación tras acertar"
```

---

## Fase 4 — Retoques UX (#4, #6, #11)

### Task 4.1: Confirmación en dos pasos para «Reiniciar Juego» (TDD)

**Files:**
- Modify: `src/components/Home.tsx`
- Test: `src/components/__tests__/Home.reset.test.tsx`

**Step 1: Test que falla:** clic en `🔄 Reiniciar Juego` NO resetea (score sigue igual) y muestra `¿Seguro?` con botones `Sí, reiniciar` y `Cancelar`; clic en `Sí, reiniciar` sí resetea; `Cancelar` vuelve al botón original.

**Step 2:** FAIL → **Step 3:** estado local `confirmingReset`; render condicional de los dos botones. **Step 4:** PASS.

### Task 4.2: Inputs táctiles grandes

**Files:**
- Modify: `src/components/Exercise.tsx` (FractionInputs, MixedNumberInputs, inputs de resto, NumericInput, PromptInput)

**Step 1:** Cambiar clases: de `w-14 border-b-2 …` a `h-12 w-20 rounded-lg border-2 border-blue-400 text-center text-2xl` (y `w-24`→`w-28` donde aplique). Mantener aria-labels intactos.

**Step 2:** `npm test -- run src/components` → sin regresiones (los tests seleccionan por rol/label, no por clase). Verificación visual en Fase 9.

### Task 4.3: Subtítulo del header

**Files:**
- Modify: `src/components/Layout.tsx:46`

`Practica matemáticas de 4.º y 5.º de Primaria` → `Practica matemáticas de 4.º a 6.º de Primaria de forma divertida`.

### Task 4.4: Commit de fase

```bash
npm test -- run && npm run typecheck && npm run lint
git add -A && git commit -m "feat(ux): confirmación al reiniciar, inputs táctiles grandes y subtítulo 4.º a 6.º"
```

---

## Fase 5 — Meta diaria y racha de días (#8)

**Diseño:** util puro `dailyGoal.ts` + campos en `GameState` persistidos vía Fase 1. Meta: 10 ejercicios/día.

### Task 5.1: Util `dailyGoal` (TDD)

**Files:**
- Create: `src/utils/dailyGoal.ts`
- Test: `src/utils/__tests__/dailyGoal.test.ts`

**Step 1: Tests que fallan:**

```ts
import { describe, expect, it } from 'vitest';
import { updateDailyProgress, computeDayStreak, DAILY_GOAL } from '../dailyGoal';

describe('dailyGoal', () => {
  it('incrementa el contador del día actual', () => {
    const d = updateDailyProgress({ date: '2026-07-19', count: 3 }, new Date('2026-07-19T10:00:00'));
    expect(d).toEqual({ date: '2026-07-19', count: 4 });
  });
  it('reinicia el contador al cambiar de día', () => {
    const d = updateDailyProgress({ date: '2026-07-18', count: 9 }, new Date('2026-07-19T10:00:00'));
    expect(d).toEqual({ date: '2026-07-19', count: 1 });
  });
  it('racha de días consecutivos terminando hoy o ayer', () => {
    const now = new Date('2026-07-19T10:00:00');
    expect(computeDayStreak(['2026-07-17', '2026-07-18', '2026-07-19'], now)).toBe(3);
    expect(computeDayStreak(['2026-07-17', '2026-07-18'], now)).toBe(2); // ayer aún cuenta
    expect(computeDayStreak(['2026-07-16', '2026-07-17'], now)).toBe(0); // cadena rota
    expect(computeDayStreak([], now)).toBe(0);
  });
  it('la meta es 10', () => expect(DAILY_GOAL).toBe(10));
});
```

**Step 2:** FAIL → **Step 3:** implementar (`DailyProgress = { date: string; count: number }`; `practiceDays: string[]` se mantiene ordenado, máx. 60 entradas). **Step 4:** PASS.

### Task 5.2: Integración en reducer + persistencia (TDD)

**Files:**
- Modify: `src/types/index.ts` (`GameState.daily`, `GameState.practiceDays`; añadirlos a `PersistedGameState`)
- Modify: `src/context/GameContext.tsx` (en `CHECK_ANSWER`: `daily = updateDailyProgress(...)`; añadir fecha a `practiceDays` si no está; incluir en `toPersistedGameState` y en el merge de `HYDRATE_PERSISTED` — para `daily` gana el de fecha más reciente o mayor count si misma fecha; `practiceDays` unión)
- Test: ampliar `GameContext.hydrate.test.tsx` o los tests del reducer existentes.

### Task 5.3: UI — anillo de meta diaria y racha de días (TDD)

**Files:**
- Create: `src/components/DailyGoalCard.tsx`
- Modify: `src/components/Home.tsx` (encima de las tabs)
- Test: `src/components/__tests__/DailyGoalCard.test.tsx`

**Step 1: Test que falla:** con `daily={date:hoy,count:7}` y `dayStreak=3` muestra `7 / 10 hoy` y `🔥 3 días seguidos`; con `count>=10` muestra `¡Meta cumplida! 🎉`; con `dayStreak===0` no muestra el 🔥.

**Step 2:** FAIL → **Step 3:** tarjeta con barra de progreso (div con width %; `role="progressbar"` + `aria-valuenow`). **Step 4:** PASS.

### Task 5.4: Commit de fase

```bash
npm test -- run && npm run typecheck && npm run lint
git add -A && git commit -m "feat: meta diaria de 10 ejercicios y racha de días de práctica"
```

---

## Fase 6 — Práctica recomendada (#9)

**Diseño:** reutilizar `buildChildReport` con los intentos propios del niño (RLS ya permite select de tus propias filas — `statsService.fetchUserStats` lo demuestra). El primer aviso `reinforce` cuyo modo de práctica exista en el curso actual se convierte en tarjeta «💪 Te toca entrenar».

### Task 6.1: Mapa operación → modo de práctica (TDD)

**Files:**
- Modify: `src/utils/practiceConfig.ts`
- Test: `src/utils/__tests__/practiceConfig.operation.test.ts`

**Step 1: Test que falla:** `practiceModeForOperation('division') === 'division'`, `('fraction-addition') === 'fractions'`, `('decimal-multiplication') === 'decimals'`, `('word-problem') === 'word-problems'`, `('gcd') === 'number-theory'`, `('integer-addition') === 'integers'`, `('circle-area') === 'geometry-advanced'`, `('percentage') === 'percentages'`, desconocida → `null`.

**Step 2:** FAIL → **Step 3:** mapa explícito `Record<string, PracticeMode>` cubriendo todas las `OPERATION_KEYS` (consultar `src/types/index.ts` y el mapeo practiceMode→operations en `src/utils/problemGenerator.ts` para no dejar huecos; test extra: cada `OPERATION_KEYS` devuelve un modo no-null). **Step 4:** PASS.

### Task 6.2: Servicio de intentos propios (TDD)

**Files:**
- Modify: `src/services/statsService.ts`
- Test: ampliar `src/services/__tests__/statsService.test.ts` (si existe; si no, crear)

Añadir `fetchOwnAttempts(userId): Promise<ChildAttempt[] | null>` — select de `operation, grade, is_correct, time_spent, created_at` filtrado por `user_id`, mapeado al shape que consume `buildChildReport` (mismo mapping que `adminService.fetchAllAttempts`). TDD igual que Task 1.2.

### Task 6.3: Tarjeta de recomendación en PracticeModes (TDD)

**Files:**
- Create: `src/components/RecommendedPractice.tsx`
- Modify: `src/components/PracticeModes.tsx` (renderizarla arriba)
- Test: `src/components/__tests__/RecommendedPractice.test.tsx`

**Step 1: Test que falla:** mock de `fetchOwnAttempts` con 10 intentos de `division` (30 % aciertos): la tarjeta muestra `💪 Te toca entrenar: Divisiones` y un botón `Practicar ahora`; al pulsarlo se llama `setPracticeMode('division')`. Sin avisos reinforce → la tarjeta no se renderiza. Si el modo no está disponible en el curso actual → no se renderiza.

**Step 2:** FAIL → **Step 3:** el componente carga intentos (una vez, `useEffect`), construye `buildChildReport`, toma el primer advisory `reinforce`, resuelve el modo con `practiceModeForOperation` y valida contra `getPracticeModesForGrade(state.grade)`.

**Step 4:** PASS.

### Task 6.4: Commit de fase

```bash
npm test -- run && npm run typecheck && npm run lint
git add -A && git commit -m "feat: práctica recomendada según puntos débiles del niño"
```

---

## Fase 7 — Más problemas verbales (#10)

### Task 7.1: Nuevas plantillas (TDD)

**Files:**
- Modify: `src/utils/generators/wordProblems.ts` (exportar `templates` como `__templates` para test)
- Test: `src/utils/__tests__/wordProblems.test.ts` (ampliar el existente si ya hay)

**Step 1: Test que falla:** con un `LevelConfig` fijo, para **cada** plantilla generar 25 problemas y asertar: `answer` es entero ≥ 0 (salvo plantillas de enteros), `prompt` no contiene `NaN` ni `undefined`, `explanation` no vacía. Asertar además `__templates.length >= 13` (7 actuales + ≥6 nuevas).

**Step 2:** FAIL → **Step 3:** añadir ≥6 plantillas:
- *Dos pasos:* «Un cine tiene F filas de B butacas y se ocupan O. ¿Cuántas quedan libres?» (`F×B−O`); «Ahorras A € por semana durante S semanas y te compras un juego de J €. ¿Cuánto te queda?»; «Un cuaderno cuesta C € y compras N; pagas con billete B. ¿Cuánto te devuelven?» (ya hay una similar — variar contexto y rangos).
- *Con distractores:* «María tiene P perros y C caramelos. Reparte los caramelos entre A amigos. ¿Cuántos recibe cada uno?» (P es irrelevante); «Un autobús con M plazas lleva V viajeros y recorre K km. ¿Cuántas plazas libres quedan?» (K irrelevante).
- *Tiempo:* «Una película empieza a las H:00 y dura M minutos completos, ¿cuántos minutos son en total desde las H:00 hasta el final?» — mantener respuesta numérica simple.
Cuidar que todas usen `randomInt` acotado por `config.maxNumber`/`maxNumberMult` como las existentes.

**Step 4:** PASS.

### Task 7.2: Commit de fase

```bash
npm test -- run && npm run typecheck && npm run lint
git add -A && git commit -m "feat: problemas verbales de dos pasos y con datos distractores"
```

---

## Fase 8 — Admin: evolución semanal (#12) y export CSV (#13)

> **Nota para el ejecutor:** antes de escribir el gráfico de tendencia, cargar el skill `dataviz` (lo exige para cualquier chart).

### Task 8.1: Agregador de tendencia semanal (TDD)

**Files:**
- Create: `src/utils/weeklyTrend.ts`
- Test: `src/utils/__tests__/weeklyTrend.test.ts`

**Step 1: Test que falla:** `buildWeeklyTrend(attempts, now, 8)` devuelve 8 buckets (semanas ISO, lunes como inicio, la más reciente al final) con `{ weekStart: 'YYYY-MM-DD', total, correct, accuracy }`; semanas sin intentos → `total: 0, accuracy: null`. Casos: intentos en dos semanas distintas; intento fuera de la ventana de 8 semanas se ignora; lista vacía → 8 buckets a cero.

**Step 2:** FAIL → **Step 3:** implementar (reutilizar el shape `ChildAttempt` de `childReport`). **Step 4:** PASS.

### Task 8.2: Componente de tendencia (TDD)

**Files:**
- Create: `src/components/admin/ChildTrendView.tsx`
- Modify: `src/components/admin/AdminDashboard.tsx` (renderizar entre ChildReportView y StatsView)
- Test: `src/components/admin/__tests__/ChildTrendView.test.tsx`

**Step 1: Test que falla:** con buckets conocidos renderiza título `📈 Evolución (últimas 8 semanas)`, una barra por semana con `title` = «Semana del D mmm: X % (N intentos)» y las semanas vacías en gris. Accesibilidad: contenedor con `role="img"` y `aria-label` resumen.

**Step 2:** FAIL → **Step 3:** barras div con altura proporcional a accuracy (0-100), color por tramo (mismos umbrales que el informe: <60 rojo, ≥85 verde, resto azul), etiqueta de % encima si hay datos. Sin librerías.

**Step 4:** PASS. En `AdminDashboard`, alimentar con los `attempts` ya cargados filtrados por `selected.id` (no hace falta otra query).

### Task 8.3: Export CSV (TDD)

**Files:**
- Create: `src/utils/attemptsCsv.ts`
- Modify: `src/components/admin/AdminDashboard.tsx` (botón `⬇️ Exportar CSV` en la cabecera de la lista)
- Test: `src/utils/__tests__/attemptsCsv.test.ts`

**Step 1: Test que falla:** `attemptsToCsv(attempts, children)` produce: BOM `﻿` inicial; separador `;` (Excel es-ES); cabecera `niño;curso;ejercicio;correcto;tiempo_s;fecha`; usernames resueltos desde `children`; campos con `;` o comillas van entrecomillados; etiquetas humanas (`Divisiones`, `5.º de Primaria`, `sí/no`).

**Step 2:** FAIL → **Step 3:** implementar util puro + en el dashboard un handler que crea `Blob` (`text/csv;charset=utf-8`), `URL.createObjectURL`, `<a download="pitagoritas-intentos-YYYY-MM-DD.csv">`, click, revoke. El botón se deshabilita si `attempts` es null/vacío.

**Step 4:** PASS + test de AdminDashboard: el botón existe y está habilitado con datos.

### Task 8.4: Commit de fase

```bash
npm test -- run && npm run typecheck && npm run lint
git add -A && git commit -m "feat(admin): evolución semanal por niño y exportación CSV de intentos"
```

---

## Fase 9 — Verificación final, versión y push

### Task 9.1: Verificación completa

```bash
npm test -- run        # suite completa en verde
npm run typecheck      # sin errores
npm run lint           # 0 errores (2 warnings preexistentes de GameContext permitidos)
npm run build          # build OK (incluye PWA)
```
**REQUIRED SUB-SKILL antes de declarar éxito:** superpowers:verification-before-completion.

### Task 9.2: Smoke manual (usar skill `run` si hace falta lanzar la app)

`npm run preview` y comprobar a mano:
1. Login niño → juego carga; acierto → confeti; fallo → explicación; Enter avanza.
2. Modo enteros (6.º) → botón ± visible y funcional.
3. Reiniciar pide confirmación.
4. Meta diaria visible y suma.
5. Pestaña Práctica → tarjeta «Te toca entrenar» (con un usuario con fallos).
6. Login admin → panel, tendencia semanal en detalle, descarga CSV abre bien en LibreOffice/Excel.
7. `game_state` en Supabase: `select * from public.game_state;` muestra la fila del niño tras jugar.

### Task 9.3: Versión y changelog

- `npm version minor --no-git-tag-version` (el badge del header usa `__APP_VERSION__`).
- Añadir entrada a `CHANGELOG.md` resumiendo las 13 mejoras.
- `git add -A && git commit -m "chore: versión y changelog de las mejoras UX/contenido"`

### Task 9.4: Push único (dispara deploy de Vercel)

```bash
git push origin main
```
Tras el deploy (~2 min), repetir el smoke rápido en https://pitagoritas.vercel.app (puntos 1, 2 y 6) y confirmar al usuario.

---

## Resumen de fases y commits

| Fase | Sugerencias | Commit |
|------|-------------|--------|
| 1 | #1 persistencia por usuario | `feat: estado de juego por usuario sincronizado en Supabase` |
| 2 | #2 negativos móvil | `fix: botón ± para respuestas negativas` |
| 3 | #3 #5 #7 celebración y fluidez | `feat: confeti, toast, Enter, tap-envía, explicación` |
| 4 | #4 #6 #11 retoques UX | `feat(ux): confirmación reset, inputs grandes, subtítulo` |
| 5 | #8 meta diaria | `feat: meta diaria y racha de días` |
| 6 | #9 práctica recomendada | `feat: práctica recomendada` |
| 7 | #10 problemas verbales | `feat: nuevas plantillas de problemas` |
| 8 | #12 #13 admin | `feat(admin): tendencia semanal y CSV` |
| 9 | verificación + versión | `chore: versión y changelog` + **push** |

**Riesgos:**
- Fase 1 toca el corazón del estado: correr la suite completa de `src/context` tras cada task, no solo el test nuevo.
- La migración 0007 debe estar aplicada en cloud **antes** del push final (el código la usa); aplicarla en Task 1.1 no rompe la app desplegada actual (tabla nueva, sin uso).
- Cambio de comportamiento en multiple choice (tap-envía): revisar todos los tests existentes de Exercise que asuman el botón Enviar.
