# Plan de implementación — Pitagoritas v3.0 (6.º de Primaria)

Documento de diseño e implementación para añadir el curso **6.º de Primaria** (`6e`) a Pitagoritas.

**Estado:** Implementado (v3.0.0)  
**Versión objetivo:** `3.0.0`  
**Base:** Pitagoritas v2.0 (39 operaciones en 5.º, generadores modulares en `src/utils/generators/`)

---

## 1. Objetivo

Ampliar la app con un tercer curso escolar que cubra los contenidos típicos de **6.º de Primaria** en España, sin duplicar lo que ya hace bien el curso 5.º, sino añadiendo:

- Números enteros (negativos)
- Proporcionalidad y razones formales
- Ecuaciones simples
- Estadística ampliada y probabilidad
- Geometría de círculo y volumen
- Escalas, velocidad y problemas compuestos

**Meta pedagógica:** que un niño de 6.º pueda practicar lo que diferencia su curso del 5.º, manteniendo acceso a repaso de 4.º/5.º vía selector de curso.

---

## 2. Situación actual (v2.0)

| Curso | Operaciones | Modos práctica |
|-------|-------------|----------------|
| 4.º (`4t`) | 7 | 8 |
| 5.º (`5e`) | 39 | 20 |

**Archivos clave existentes:**

| Área | Ruta |
|------|------|
| Tipos | `src/types/index.ts` |
| Config curso/niveles | `src/utils/gameConfig.ts` |
| Modos práctica | `src/utils/practiceConfig.ts` |
| Generadores | `src/utils/generators/*.ts` |
| Orquestador | `src/utils/generators/index.ts` |
| Validación UI | `src/utils/problemUtils.ts` |
| Logros | `src/utils/achievementEngine.ts` |
| UI ejercicio | `src/components/Exercise.tsx` |
| Selector curso | `src/components/Home.tsx` |
| BD intentos | `supabase/migrations/0004_add_grade_to_attempts.sql` |

---

## 3. Contenido propuesto para 6.º

### 3.1 Herencia de cursos anteriores

```typescript
const SIXTH_GRADE_OPERATIONS: Operation[] = [
  ...FIFTH_GRADE_OPERATIONS,
  // + operaciones exclusivas 6.º (ver §3.2)
];
```

El curso `6e` **incluye todo 5.º** más bloques nuevos. Los modos de práctica de 5.º siguen disponibles; se añaden modos específicos de 6.º.

### 3.2 Operaciones nuevas (18 propuestas)

| # | Operación | Modo | Formato | Ejemplo |
|---|-----------|------|---------|---------|
| 1 | `integer-addition` | integers | numérico | `(-3) + 5 = 2` |
| 2 | `integer-subtraction` | integers | numérico | `4 - (-2) = 6` |
| 3 | `integer-multiplication` | integers | numérico | `(-3) × 4 = -12` |
| 4 | `integer-division` | integers | numérico | `(-12) ÷ 3 = -4` (exacta) |
| 5 | `integer-compare` | integers | opción múltiple | ¿Mayor: -5 o -2? |
| 6 | `integer-order` | integers | opción múltiple | Ordena -3, 0, 2, -1 |
| 7 | `simple-equation` | equations | numérico o `x` | `x + 7 = 15` → `8` |
| 8 | `ratio` | ratios | numérico | `2:3 = 8:?` → `12` |
| 9 | `proportion` | ratios | numérico | Tabla proporcional |
| 10 | `median` | statistics | numérico | Mediana de 5, 8, 3, 8, 6 |
| 11 | `mode` | statistics | numérico/texto | Moda de una lista |
| 12 | `range` | statistics | numérico | Rango (max − min) |
| 13 | `probability-simple` | probability | fracción o % | Probabilidad de sacar par en dado |
| 14 | `circle-area` | geometry-advanced | numérico | Área círculo r=5 (π≈3.14) |
| 15 | `circle-circumference` | geometry-advanced | numérico | Longitud circunferencia |
| 16 | `volume-rectangular-prism` | geometry-advanced | numérico | Volumen prisma 3×4×5 |
| 17 | `triangle-angle-sum` | geometry-advanced | numérico | Tercer ángulo si dos son 60° y 70° |
| 18 | `scale-conversion` | scales | numérico | Escala 1:1000, 4 cm → ? m |

