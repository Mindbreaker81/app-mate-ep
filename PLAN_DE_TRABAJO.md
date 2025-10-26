# Plan de Trabajo: Pitagoritas

## Resumen

Actualizaremos la app para niños que practican matemáticas (Vite + React + TS + Tailwind), desplegada con GitHub → Vercel, conectada a Supabase (BD: supabase-pitagoritas). Objetivos:

- Autenticación infantil con username + PIN numérico y elección de avatar.
- Persistencia en Supabase de intentos, progreso y estadísticas por usuario.
- Nueva operación mixta que combine suma, resta, multiplicación y división en una sola expresión con orden de operaciones.
- Reforzar linting y cobertura de tests (Vitest + Testing Library) ya existentes añadiendo validaciones de tipeo antes de cada release.
- CI en GitHub Actions ejecutando lint, pruebas y chequeo de tipos en cada PR.

## Estado actual (diagnóstico)

- Stack: Vite, React 19, TypeScript, Tailwind, Vitest.
- Lógica principal: `src/utils/problemGenerator.ts`, estado en `src/context/GameContext.tsx`.
- Estadísticas sincronizadas entre `localStorage` y Supabase; `operationStats` cubre operaciones básicas, fracciones y mixtas con normalización automática.
- Despliegue: GitHub → Vercel (estático). Supabase ya conectado (proyecto supabase-pitagoritas).

## Objetivos y Alcance

- Autenticación simple para niños: username único + PIN (6 dígitos) y avatar con emojis predefinidos.
- Guardar cada intento en BD con metadatos (tiempo, operación, nivel, respuesta, acierto).
- Cargar progreso por usuario y mostrar estadísticas agregadas.
- Añadir operación "mixta" con explicación paso a paso.
- Calidad: ESLint, tests unitarios y de componentes, CI en PRs.

## Diseño funcional

- Acceso infantil:
  - Registro: elegir `username` disponible, avatar (emojis predefinidos) y PIN numérico de 6 dígitos.
  - Login: `username` + PIN (teclado numérico). Sin email visible para el niño.
- Flujo alternativo (opcional): cuenta padre con múltiples perfiles de niño (cada uno con PIN). No incluido en alcance base.
- Experiencia: si no hay sesión → pantalla de acceso; tras login → experiencia actual de juego.

## Diseño técnico

### Supabase Auth

- Usaremos email sintético `username@<dominio>` + PIN como contraseña (Auth estándar). El dominio se controla con `VITE_SUPABASE_EMAIL_DOMAIN` (por defecto `pitagoritas-mail.com`, se debe añadir a Auth > Allowed email domains en Supabase).
- Asegurar política de password mínima (recomendado 6 dígitos) y rate-limiting en intentos (vía Supabase + reglas del frontend, p. ej., tres intentos antes de cooldown corto).
- Versionar los cambios de esquema/Auth mediante migraciones SQL (directorio `supabase/migrations`) y documentar su aplicación en entornos locales y de CI para evitar drift.

### Esquema de base de datos

- Tabla `profiles`:
  - `id` uuid (PK, FK a `auth.users.id`).
  - `username` text UNIQUE NOT NULL.
  - `avatar` text.
  - `created_at` timestamp default now().
- Tabla `attempts`:
  - `id` uuid (PK) default gen_random_uuid().
  - `user_id` uuid NOT NULL (FK a `auth.users.id`).
  - `created_at` timestamp default now().
  - `level` int NOT NULL.
  - `operation` text NOT NULL (addition, subtraction, multiplication, division, fraction-addition, fraction-subtraction, mixed).
  - `is_correct` boolean NOT NULL.
  - `time_spent` int NOT NULL default 0.
  - `user_answer` jsonb NOT NULL.
  - `correct_answer` jsonb NOT NULL.
  - `practice_mode` text NOT NULL.

Ejemplo de DDL (orientativo):

```sql
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  avatar text,
  created_at timestamp with time zone default now()
);

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

### RLS (Row Level Security)

- Activar RLS en `profiles` y `attempts`.
- Policies (orientativo):

```sql
alter table public.profiles enable row level security;
alter table public.attempts enable row level security;

