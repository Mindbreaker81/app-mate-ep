# AGENTS.md — Pitagoritas

App web para que niños de Primaria practiquen matemáticas. Autor: Edmundo Rosales Mayor (@Mindbreaker81). Proyecto privado.

## Stack y arquitectura

- **React 19 + TypeScript 5.8 (strict) + Vite 7 + Tailwind 3**. PWA (`vite-plugin-pwa`). Despliegue en Vercel (`dist/`).
- **Backend:** Supabase (Auth + PostgreSQL con RLS). Migraciones versionadas en `supabase/migrations/` (0001–0008). `attempts.operation` es texto libre y el progreso de habilidades vive en el JSON `game_state.data`: **las operaciones nuevas no necesitan migración**.
- **Estado:** `src/context/` (`AuthContext`, `GameContext`). Los intentos se guardan de inmediato en Supabase con cola local offline; el estado de juego (logros, récords, habilidades) va en `game_state` por usuario.
- **Generadores de problemas:** `src/utils/generators/` (un archivo por familia + `index.ts` como orquestador). `src/utils/problemGenerator.ts` es solo un reexport.
- **Camino de aprendizaje:** `skillCatalog.ts` (habilidades por área/tier con prerrequisitos), `skillProgress.ts` (motor de dominio: ventana de 12, mín. 10 intentos, ≥80 %, 2 días; repaso 1/3/7/14 d; nivel sube con 3 aciertos seguidos y baja con 2 fallos), `skillReport.ts`, `MyPath.tsx` (pestaña "Mi camino", sesión diaria, prueba de colocación). `contentStage.ts` deriva el tramo del contenido de un intento (repaso 4.º / ciclo 5.º–6.º T1-T2 / ampliación ESO T3) a partir de la operación, para que los informes no lo atribuyan al curso elegido.
- **Pistas:** `src/utils/hints.ts` (pistas graduales + detección de errores típicos + segundo intento en `Exercise.tsx`).
- Docs: `README.md`, `TECHNICAL.md`, `CHANGELOG.md`, `DATABASE_MIGRATION.md`, `docs/PLAN_6E_PRIMARIA.md`, `docs/PLAN_F6.md` (plan de F6 con decisiones aprobadas).

## Comandos (Node 20.18, ver `.nvmrc`)

```bash
npm install            # o npm ci
npm run dev            # Vite, http://localhost:5173
npm run typecheck      # tsc --noEmit — debe quedar en 0 errores
npm run lint           # eslint . --ext .ts,.tsx (ESLint 8, .eslintrc.cjs)
npm test -- --run      # vitest una pasada (sin --run entra en watch)
npm test -- --coverage --run   # igual que CI
npm run build          # typecheck + vite build
```

- `npm test` fija `TZ=Europe/Madrid` y `TAILWIND_DISABLE_SOURCE_MAP=1` vía `cross-env`: la zona horaria importa (rachas y semanas se calculan por calendario); no invocar `vitest`/`tsc` a pelo en CI.
- CI (`.github/workflows/ci.yml`): lint → typecheck → build → tests con cobertura, Node 20.
- Estado a 2026-11-01: typecheck y lint sin errores, **326 tests en verde** tras PIT-28, PIT-27 con `attempts.source` y el arreglo del interbloqueo de sesión en `AuthContext`.
- Variables de entorno: `.env` local (no versionado) con `VITE_SUPABASE_*`. No tocar `.env`.

## Reglas de trabajo

- **Pruebas primero:** test que falle → implementar → verde. Invariantes de generadores en `src/utils/__tests__/invariants.test.ts`.
- Commits en español estilo conventional (`feat:`, `fix:`, `docs:`…), un commit por entregable, entrada en `CHANGELOG.md` (sección «Sin publicar») y versión coherente en `package.json` (la UI la inyecta en build).
- **Prohibido sin aprobación del usuario:** `git push`, tocar `.env`, añadir dependencias, aplicar migraciones en Supabase.
- Gráficos: **SVG directo en React, sin librerías de charts**.
- Textos de UI en castellano.
- Funciones de `statsUtils`/`skillProgress` son puras e inmutables; no mutar estado.
- Cambios de esquema BD: nueva migración numerada + `DATABASE_MIGRATION.md`.

## Trampas de los generadores (leer antes de tocarlos)