**Total tras v3.0:** ~**57 operaciones** (39 + 18).

### 3.3 Modos de práctica nuevos

| Modo | Operaciones | Categoría UI |
|------|-------------|--------------|
| `integers` | 6 operaciones enteros | `sixth-grade-core` |
| `equations` | `simple-equation` | `sixth-grade-core` |
| `ratios` | `ratio`, `proportion` | `sixth-grade-core` |
| `probability` | `probability-simple` | `sixth-grade-applied` |
| `geometry-advanced` | círculo, volumen, ángulos triángulo | `sixth-grade-applied` |
| `scales` | `scale-conversion` | `sixth-grade-applied` |

Ampliar modo existente **`statistics`** con `median`, `mode`, `range` (además de `mean`).

Nueva categoría UI en `practiceConfig.ts`:

```typescript
export type PracticeModeCategory =
  | 'basic'
  | 'fractions-decimals'
  | 'advanced'
  | 'application'
  | 'sixth-grade-core'    // solo visible en 6e
  | 'sixth-grade-applied';
```

### 3.4 Contenido opcional (v3.1 — fuera del alcance inicial)

| Bloque | Operación | Notas |
|--------|-----------|-------|
| Coordenadas | `plot-point`, `read-coordinates` | UI con cuadrícula SVG |
| Divisibilidad | `divisibility-test` | Reglas del 2, 3, 5, 10 |
| Velocidad | `speed-distance-time` | Problemas verbales especializados |
| Potencias ampliadas | `power-general` | Exponentes > 3 |
| Gráficos | `read-bar-chart` | Imagen + pregunta |
| Secuencias | `number-sequence` | Patrones numéricos |

---

## 4. Decisiones de arquitectura

### 4.1 Tipo `GradeId`

```typescript
export type GradeId = '4t' | '5e' | '6e';
```

Actualizar en:

- `src/types/index.ts`
- `src/utils/gameConfig.ts` → `GRADE_CONFIGS`
- `src/context/GameContext.tsx` → `readStoredGrade()`
- `src/components/Home.tsx` → tercer botón de curso
- `src/services/attemptService.ts` → payload `grade`

### 4.2 Nuevos generadores

Crear archivos en `src/utils/generators/`:

```
integers.ts       # 6 operaciones con enteros
equations.ts      # ecuaciones de un paso
ratios.ts         # razones y proporcionalidad
statistics.ts     # ampliar con mediana, moda, rango (ya existe mean)
probability.ts    # probabilidad simple
geometryAdvanced.ts
scales.ts
```

Registrar en `generators/index.ts` con `switch` exhaustivo (`never`).

### 4.3 Nuevos tipos de problema

```typescript
export interface IntegerProblem {
  num1: number;
  num2: number;
  operation: 'integer-addition' | 'integer-subtraction' | 'integer-multiplication' | 'integer-division';
  answer: number;
  explanation: string;
}

export interface SimpleEquationProblem {
  prompt: string;           // "x + 7 = 15"
  operation: 'simple-equation';
  answer: number;           // valor de x
  explanation: string;
}

export interface RatioProblem {
  prompt: string;
  operation: 'ratio' | 'proportion';
  answer: number;
  explanation: string;
}

export interface ProbabilityProblem {
  prompt: string;
  options?: number[];       // opción múltiple si aplica
  operation: 'probability-simple';
  answer: number | Fraction;
  explanation: string;
}

export interface CircleProblem {
  prompt: string;
  radius: number;
  operation: 'circle-area' | 'circle-circumference';
  answer: number;
  usePi: 3.14 | 3.1416;
  explanation: string;
}
```

Ampliar `SerializedAnswer` y `answersMatch()` en `problemUtils.ts`.

### 4.4 Constante π en geometría