create policy "profiles select own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles upsert own" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "attempts select own" on public.attempts
  for select using (auth.uid() = user_id);
create policy "attempts insert own" on public.attempts
  for insert with check (auth.uid() = user_id);
```

### Variables de entorno (Vercel y local)

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

- Gestionar las variables vía `.env.local` (gitignored), secretos cifrados en Vercel y equivalentes en CI (`CI_SUPABASE_*`), asegurando que los pipelines de Vitest y build reciben claves mediante parámetros encriptados sin exponerlas en logs.

### Cliente Supabase

- Archivo `src/lib/supabaseClient.ts` con `createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)`.

### Contexto de Autenticación

- `AuthContext` para exponer sesión, `signIn`, `signUp`, `signOut`.
- Mapeo username ↔ email sintético; PIN como contraseña.
- Sincronizar perfil `profiles` tras signup (insert/upsert).
- Limitar reintentos de PIN en frontend con cooldown progresivo, expirar sesiones inactivas y evitar almacenamiento de información sensible para cumplir con COPPA.

### Persistencia de intentos y sincronización

- En `GameContext` tras `CHECK_ANSWER`, insertar en `attempts` (no bloquear UI). Reintento con backoff si offline.
- Al iniciar sesión, cargar agregados desde `attempts` y poblar `stats` locales (o calcular en cliente).
- Migración inicial: si existen datos en `localStorage` y el usuario no está marcado como migrado, subir conteos y marcar flag.
- Implementar una cola resiliente (IndexedDB/localStorage) que guarde intentos pendientes cuando no haya conectividad y reprocesarlos con backoff al restablecerse.
- Guardar la fecha de última sincronización para evitar duplicados y poder auditar migraciones.

## Nueva Operación Mixta ("mixed")

### Definición

- Generar una expresión corta de 3–5 operandos que combine +, -, ×, ÷ con orden de operaciones estándar (× y ÷ antes que + y -). Ejemplos:
  - `6 + 4 × 2` → 14
  - `18 ÷ 3 + 5` → 11
  - `12 - 3 × 2 + 4` → 10
- Asegurar divisiones exactas y resultados enteros (para niños), al menos en niveles iniciales.

### Cambios de tipos (plan)

- Añadir `'mixed'` a `Operation`.
- Extender `Problem` con una variante:
  - `{ expression: string; tokens?: Array<number | string>; operation: 'mixed'; answer: number; explanation: string }`

### Generación y explicación

- `problemGenerator.generateProblem`: incluir rama `mixed`.
- Generación controlada por nivel: límites de operandos y cantidad de operadores.
- Explicación paso a paso siguiendo el orden de operaciones.

### UI

- `Exercise.tsx`: si `operation === 'mixed'`, mostrar `expression` (solo lectura) y un input numérico; aceptar respuesta entera.
- `getOperationSymbol`: no aplica para `mixed` (se usa `expression`).

### Estadísticas y modos

- `operationStats` y la UI de estadísticas incluyen categorías separadas para fracciones y mixtas.
- Modo de práctica `mixed` disponible junto con la opción `all` actualizada.
- Pruebas unitarias verifican generación y estadísticas asociadas a operaciones mixtas.
- Instrumentación con logs controlados para detectar anomalías de operaciones mixtas y sincronización.

## Linting

- ESLint (TypeScript + React + Hooks) y compat con Prettier ya están instalados; validar reglas compartidas y mantener el formato consistente con Prettier.
- Scripts disponibles:
  - `npm run lint` → `eslint . --ext .ts,.tsx`
  - `npm run lint:fix` → `eslint . --ext .ts,.tsx --fix`
- Añadir `npx tsc --noEmit` como verificación de tipos previa a los builds.

## Tests (Vitest + Testing Library)

- Unit tests `problemGenerator`:
  - addition, subtraction, multiplication, division.
  - fractions (suma y resta) validan fracciones y simplificación.
  - mixed: evalúa orden de operaciones y resultado entero.
- Unit tests `statsUtils`:
  - actualización semanal, por operación, por dificultad, accuracy.
- Reducer `GameContext`:
  - CHECK_ANSWER numérico y fracciones; NEXT_PROBLEM; SET/RESET; timer.
- Componentes clave (`Exercise`, `PracticeModes`, `ScoreBoard`):
  - render según operación, input y flujo submit/next; small integration tests.
- Confeti: usar `vi.useFakeTimers` para validar cleanup <2s, `pointer-events: none` y ausencia de fugas de listeners.

## CI/CD (GitHub Actions + Vercel)

- Workflow `.github/workflows/ci.yml`:
  - Node 20.
  - Instalar deps, `npm run lint`, `npm run test`, `npx tsc --noEmit` y `npm run build` para detectar regresiones anticipadamente.
- Vercel: variables de entorno (URL y Anon Key) en Preview y Production. Deploy automático desde GitHub.
- Publicar artefactos de cobertura y reportes de lint en CI para facilitar diagnóstico.

## Plan de Implementación (fases)

1) Fundaciones
- [x] Revisar configuración ESLint/Vitest existente y añadir `npx tsc --noEmit` como guardia local
- [x] Configurar CI (lint + test + typecheck + build)
- [x] Supabase client (`supabaseClient.ts`)
- [x] Definir flujo de migraciones SQL versionadas y documentación de aplicación

2) Autenticación y perfiles
- [x] `AuthContext` con signUp/signIn (username→email sintético, PIN)
- [x] Pantallas Login/Registro con avatar
- [x] Tabla `profiles` y RLS

3) Persistencia de intentos y sincronización
- [x] Tabla `attempts` y RLS
- [x] Guardar intento al `CHECK_ANSWER`
- [x] Carga agregada al login; migración desde `localStorage`
- [x] Implementar cola offline con backoff y registro de última sincronización

4) Operación Mixta
- [x] Tipos (`Operation`, `Problem` variante `mixed`)
- [x] Generación y explicación en `problemGenerator`
- [x] UI en `Exercise.tsx`
- [x] Ampliar estadísticas para `mixed` y fracciones (categorías separadas)
- [x] Pruebas unitarias/integración para `mixed`
- [x] Instrumentación adicional (logs/métricas) para operaciones `mixed`

5) Pulido y despliegue
- [x] Variables en Vercel, smoke test en Preview — `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` obligatorios (el build falla sin ellos); ejecutar `npm run build` en Preview
- [x] Merge a main y release — preparar PR final, monitorear telemetría e indicadores en el primer despliegue (commit 95fb636, v1.0.0)
- [ ] QA manual (móviles y desktop) — validar en dispositivos reales (pendiente de usuario)

## Criterios de Aceptación

- [x] Login/Registro con username + PIN y avatar funcional en producción.
- [x] Intentos guardados por usuario en Supabase con RLS activa.
- [x] Estadísticas cargan desde BD y se reflejan en UI.
- [x] Nueva operación `mixed` disponible y evaluada correctamente con explicación.
- [x] Lint, typecheck (`npx tsc --noEmit`), build y suite de tests pasando en CI.

**Estado:** ✅ **COMPLETADO** (v1.0.0 - 2025-10-26)

## Consideraciones de seguridad y UX

- PIN fijo de 6 dígitos; mostrar teclado numérico en móviles.
- Cooldown tras varios intentos fallidos de PIN.
- Avatares con emojis predefinidos para evitar subida de contenido.

## Tareas futuras (opcional)

- Modo perfiles bajo una cuenta padre.
- Límites por sesión/tiempo y recompensas.
- Vistas materializadas para estadísticas rápidas.

## Revisión del Confeti (UX)

Problema reportado: el confeti no termina de desaparecer y bloquea la visión/acción de la siguiente operación.

Acciones técnicas propuestas:

- Asegurar desmontaje/ocultado del confeti al transicionar a "Siguiente".
- Establecer `pointer-events: none` en overlays de confeti (CSS/Canvas) para no bloquear clics.
- Limpiar timers/intervalos y listeners de confeti en `useEffect` (cleanup) y al cambiar de problema.
- Unificar la duración (p. ej., 2s) y z-index adecuado para que no tape inputs.
- Mantener toggle en `localStorage` pero garantizar que el estado visual no persista tras cerrar el feedback.

Criterios de aceptación:

- El confeti desaparece en ≤2s tras respuesta correcta.
- No impide hacer clic en "Siguiente" ni escribir la respuesta del siguiente ejercicio.
- No genera overlays persistentes, ni consume CPU tras desaparecer.

Plan de implementación:

- Revisar `Exercise.tsx` y componentes `CSSConfetti`/`Confetti`.
- Añadir `pointer-events: none` al contenedor del confeti.
- Forzar cleanup al disparar `nextProblem` y al finalizar animación (timeout/Promise).
- Test manual y test de integración con `vi.useFakeTimers` asegurando desmontaje <2s y limpieza de listeners.
- Instrumentar logs controlados que permitan detectar duraciones superiores a lo esperado en producción.

## Entorno local de desarrollo

Nota: `venv` y `uv` son herramientas del ecosistema Python, no aplican directamente a este proyecto (Vite + React + Node).

Recomendación: usar gestor de versiones de Node y bloquear versión con `nvm` (alternativas: Volta, asdf).

Pasos propuestos:

- Añadir archivo `.nvmrc` con la versión de Node recomendada (v20).
- Documentar en README:
  - `nvm use`
  - `npm ci`
  - Variables de entorno: `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (archivo `.env.local`).
  - `npm run dev` para levantar el entorno local.