1. `LEVELS[*].operations = SIXTH_GRADE_OPERATIONS` y `getAvailableOperations()` filtra por la lista del curso (`GRADE_CONFIGS`). **Una operación que no esté en la lista del curso nunca se genera.**
2. Checklist para **cada operación nueva**:
   - `OPERATION_KEYS` y la unión `Problem` en `src/types/index.ts`;
   - generador en `src/utils/generators/`;
   - en `generators/index.ts`: `switch` de `generateByOperation` (exhaustivo), `ALL_MODE_WEIGHTS`, `OPERATION_MAP` y `getDifficulty`;
   - `src/utils/problemUtils.ts`: reconocedores de tipo, `isPromptProblem`/`isMultipleChoiceProblem`, `allowsDecimalAnswer`, `allowsNegativeAnswer`, `answersMatch`, `formatProblemAnswer`;
   - render en `src/components/Exercise.tsx`;
   - etiqueta en `src/utils/operationLabels.ts` (debe cubrir **todas** las operaciones; el admin y «Te toca entrenar» la usan);
   - habilidad en `skillCatalog.ts` (cada operación pertenece a exactamente una habilidad; hay test de propiedad).
   - `statsUtils.ts` se adapta solo porque recorre `OPERATION_KEYS`.
3. `curriculumReview.test.ts` y `gradeExpansion.test.ts` fijan **recuentos exactos** de operaciones por curso: actualizarlos a propósito, nunca desactivarlos.
4. Invariantes que rompen fácil (cubiertas por `invariants.test.ts`): opción múltiple sin duplicados y con la correcta incluida; «ordena» sin valores equivalentes; **sin negativos en 4.º/5.º**; repartos «por igual»/«mitad» exactos; MCD no trivial; media y producto decimal exactos; estimación con una única opción claramente más cercana; entrada numérica estricta (`^-?\d+([.,]\d+)?$` — rechazar «77abc»); π declarado en el enunciado del círculo; fracción no simplificada se acepta con aviso salvo que el enunciado pida «(simplificada)».
5. Respuestas: `answersMatch`/`formatProblemAnswer` centralizan la comparación; en probabilidad se acepta decimal o fracción. Botón ± para negativos en móvil.

## Progreso y currículo

- **Modo libre por curso** (`GradeId`): `4t` (7 ops, repaso), `5e` (44), `6e` (65 = 5º + 21 exclusivas). El selector de curso solo afecta al modo libre. En 6.º existe además el modo «Ampliación ESO» (PIT-14): práctica el contenido T3 (`two-step-equation`, `inverse-proportion`) en modo libre **sin exigir prerrequisitos**; en «Mi camino» esas habilidades siguen exigiéndolos. Su categoría propia es «Ampliació ESO» (no presentarla como «6.º»); `contentStage.ts` clasifica esos intentos como `eso-extension` por tier de la operación, independiente del modo.
- **«Mi camino»** organiza las habilidades del **ciclo 5.º–6.º como un único ciclo** (Decret 175/2022); NO presentar T1/T2 como «5.º» y «6.º»:
  - **T1** = inicio del ciclo (5.º–6.º en conjunto)
  - **T2** = consolidación del ciclo (5.º–6.º en conjunto)
  - **T3** = «Ampliació ESO», puente a 1.º de ESO (enteros, ecuaciones de dos pasos, proporcionalidad inversa…); solo se ofrece con los prerrequisitos dominados.
- Implementado en `main` local (sin push): F0+F1 invariantes y correcciones (`548ebc4`), F2 catálogo/motor de dominio (`afd1aff`), F3 «Mi camino» (`eb898c2`), F4 pistas/segundo intento (`b33c03e`), F5 ampliación curricular ciclo + puente ESO (`6a8340b`), F7 docs (`cf95699`).
- **Publicado como 4.0.0** el 2026-11-01 y **4.1.0** el 2026-11-02 (modo libre «Ampliación ESO», PIT-14; equivalencias fracción–decimal–porcentaje, PIT-13). La migración 0008 se aplicó antes en Supabase cloud. Verificado el 2026-11-01 con Chrome headless y autenticación real (cuenta de prueba `pruebae2e`), en escritorio y móvil: colocación, sesión de hoy, pistas/reintento/simplificación, persistencia tras recarga (PIT-28), desbloqueo T3 y modo libre 4.º/5.º/6.º (PIT-9). Las incidencias menores de esa verificación (emoji duplicado y nombre accesible de las pestañas, StrictMode pisando el ejercicio restaurado, sesión completada que volvía a 0/10 al recargar, botón de la sesión desbordado en móvil) quedaron corregidas y verificadas con Chrome headless. F6 (mejoras opcionales: SVG gráficos/recta numérica/geometría visual, teclado en pantalla, panel padres, insignias por dominio, bilingüe, voz, más contenido ESO) en implementación según `docs/PLAN_F6.md` (PIT-12, PIT-15..PIT-23, PIT-29..PIT-32).
