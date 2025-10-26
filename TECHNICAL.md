# Documentación Técnica - Pitagoritas

Esta documentación técnica consolida toda la información relevante del proyecto para desarrolladores.

## Arquitectura del Sistema

### Stack Tecnológico

**Frontend:**
- React 19.1.0
- TypeScript 5.8.3
- Vite 7.0.0
- Tailwind CSS 3.4.0

**Backend/Servicios:**
- Supabase (PostgreSQL + Auth + Storage)
- Proyecto: `supabase-pitagoritas`

**Testing:**
- Vitest 3.2.4
- Testing Library React 16.3.0
- Cobertura: @vitest/coverage-v8

**Desarrollo:**
- ESLint + Prettier
- TypeScript strict mode
- Hot Module Replacement (HMR)

### Estructura del Proyecto

```
pitagoritas/
├── src/
│   ├── components/          # Componentes React
│   │   ├── auth/           # Autenticación (Login, Register, AuthGate)
│   │   ├── Exercise.tsx    # Componente principal de ejercicios
│   │   ├── Home.tsx        # Página principal con tabs
│   │   ├── Layout.tsx      # Layout global con header/footer
│   │   ├── ScoreBoard.tsx  # Puntuación y progreso
│   │   ├── DetailedStats.tsx # Estadísticas detalladas
│   │   ├── Achievements.tsx # Sistema de logros
│   │   ├── PracticeModes.tsx # Selector de modos
│   │   └── TimeModes.tsx   # Selector de tiempos
│   ├── context/            # Contextos de React
│   │   ├── AuthContext.tsx # Autenticación y sesión
│   │   └── GameContext.tsx # Estado del juego
│   ├── services/           # Servicios
│   │   ├── attemptService.ts # Guardado de intentos
│   │   ├── statsService.ts   # Cálculo de estadísticas
│   │   └── instrumentationService.ts # Logs y telemetría
│   ├── lib/
│   │   └── supabaseClient.ts # Cliente de Supabase
│   ├── utils/              # Utilidades
│   │   ├── problemGenerator.ts # Generador de problemas
│   │   ├── statsUtils.ts      # Funciones de estadísticas
│   │   ├── authHelpers.ts     # Helpers de autenticación
│   │   ├── gameConfig.ts      # Configuración de niveles/logros
│   │   ├── timeConfig.ts      # Configuración de tiempos
│   │   ├── practiceConfig.ts  # Configuración de modos
│   │   └── fractions.ts       # Utilidades de fracciones
│   ├── types/              # Definiciones TypeScript
│   │   └── index.ts       # Tipos principales
│   ├── App.tsx            # Componente raíz
│   ├── main.tsx           # Punto de entrada
│   └── style.css          # Estilos globales
├── supabase/
│   └── migrations/        # Migraciones SQL versionadas
│       ├── 0001_create_profiles_attempts.sql
│       ├── 0002_auto_create_profile_trigger.sql
│       └── 0003_reset_users_and_fix_rls.sql
├── public/                # Archivos estáticos
│   └── logo.png
├── .env.local            # Variables de entorno (no versionado)
├── .github/
│   └── workflows/
│       └── ci.yml        # CI/CD con GitHub Actions
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── vitest.config.ts
└── vite.config.ts
```

## Base de Datos (Supabase)

### Esquema

#### Tabla: `profiles`

```sql
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  avatar text,
  created_at timestamp with time zone default now()
);
```

**Descripción:** Almacena el perfil del usuario con username único y avatar (emoji).

#### Tabla: `attempts`

```sql
create table if not exists public.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamp with time zone default now(),
  level int not null,
  operation text not null,
  is_correct boolean not null,
  time_spent int not null default 0,
  user_answer jsonb not null,
  correct_answer jsonb not null,
  practice_mode text not null
);
```

**Descripción:** Guarda cada intento de ejercicio con todos sus metadatos.

**Operaciones soportadas:**
- `addition` - Suma
- `subtraction` - Resta
- `multiplication` - Multiplicación
- `division` - División
- `fraction-addition` - Suma de fracciones
- `fraction-subtraction` - Resta de fracciones
- `mixed` - Operación mixta (combina múltiples operaciones)

### Row Level Security (RLS)

Todas las tablas tienen RLS habilitado con políticas granulares:

```sql
-- PROFILES
create policy "profiles select own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles insert own" on public.profiles
  for insert with check (auth.uid() = id);

create policy "profiles update own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- ATTEMPTS
create policy "attempts select own" on public.attempts
  for select using (auth.uid() = user_id);

create policy "attempts insert own" on public.attempts
  for insert with check (auth.uid() = user_id);
```