Usar **`π = 3.14`** en niveles 1–5 y **`π = 3.1416`** en 6–10, documentado en enunciado:  
*"Usa π = 3.14"* para evitar ambigüedad.

### 4.5 Pesos modo `all` (6.º)

```typescript
// Nuevas operaciones con peso bajo al inicio
'integer-addition': 1,
'simple-equation': 0.8,
'probability-simple': 0.6,
// Operaciones 5.º mantienen pesos actuales
```

### 4.6 Niveles (`LEVELS`)

Opción A (recomendada): reutilizar los 10 niveles actuales con rangos ampliados para 6.º:

| Campo nuevo (opcional) | Uso en 6.º |
|------------------------|------------|
| `maxIntegerAbsolute` | 20 → 100 según nivel |
| `maxEquationResult` | 20 → 200 |
| `maxCircleRadius` | 10 → 20 |
| `allowNegativeIntermediate` | false en niv. 1–3 |

Añadir helper `resolveSixthGradeLimits()` en `generators/shared.ts`.

---

## 5. Cambios de UI

### 5.1 `Home.tsx`

- Tercer botón: **6.º de Primaria**
- Texto resumen: "Enteros, ecuaciones, proporcionalidad, probabilidad y geometría avanzada"

### 5.2 `Exercise.tsx`

| Tipo | UI |
|------|-----|
| Enteros | Mostrar paréntesis en negativos: `(-3) + 5` |
| Ecuaciones | Enunciado + campo "x = ?" |
| Probabilidad | Opción múltiple o fracción |
| Círculo | Enunciado con radio y π indicado |
| Escala | Enunciado textual |

Extraer subcomponente `IntegerInput` si `Exercise.tsx` supera ~450 líneas.

### 5.3 `PracticeModes.tsx`

Mostrar categorías `sixth-grade-core` y `sixth-grade-applied` solo cuando `grade === '6e'`.

---

## 6. Logros nuevos (8 propuestos)

| ID | Nombre | Condición |
|----|--------|-----------|
| `integer_master` | Maestro de Enteros | 10 aciertos en operaciones `integer-*` |
| `equation_solver` | Cazador de Incógnitas | 10 aciertos en `simple-equation` |
| `ratio_expert` | Experto en Proporciones | 10 aciertos en `ratio`/`proportion` |
| `stats_complete` | Estadístico Completo | 5 aciertos en cada: mean, median, mode, range |
| `probability_lucky` | Suerte Calculada | 10 aciertos en probabilidad |
| `circle_master` | Amigo del Círculo | 10 aciertos en área/circunferencia |
| `sixth_grade_explorer` | Explorador 6.º | 1 acierto en cada modo exclusivo 6.º |
| `level_10_sixth` | Toque de Queda | Nivel 10 en curso 6.º |

Actualizar `achievementEngine.ts` con `switch` exhaustivo.

---

## 7. Base de datos

### 7.1 Migración `0005_validate_grade_6e.sql`

La columna `grade` ya existe (v2.0). Opcionalmente añadir constraint:

```sql
-- Opcional: validar valores permitidos
alter table public.attempts
  drop constraint if exists attempts_grade_check;

alter table public.attempts
  add constraint attempts_grade_check
  check (grade in ('4t', '5e', '6e'));
```

### 7.2 Documentación BD

Actualizar `DATABASE_MIGRATION.md` con sección **v3.0** y crear entrada en changelog.

---

## 8. Plan de implementación por PRs

| PR | Contenido | Dependencias |
|----|-----------|--------------|
| **PR-1** | Tipos, `GradeId`, selector 6.º en Home, config base `6e` sin generadores | — |
| **PR-2** | `integers.ts` + tests + UI | PR-1 |
| **PR-3** | `equations.ts` + tests + UI | PR-1 |
| **PR-4** | `ratios.ts` + tests | PR-1 |
| **PR-5** | Ampliar `statistics.ts` (mediana, moda, rango) | PR-1 |
| **PR-6** | `probability.ts` + UI opción múltiple | PR-1 |
| **PR-7** | `geometryAdvanced.ts` + `scales.ts` | PR-1 |
| **PR-8** | Logros, pesos `all`, niveles 6.º | PR-2…PR-7 |
| **PR-9** | Documentación + migración BD + bump `3.0.0` | PR-8 |