Opcional:

- Volta (`npm i -g volta`) para fijar versión por proyecto sin shell hooks.
- `corepack enable` y uso de `pnpm` si se quisiera acelerar instalaciones.

Checklist (añadir a fases 1/5):

- [x] Crear `.nvmrc` con Node 20 y documentar uso.
- [x] Verificar `npm run dev` levanta correctamente con variables.

---

## Estado Final del Proyecto

**Versión:** 1.0.0  
**Fecha de completación:** 2025-10-26  
**Commit:** 95fb636

### ✅ Implementaciones Completadas

**Autenticación:**
- Sistema completo con Supabase Auth
- Username único + PIN de 6 dígitos
- Avatares con emojis
- Trigger automático para crear perfiles
- Políticas RLS granulares (SELECT, INSERT, UPDATE)

**Persistencia:**
- Guardado inmediato (Solución C híbrida)
- Cada intento se guarda instantáneamente
- Cola offline con fallback automático
- Sincronización inteligente solo al login
- Funciones de stats inmutables (previenen doble conteo)

**Operación Mixta:**
- Implementada con orden PEMDAS
- Explicaciones paso a paso
- Integrada en estadísticas y modos de práctica
- Tests unitarios completos

**Mejoras de UI/UX:**
- Nombre sin tilde: "Pitagoritas"
- Botón "Salir" reposicionado y funcional
- Confeti y estrellas eliminados (bloqueaban UI)
- Layout responsive mejorado

**Documentación:**
- CHANGELOG.md con v1.0.0
- TECHNICAL.md completo (487 líneas)
- README.md actualizado (340 líneas)
- Archivos obsoletos eliminados

**CI/CD:**
- GitHub Actions con lint + test + typecheck + build
- Variables de entorno en Vercel
- Deploy automático desde main
- 32 tests pasando (~36% cobertura)

### 📋 Pendiente (opcional)

- [ ] QA manual exhaustivo en dispositivos móviles reales
- [ ] Monitoreo de telemetría en producción
- [ ] Optimizaciones de performance si necesario

### 📚 Referencias

- [CHANGELOG.md](./CHANGELOG.md) - Historial de versiones
- [TECHNICAL.md](./TECHNICAL.md) - Documentación técnica
- [README.md](./README.md) - Guía principal

---

**Proyecto completado exitosamente** ✅