### Trigger Automático

El trigger `on_auth_user_created` crea automáticamente un perfil cuando se registra un usuario:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar)
  VALUES (
    NEW.id,
    SPLIT_PART(NEW.email, '@', 1),
    '🙂'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
```

## Sistema de Autenticación

### Flujo de Autenticación

1. **Registro (`signUp`)**:
   - Usuario ingresa: `username`, `PIN` (6 dígitos), `avatar` (emoji)
   - Se valida username (3-15 caracteres, solo alfanuméricos)
   - Se valida PIN (exactamente 6 dígitos)
   - Se construye email sintético: `username@gmail.com` (configurable con `VITE_SUPABASE_EMAIL_DOMAIN`)
   - Se crea usuario en Supabase Auth
   - El trigger `handle_new_user` crea automáticamente el perfil

2. **Login (`signIn`)**:
   - Usuario ingresa: `username`, `PIN`
   - Se construye email sintético
   - Autenticación con Supabase Auth
   - Se establece sesión
   - Delay de 200ms para asegurar propagación de sesión
   - Se busca perfil del usuario
   - Si no existe perfil, se muestra error

3. **Logout (`signOut`)**:
   - Se cierra sesión en Supabase
   - Se limpia estado local (session, profile)

### Helpers de Autenticación

```typescript
// Construir email sintético
buildSyntheticEmail(username: string): string
// Retorna: username@{VITE_SUPABASE_EMAIL_DOMAIN}

// Validaciones
isValidUsername(username: string): boolean  // 3-15 chars, alfanuméricos
isValidPin(pin: string): boolean            // 6 dígitos exactos
normalizeUsername(username: string): string // lowercase + trim
```

## Sistema de Persistencia

### Guardado Inmediato (Solución C Híbrida)

**Característica principal:** Cada intento se guarda inmediatamente en Supabase.

#### Flujo:

1. Usuario responde ejercicio
2. `checkAnswer()` evalúa respuesta
3. `recordAttemptDirect()` guarda en Supabase inmediatamente
4. Si falla → va a cola local (fallback)
5. Si hay cola pendiente → intenta sincronizar automáticamente

```typescript
// attemptService.ts
export async function recordAttemptDirect(userId: string, attempt: AttemptPayload): Promise<void> {
  try {
    const { error } = await supabase.from('attempts').insert({...});
    if (error) {
      // Fallback a cola local
      enqueue(userId, attempt);
      void flushQueue(userId);
    }
  } catch (error) {
    // Fallback a cola local
    enqueue(userId, attempt);
    void flushQueue(userId);
  }
}
```

### Sincronización de Estadísticas

**Al iniciar sesión:**
1. Delay de 500ms para asegurar sesión establecida
2. `fetchUserStats(userId)` carga todos los attempts
3. Recalcula estadísticas desde cero
4. `dispatch({ type: 'SET_STATS', payload: remoteStats })`

**Durante la sesión:**
- Las estadísticas locales se actualizan en tiempo real
- NO se recalculan desde Supabase (evita doble conteo)
- Funciones de stats son inmutables (retornan nuevos objetos)

**Al hacer logout:**
- NO hay sincronización adicional (ya se guardó todo inmediatamente)

### Funciones de Estadísticas Inmutables

```typescript
// statsUtils.ts - IMPORTANTE: Todas retornan nuevos objetos
updateWeeklyProgress(stats, isCorrect, timeSpent): DetailedStats
updateOperationStats(stats, operation, isCorrect, timeSpent, difficulty): DetailedStats
updateDifficultyStats(stats, difficulty, isCorrect): DetailedStats
```

**Por qué inmutables:**
- Evita mutaciones que causan doble conteo
- Mejor rendimiento con React
- Más fácil de testear y debuggear

## Sistema de Ejercicios

### Generador de Problemas

**Archivo:** `src/utils/problemGenerator.ts`

```typescript
export function generateProblem(level: number, practiceMode: PracticeMode): Problem
```

**Modos de práctica:**
- `all` - Todas las operaciones
- `addition` - Solo sumas
- `subtraction` - Solo restas
- `multiplication` - Solo multiplicaciones
- `division` - Solo divisiones
- `fractions` - Solo fracciones
- `mixed` - Solo operaciones mixtas

### Operación Mixta

**Características:**
- Combina 3-5 operandos con +, -, ×, ÷
- Respeta orden de operaciones (PEMDAS)
- Asegura divisiones exactas
- Resultados enteros

**Ejemplo de generación:**
```typescript
// Expresión: "6 + 4 × 2"
// Tokens: [6, '+', 4, '×', 2]
// Respuesta: 14
// Explicación paso a paso:
// 1. Primero multiplicación: 4 × 2 = 8
// 2. Luego suma: 6 + 8 = 14
```

## Variables de Entorno

### Desarrollo Local (`.env.local`)

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_EMAIL_DOMAIN=gmail.com
```

### Producción (Vercel)

Configurar en: **Vercel Dashboard → Settings → Environment Variables**

Variables requeridas:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SUPABASE_EMAIL_DOMAIN`

**IMPORTANTE:** Las variables `VITE_*` se "hornean" en el código durante el build, por lo que requieren **re-deploy** después de cambiarlas.

## Testing

### Estructura de Tests

```
src/
├── __tests__/
│   └── appSmoke.test.tsx          # Test de smoke de la app
├── components/
│   └── auth/
│       └── __tests__/
│           ├── LoginForm.test.tsx
│           └── RegisterForm.test.tsx
├── services/
│   └── __tests__/
│       └── instrumentationService.test.ts
└── utils/
    └── __tests__/
        ├── authHelpers.test.ts
        ├── authHelpers.server.test.ts
        ├── fractions.test.ts
        ├── mixed.test.ts
        ├── problemGenerator.test.ts
        └── statsUtils.test.ts
```

### Ejecutar Tests

```bash
# Todos los tests
npm test

# Watch mode
npm run test:watch

# Con UI
npm run test:ui

# Con cobertura
npm test -- --coverage
```

### Cobertura Actual

- **32 tests** pasando
- ~**36% de cobertura** total
- Enfoque en lógica crítica: generadores, stats, auth

## CI/CD

### GitHub Actions

**Archivo:** `.github/workflows/ci.yml`

**Pipeline:**
1. Checkout código
2. Setup Node 20
3. Instalar dependencias
4. `npm run lint` - Linting
5. `npm run test` - Tests
6. `npm run typecheck` - Verificación de tipos
7. `npm run build` - Build

**Triggers:**
- Push a `main`
- Pull Requests

### Vercel Deployment

**Auto-deploy desde GitHub:**
- Main branch → Production
- Pull Requests → Preview

**Variables de entorno necesarias:**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SUPABASE_EMAIL_DOMAIN`

## Troubleshooting

### Problema: Estadísticas en 0 después de login

**Causa:** RLS bloquea la query porque `auth.uid()` no está disponible aún.

**Solución:** Implementado delay de 500ms antes de `fetchUserStats()`.

### Problema: Doble conteo de estadísticas

**Causa:** Funciones de stats mutaban el objeto directamente.

**Solución:** Funciones ahora son inmutables (retornan nuevos objetos).

### Problema: Datos se pierden al hacer logout

**Causa:** Sistema de cola no se sincronizaba a tiempo.

**Solución:** Guardado inmediato con `recordAttemptDirect()`.

### Problema: Botón Salir no funciona

**Causa:** Event bubbling y falta de prevención de default.

**Solución:**
```typescript
onClick={async (e) => {
  e.preventDefault();
  e.stopPropagation();
  await signOut();
}}
```

## Mejores Prácticas

### Code Style

- **TypeScript strict mode** habilitado
- **ESLint + Prettier** para consistencia
- **Nombres descriptivos** para variables y funciones
- **Comentarios solo cuando necesario** (código auto-documentado)

### React

- **Hooks personalizados** para lógica reutilizable
- **Context API** para estado global
- **Immutability** en todas las actualizaciones de estado
- **useCallback/useMemo** para optimización cuando necesario

### Supabase

- **RLS siempre habilitado** en producción
- **Migraciones versionadas** para cambios de esquema
- **Triggers para automatización** (ej: creación de perfiles)
- **Políticas granulares** (SELECT, INSERT, UPDATE separadas)

### Performance

- **Guardado inmediato** para mejor UX
- **Cola local** como fallback offline
- **Lazy loading** de componentes pesados
- **Memoización** de cálculos costosos

## Referencias

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Supabase Documentation](https://supabase.com/docs)
- [Vite Guide](https://vitejs.dev/guide/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Vitest Documentation](https://vitest.dev/)

---

**Última actualización:** 2025-10-26
**Versión:** 1.0.0