**Orden de valor visible:** PR-2 (enteros) → PR-3 (ecuaciones) → PR-4 (razones) → resto.

---

## 9. Documentación a actualizar

Al completar la implementación, revisar y alinear **todos** estos archivos:

| Archivo | Cambios |
|---------|---------|
| `README.md` | Curso 6.º, ~57 operaciones, modos nuevos, migración 0005 |
| `CHANGELOG.md` | Entrada `[3.0.0]` con lista completa |
| `TECHNICAL.md` | `GradeId`, generadores nuevos, diagrama cursos |
| `DATABASE_MIGRATION.md` | Sección v3.0, constraint `6e` |
| `src/components/Help.tsx` | Bullets de contenido 6.º |
| `docs/PLAN_6E_PRIMARIA.md` | Marcar estado → **Implementado** |
| `package.json` | `"version": "3.0.0"` |

### Plantilla entrada CHANGELOG

```markdown
## [3.0.0] - YYYY-MM-DD

### Añadido
- Curso 6.º de Primaria (`6e`) con 18 operaciones nuevas
- Modos: enteros, ecuaciones, razones, probabilidad, geometría avanzada, escalas
- 8 logros nuevos
- Migración BD opcional para constraint grade

### Cambiado
- Estadística: mediana, moda y rango además de media
- Selector de curso: tres opciones (4.º, 5.º, 6.º)
```

---

## 10. Estrategia de tests

### 10.1 Archivos nuevos

```
src/utils/__tests__/sixthGrade/integers.test.ts
src/utils/__tests__/sixthGrade/equations.test.ts
src/utils/__tests__/sixthGrade/ratios.test.ts
src/utils/__tests__/sixthGrade/statistics.test.ts
src/utils/__tests__/sixthGrade/probability.test.ts
src/utils/__tests__/sixthGrade/geometryAdvanced.test.ts
src/utils/__tests__/sixthGrade/scales.test.ts
src/utils/__tests__/sixthGrade/gradeIsolation.test.ts  # 6e no filtra a 4t/5e
```

### 10.2 Casos mínimos por generador

- Respuesta correcta matemáticamente
- Explicación no vacía
- Rangos respetan nivel
- Enteros: al menos un operando negativo en suma/resta
- Ecuaciones: solución entera positiva en niveles bajos
- Círculo: usar π declarado en enunciado
- Aislamiento: `generateProblem(n, 'all', '4t')` nunca devuelve operaciones `6e`-only

### 10.3 Tests existentes a actualizar

- `gradeExpansion.test.ts` — sin cambios de comportamiento 5.º
- `GameContext.test.tsx` — `grade: '6e'` en payload
- `attemptService.test.ts` — `grade: '6e'`
- `Home.test.tsx` — tercer botón curso
- `Exercise.test.tsx` — smoke de ecuación o entero

---

## 11. Verificación completa (Definition of Done)

Ejecutar **toda** esta checklist antes de cerrar v3.0 y mergear a `main`.

### 11.1 Build y calidad estática

```bash
npm install
npm run typecheck          # 0 errores
npm run lint               # 0 errores bloqueantes
npm test                   # 100% suites pasando
npm run build              # build de producción OK
```

### 11.2 Tests automatizados — criterios

- [ ] ≥ 70 tests totales (actual ~51 + ~20 nuevos)
- [ ] Cobertura `src/utils/generators/` ≥ 80%
- [ ] Test de aislamiento: operaciones 6.º no aparecen en 4.º/5.º
- [ ] Test de herencia: operaciones 5.º sí aparecen en 6.º modo `all`
- [ ] Todos los `switch` sobre `Operation` usan `never` en default

### 11.3 Verificación funcional manual (navegador)

Usar curso **6.º de Primaria**, nivel manual **5**, recorrer cada modo nuevo:

| # | Modo | Comprobar |
|---|------|-----------|
| 1 | Enteros | Enunciado con negativos, respuesta correcta/incorrecta, explicación |
| 2 | Ecuaciones | Campo numérico, `x + n = m` |
| 3 | Razones | Proporción `a:b = c:?` |
| 4 | Estadística | Mediana, moda, rango (además de media) |
| 5 | Probabilidad | Opción múltiple o fracción |
| 6 | Geometría avanzada | Área y circunferencia con π indicado |
| 7 | Escalas | Conversión escala 1:n |
| 8 | Todas | Mezcla equilibrada sin dominar solo un tipo |
| 9 | Cambio curso | Pasar 5.º ↔ 6.º resetea problema y modos inválidos |
| 10 | Nivel manual | Subir a 10 en 6.º aumenta dificultad numérica |

### 11.4 Persistencia y datos

- [ ] Intentos en Supabase incluyen `grade: '6e'`
- [ ] Migración `0005` aplicada en entorno de prueba (o documentado skip)
- [ ] Cola offline sincroniza intentos 6.º al reconectar
- [ ] Estadísticas registran operaciones nuevas en `operationStats`

### 11.5 Gamificación

- [ ] Al menos 1 logro 6.º desbloqueable en sesión de prueba
- [ ] Logros existentes no se rompen al añadir ids nuevos
- [ ] Rachas y puntuación funcionan igual que en 5.º

### 11.6 UI / accesibilidad

- [ ] Selector 3 cursos visible en móvil
- [ ] Categorías práctica 6.º no aparecen en 4.º/5.º
- [ ] `aria-label` en inputs de ecuaciones y enteros
- [ ] Feedback error/correcto con explicación paso a paso

### 11.7 Documentación

- [ ] README lista 3 cursos y ~57 operaciones
- [ ] CHANGELOG `[3.0.0]` completo
- [ ] Help menciona 6.º
- [ ] TECHNICAL refleja generadores nuevos
- [ ] DATABASE_MIGRATION incluye `6e`
- [ ] Este plan marcado como implementado con fecha

### 11.8 Regresión cursos anteriores

- [ ] 4.º: solo 7 operaciones en modo `all` (muestreo 30 ejercicios)
- [ ] 5.º: operaciones v2.0 intactas (decimales, problemas, geometría básica)
- [ ] Cambiar de 6.º a 4.º oculta modos exclusivos

### 11.9 CI/CD

- [ ] GitHub Actions verde en la rama del PR
- [ ] Preview deploy (Vercel) carga sin errores de consola
- [ ] Versión en UI muestra `3.0.0`

---

## 12. Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| Enteros confunden en UI | Paréntesis obligatorios en negativos; colores neutros |
| π genera respuestas ambiguas | Fijar π en enunciado; tolerancia en `numbersEqual` |
| `Exercise.tsx` crece demasiado | Subcomponentes por tipo de problema |
| Demasiados modos en 6.º | Categorías colapsables en `PracticeModes` |
| Stats rotas con nuevas ops | `OPERATION_KEYS` como fuente única en `statsUtils` |
| BD sin constraint | App funciona; constraint es opcional en 0005 |

---

## 13. Roadmap post-v3.0 (v3.1+)

1. Coordenadas en el plano (SVG)
2. Gráficos estadísticos (lectura)
3. Problemas velocidad/distancia/tiempo
4. Divisibilidad explícita
5. Repetición espaciada según `operationStats` (fallos frecuentes)

---

## 14. Resumen ejecutivo

| Métrica | v2.0 (actual) | v3.0 (objetivo) |
|---------|---------------|-----------------|
| Cursos | 2 | 3 |
| Operaciones máx. | 39 | ~57 |
| Modos práctica | 20 | ~26 |
| Logros | 21 | ~29 |
| Generadores | 14 archivos | ~21 archivos |
| PRs estimados | — | 9 |

**Primer entregable de valor:** curso 6.º con **enteros + ecuaciones + razones** (PR-1 a PR-4).

---

*Documento creado: 2026-07-01 · Pitagoritas · Plan v3.0*
