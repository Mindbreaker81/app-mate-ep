# Plan F6 — Mejoras educativas opcionales

Fecha: 2026-11-01. Proyecto YouTrack PIT, épica [PIT-12](https://youtrack.int.mindbreaker81.eu/issue/PIT-12).

Documento de planificación: no implementa código, no aplica migraciones ni modifica estados. Los nombres de archivos nuevos y operaciones son propuestas concretas para la implementación; los demás corresponden a archivos revisados. F6 se prepara sobre main local mientras se publica 4.0.0: no cambiar la release en curso.

## Decisiones aprobadas (2026-11-02)

El usuario aprueba las recomendaciones del plan:

- **PIT-18:** teclado matemático opcional, abierto por el niño; no sustituye al teclado nativo.
- **PIT-15/PIT-16/PIT-17:** MVP mínimo: lectura de puntos en la recta (sin arrastre); geometría solo en el primer cuadrante con simetrías, traslaciones y coordenadas; pictogramas con símbolos completos.
- **PIT-20:** medallas permanentes por hito de dominio; conjunto inicial de áreas según el plan.
- **PIT-19 (PIT-29/PIT-30):** panel solo para el administrador. Si PIT-29 necesita migración (RPC), se prepara y se pide aprobación antes de aplicarla.
- **PIT-22 (PIT-31/PIT-32):** examen sin tiempo por defecto, MVP con resultados locales (sin migración); voz en castellano primero.
- **PIT-21:** glosario de términos (sin traducir la app); revisión del vocabulario por la familia.
- **PIT-23:** se aprueban las tres familias iniciales propuestas y su inclusión en el modo libre «Ampliación ESO».

## Base comprobada

- Leídos AGENTS.md, package.json, tipos, generadores, Exercise/Home/MyPath, motor de dominio/logros, servicios e informes administrativos y migraciones 0006–0008. Al iniciar esta planificación el árbol estaba limpio y main figuraba 17 commits por delante de origin/main; package.json aún indicaba 3.1.1. La publicación 4.0.0 está en curso según el encargo; no se considera publicada sin su verificación.
- Al cerrar la planificación, un proceso paralelo había publicado `abb5db5` (4.0.0) y main ya coincidía con origin/main; no se verificó aquí el despliegue. Había cambios ajenos sin commit en `src/types/index.ts`, `src/utils/generators/index.ts` y `src/utils/__tests__/sixthGrade.test.ts` para el modo libre `eso-extension`. Se inspeccionaron solo para coordinar el plan; este trabajo no los modificó. Antes de implementar PIT-23, volver a leer su integración definitiva, `practiceConfig.ts` y los recuentos de modos. La referencia inicial de 3.1.1 describe el comienzo de la planificación, no la versión de cierre.
- F0–F5 y PIT-24..28 están incorporados: conservar validación exacta, segundo intento, pausa, restauración diaria por usuario/dispositivo y compatibilidad histórica.
- attempts.source admite free, path, daily-session y placement; placement está reservado y hoy no guarda intentos. La migración 0008 ya existe: no editarla para añadir funcionalidades futuras.
- contentStage.ts separa curso elegido de tramo del contenido: T1/T2 son el ciclo 5.º–6.º completo; T3 es ampliación ESO. Las nuevas operaciones requieren propietario único en skillCatalog.ts. No atribuir automáticamente T1 a 5.º ni T2 a 6.º.
- adminService ya obtiene intentos con source, pero game_state tiene RLS solo para el propietario. El informe por habilidad actual agrega aciertos/tiempos: no equivale a dominio persistido. La sesión diaria reanudable se guarda localmente por usuario, no entre dispositivos.
- Las potencias actuales solo admiten exponentes 2/3. No hay librería de gráficos instalada; el gráfico semanal administrativo actual usa CSS, y no hace falta reescribirlo como parte de F6.

## Límites y reglas comunes

1. Gráficos nuevos exclusivamente SVG directo en React, con alternativa textual equivalente, título/descripción, ejes/unidades/leyendas y controles utilizables por teclado. Sin librerías de charts, editor de fórmulas ni dependencia npm nueva en el alcance recomendado.
2. Textos de interfaz en castellano; el glosario añade términos catalanes sin traducir toda la aplicación. Los ejercicios mantienen números exactos, coma/punto aceptados y reglas actuales de signo/fracciones.
3. Para cada operación nueva: registrar OPERATION_KEYS/Problem, generador y orquestación (switch exhaustivo, pesos, mapa y dificultad), filtros/modos de curso, propietario y prerrequisitos de habilidad, validación/serialización, etiquetas, render y pistas. Actualizar recuentos curriculares solo si cambia su contenido; no desactivar sus tests.
4. Verificar payloads nuevos en restauración de dailySessionStorage, intentos offline y datos históricos; no cambiar IDs de habilidades/operaciones/logros existentes para reutilizarlos con otro significado.
5. **Las migraciones y dependencias nuevas quedan pendientes de aprobación expresa antes de incorporarlas o aplicarlas**, conforme a este encargo. Una vez autorizada, cada migración usa el siguiente número libre **en el momento de implementar**, se documenta en DATABASE_MIGRATION.md y se revisa antes de aplicarla en Supabase. Ninguna dependencia npm nueva se propone como necesaria. No tocar .env ni hacer push/deploy como parte de esta planificación.
6. Al implementar: pruebas de regresión pertinentes primero, npm run lint, npm run typecheck, npm test -- --run y npm run build. Para cambios visuales/interacción, pruebas reales de teclado, móvil/tablet y escritorio además de Testing Library. No se ejecutan tests en esta tarea de planificación.
7. Los SVG restaurados no deben regenerar datos ni filtrar soluciones en atributos accesibles. El feedback y las alternativas accesibles deben representar la misma información, sin resolver la pregunta por el niño.

## Estimaciones y orden

S: hasta 1 jornada; M: 2–3 jornadas; L: 4–6 jornadas de implementación y validación. Son tamaños orientativos, no compromisos de fecha; excluyen esperas de aprobación, revisión curricular y publicación. PIT-19/PIT-22 agrupan trabajo desglosado: no sumar sus estimaciones a las de sus tareas nuevas.

| Orden | Entrega | Tamaño | Dependencia real / condición |
|---|---|---|---|
| 0 | Publicación y comprobación de 4.0.0 (PIT-11, ya existente) | fuera de F6 | Condición de salida de la épica; no se cambia su estado |
| 1 | PIT-18 teclado; PIT-21 glosario en paralelo | M / S | Base actual; extracción de controles en PIT-18 |
| 2 | PIT-15 recta y marco SVG accesible | M | PIT-18, reutiliza controles extraídos |
| 3 | PIT-17 gráficos/pictogramas | M | PIT-15 para marco SVG |
| 4 | PIT-16 geometría visual | L | PIT-15 para marco SVG; puede solaparse con PIT-17 en generadores |
| 5 | PIT-20 insignias | M | Motor F2 existente (PIT-4); se puede adelantar en paralelo |
| 6 | PIT-19 → PIT-29 acceso y PIT-30 panel | L total | PIT-30 depende de PIT-29; aprobación de acceso/migración |
| 7 | PIT-22 → PIT-31 voz y PIT-32 examen | L agrupado | Independientes entre sí; examen persistido necesita decisión/migración |
| 8 | PIT-23 ampliación ESO | L | Base F5 y aprobación del contenido; no depende del panel o del audio |

El orden expresa prioridad y minimiza conflictos de Exercise.tsx/skillCatalog.ts/GameContext.tsx; solo las dependencias indicadas como reales se enlazan como bloqueo. No bloquear glosario, insignias, voz o ESO por entregas que no necesitan. Coordinar un único responsable de integración de tipos/Exercise por lote.

## Desglose de las tareas grandes

Se crean solo cuatro tareas adicionales, todas subtareas directas de PIT-12, como las nueve existentes:

- PIT-29: acceso administrativo mínimo al dominio (M), parte de PIT-19.
- PIT-30: vista familiar de dominio y resumen semanal (M), parte de PIT-19; depende de PIT-29.
- PIT-31: lectura voluntaria de enunciados (M), parte de PIT-22.
- PIT-32: repaso de examen con resultados diferidos (L), parte de PIT-22.

PIT-19 y PIT-22 quedan como coordinación/aceptación de sus dos entregables, sin duplicar el trabajo. PIT-16/PIT-23 son L pero tienen un alcance homogéneo y finito; no se añaden más issues para evitar un backlog redundante. No se cambian estados.

## PIT-15 — Recta numérica visual

**Estimación:** M. **Orden:** 2. **Dependencias de implementación:** PIT-18.

### Alcance

Crear un marco SVG accesible reutilizable (viewBox, título/descripción y alternativa textual) y dos operaciones acotadas: `number-line-decimal` (T1, décimas/centésimas) y `number-line-integer` (T2, enteros). Leer la posición de un punto con escala y marcas explícitas; respuesta numérica mediante controles comunes, sin arrastrar como requisito. El punto no incluye su valor como etiqueta que revele la solución. Paso y posiciones se calculan con enteros escalados para evitar errores de coma flotante. Modo libre: decimales en 5.º/6.º; negativos solo en 6.º. Mi camino respeta prerrequisitos del tramo.

### Archivos previstos

Nuevos `src/components/visuals/VisualProblemFrame.tsx`, `NumberLine.tsx`, `src/utils/generators/numberLine.ts`; `src/types/index.ts`, `src/utils/generators/index.ts`, `gameConfig.ts`, `practiceConfig.ts`, `skillCatalog.ts`, `problemUtils.ts`, `operationLabels.ts`, `hints.ts`, `src/components/Exercise.tsx`. Tests nuevos de generador/componente y recuentos curriculares existentes.

### Migraciones y dependencias nuevas

No. Las operaciones nuevas caben en attempts.operation y el progreso en game_state.data. Sin dependencia npm.

### Criterios de aceptación

- Cada punto corresponde exactamente a su escala; incluye cero, extremos, negativos y decimales sin redondeos ambiguos.
- Teclado, botones y lector de pantalla permiten resolver la misma tarea que el SVG; no se exige precisión táctil; no hay desbordamiento a 360 px.
- Generación de 4.º/5.º no introduce negativos; las dos operaciones tienen un único propietario en el catálogo, pistas y explicación.
- Pistas, segundo intento, cambio de pestaña y sesión restaurada funcionan con el payload SVG.

### Tests y verificación previstos

Invariantes por nivel de escala/posición/respuesta; casos deterministas de décimas, centésimas y extremos; Testing Library para nombre accesible y envío; ida y vuelta JSON de dailySessionStorage; regresión de filtros de curso y propietario único. Chrome móvil/escritorio a 360/390 px y teclado.

### Decisión de producto

Aprobar el MVP de lectura de puntos. El arrastre interactivo queda fuera de esta entrega.

## PIT-16 — Geometría visual

**Estimación:** L. **Orden:** 4. **Dependencias de implementación:** PIT-15.

### Alcance

Familia homogénea de ejercicios SVG con tres operaciones: `coordinate-value` (leer x o y de un punto, una respuesta numérica), `plane-transform` (elegir entre figuras tras simetría horizontal/vertical o traslación entera) y `shape-classification` (clasificación con categorías excluyentes explícitas). Primer cuadrante y cuadrícula de 0–10 para 5.º/6.º, T2 con prerrequisitos de geometría y recta; no añade negativos a 5.º. Sin edición libre de polígonos, rotaciones arbitrarias ni entrada de pares de coordenadas en este MVP.

### Archivos previstos

Nuevos `src/components/visuals/CoordinateGrid.tsx`, `GeometryDiagram.tsx`, `src/utils/generators/geometryVisual.ts`; integración en `src/types/index.ts`, `generators/index.ts`, `gameConfig.ts`, `practiceConfig.ts`, `skillCatalog.ts`, `problemUtils.ts`, `operationLabels.ts`, `hints.ts`, `Exercise.tsx` y tests curriculares.

### Migraciones y dependencias nuevas

No; sin dependencia nueva. Reutiliza el marco SVG de PIT-15.

### Criterios de aceptación

- Transformaciones calculadas desde coordenadas de vértices; figuras dentro de la cuadrícula y opciones diferentes con una sola respuesta válida.
- Se explicita la clasificación usada (p. ej. por lados), sin respuestas correctas múltiples por inclusión de clases.
- Figuras no dependen solo del color; ejes, unidades, puntos y opciones tienen nombres/texto equivalentes accesibles.
- Cada operación aparece en práctica y habilidad previstas, se serializa y tiene pista y explicación sin revelar la respuesta antes de tiempo.

### Tests y verificación previstos

Funciones puras de reflexión/traslación y clasificación, identidad de figuras y distractores únicos; invariantes para todos los niveles; componente con teclado y respuestas; serialización/restauración SVG y recuentos de operaciones; móvil y lector de pantalla.

### Decisión de producto

Confirmar primer cuadrante y las tres familias como límite inicial. Rotaciones y plano con cuatro cuadrantes se posponen.

**Resultado de implementación (2026-11-02):** las tres operaciones (`coordinate-value`,
`plane-transform`, `shape-classification`) en el modo «Geometría Visual» (5.º y 6.º,
T2, habilidad única `geometria-visual` con prerrequisitos `geometria-basica` y
`recta-decimales`). Simetrías SOLO sobre rectas verticales/horizontales del primer
cuadrante (los ejes sacarían la figura del cuadrante) y opciones de figuras como
letras A/B/C con vértices listados en la alternativa textual; clasificación
excluyente por número de lados. Render en `ProblemBody` con `CoordinateGrid`/
`GeometryDiagram`. Insignia de área «medidas» sube a v2. Recuentos: 5.º 50,
6.º 75 (25 exclusivas); 30 modos.

## PIT-17 — Gráficos de barras y pictogramas

**Estimación:** M. **Orden:** 3. **Dependencias de implementación:** PIT-15.

### Alcance

Añadir `bar-chart-reading` y `pictogram-reading` en T2: 3–5 categorías, frecuencias enteras, lectura de frecuencia, total y diferencia; categoría más frecuente solo con máximo único y opciones textuales. Pictogramas de unidades completas, con leyenda explícita 1 símbolo = 1/2/5 elementos; sin medias figuras ni barras truncadas. Payload estructurado separa datos, representación y pregunta; la misma tabla textual sirve de alternativa al SVG.

### Archivos previstos

Nuevos `src/components/visuals/BarChart.tsx`, `Pictogram.tsx`, `src/utils/generators/dataCharts.ts`; `types/index.ts` (DataChartProblem con respuesta numérica/opción), `generators/index.ts`, `gameConfig.ts`, `practiceConfig.ts`, `skillCatalog.ts`, `problemUtils.ts`, `operationLabels.ts`, `hints.ts`, `Exercise.tsx` y tests.

### Migraciones y dependencias nuevas

No; sin dependencia npm. SVG directo, reutilizando PIT-15. No sustituye el gráfico administrativo existente, que hoy usa barras CSS.

### Criterios de aceptación

- Barras empiezan en cero, altura proporcional a la frecuencia y escala común; leyenda del pictograma coincide con sus símbolos y datos.
- Totales y diferencias exactos; preguntas de máximo tienen solución única; valores cero, etiquetas largas y máximos se muestran correctamente.
- Tabla equivalente accesible, sin depender del color o tooltip; lectura viable a 360 px.
- Datos y respuesta sobreviven a la restauración de sesión sin regenerar otro gráfico.

### Tests y verificación previstos

Invariantes de sumas, diferencias, escalas, leyendas y opciones; componentes con ceros, etiquetas largas y teclado; JSON/restauración, modo libre/camino y catálogo; móvil/escritorio.

### Decisión de producto

Confirmar símbolos completos como MVP; escalas partidas o medias figuras quedan fuera.

**Resultado de implementación (2026-11-02):** `bar-chart-reading` y `pictogram-reading`
generados en `dataCharts.ts` dentro del modo «Estadística» (5.º y 6.º, T2, habilidad
única `graficos-datos` con prerrequisito `sumas-restas`); render en `ProblemBody`
con `BarChart`/`Pictogram` (SVG + tabla equivalente, leyenda visible, eje de 2 en 2,
barras sin etiqueta de valor). Insignia de área «datos» sube a v2.
Recuentos: 5.º 47, 6.º 72 (con PIT-23).

## PIT-18 — Teclado matemático en pantalla

**Estimación:** M. **Orden:** 1. **Dependencias de implementación:** ninguna nueva dentro de F6.

### Alcance

Extraer los controles de respuesta actuales y añadir un teclado opcional contextual con dígitos, borrar, coma/punto decimal y ± cuando el problema lo permita. En fracciones y mixtos, '/' cambia de numerador a denominador en los campos existentes; no introduce una gramática nueva ni evalúa expresiones. En cociente/resto permite cambiar de campo. Conservar teclado físico y entrada nativa; factorizar sigue usando la validación existente (× como separador normalizado).

### Archivos previstos

Nuevos `src/components/inputs/MathKeyboard.tsx`, `AnswerInputs.tsx`, `src/utils/answerEditing.ts`; extraer/adaptar `PromptInput`, `NumericInput`, `FractionInputs`, `MixedNumberInputs` de `Exercise.tsx`; integrar en `MyPath.tsx` para colocación; tests de flujo/negativos y nuevos de edición.

### Migraciones y dependencias nuevas

No; sin dependencia nueva. Preferencia opcional local por usuario, sin ampliar esquema remoto.

### Criterios de aceptación

- Inserción y borrado respetan cursor/selección; botón no envía formulario por accidente y conserva campo activo.
- Solo se habilitan símbolos válidos para el tipo de respuesta; se aceptan coma y punto y se rechazan entradas parciales al enviar según el validador existente.
- Fracciones, mixtos y resto conservan campos y etiquetas; ± no aparece en operaciones que no admiten negativos.
- Teclas de al menos 44×44 px, navegación y nombres accesibles; no se pierde respuesta al cambiar pestaña o restaurar sesión.

### Tests y verificación previstos

Casos puros de edición, selección, vacío y cambio de signo; integración para número, decimal, entero, fracción, mixto, resto y colocación; regresiones de teclado físico y envío; prueba móvil con teclado nativo y pantalla táctil.

### Decisión de producto

Recomendado: teclado opcional abierto por el niño; no sustituir forzosamente el teclado nativo.

## PIT-19 — Panel familiar: dominio por habilidad

**Estimación:** L. **Orden:** 6. **Dependencias de implementación:** PIT-29, PIT-30.

### Alcance

Primera versión para el administrador único ya existente: mostrar dominio real, prerrequisitos, repasos pendientes y resumen semanal del niño seleccionado. Reutilizar informes de intentos, source y contentStage. No inventar dominio a partir de porcentajes ni diagnosticar errores típicos que adminService no consulta. El acceso multiusuario de familias, invitaciones y vínculos adulto-niño queda fuera hasta una decisión explícita. Se desglosa en PIT-29 (acceso) y PIT-30 (vista); esta issue coordina la aceptación, sin duplicar implementación.

### Archivos previstos

`src/services/adminService.ts`, `src/components/admin/AdminDashboard.tsx`, nuevo `SkillMasteryView.tsx`, `src/utils/skillReport.ts`; reutilizar `skillProgress.ts`, `childReport.ts`, `weeklyTrend.ts`, `contentStage.ts`. Migración nueva de acceso mínimo y `DATABASE_MIGRATION.md`; tests de servicio, UI y RLS.

### Migraciones y dependencias nuevas

SÍ: el admin puede leer attempts/profiles (0006), pero game_state solo permite acceso al propietario (0007). Proponer RPC de lectura limitada a skills y updated_at, con is_admin y permisos mínimos. Aplicación PROHIBIDA sin aprobación explícita. Reservar el siguiente número libre, sin editar 0006/0007/0008. Sin dependencia npm.

### Criterios de aceptación

- Admin obtiene solo el progreso del niño solicitado; anon/niño no obtienen estado ajeno; ninguna escritura o credencial expuesta.
- Dominio usa deriveSkillState y prerrequisitos, con fecha local; repaso pendiente se distingue de falta de dominio y de ausencia de datos.
- Resumen semanal distingue práctica libre/camino y tramo del contenido; datos históricos sin source siguen la compatibilidad actual.
- Cambiar de niño cancela/ignora cargas previas; errores, vacío y sin permisos se muestran claramente; UI responsive y accesible.

### Tests y verificación previstos

PIT-29: probar RPC con admin, anon, propietario y otro niño en BD desechable; servicio/error. PIT-30: agregación y dominio, fecha/repaso, cambio de niño con respuesta tardía, origen/tramo y ausencia de datos; recorrido real autorizado. No aplicar migración ahora.

### Decisión de producto

Elegir admin único (recomendado para este MVP) o cuentas familiares vinculadas. La segunda opción exige rediseñar alcance y permisos antes de implementar; autorizar la migración por separado.

## PIT-20 — Insignias por dominio

**Estimación:** M. **Orden:** 5. **Dependencias de implementación:** ninguna nueva dentro de F6.

### Alcance

Añadir insignias con IDs estables `mastery:<skillId>` al alcanzar dominio efectivo de una habilidad; insignia de área solo cuando todas las habilidades de un conjunto explícito y versionado cumplen sus prerrequisitos y dominio. Se mantiene como reconocimiento de dominio alcanzado: un repaso pendiente no retira una medalla. Evaluar tras registrar intento y tras hidratar/fusionar progreso. Los logros existentes, incluido level_10 por puntuación, conservan semántica e IDs.

### Archivos previstos

`src/utils/achievementEngine.ts` o nuevo `masteryAchievements.ts`, `skillProgress.ts` (reutilizar), `skillCatalog.ts`, `src/context/GameContext.tsx`, `src/components/Achievements.tsx`, `AchievementToast.tsx`, `src/types/index.ts` si se etiqueta tipo; tests de logros, hidratación y merge.

### Migraciones y dependencias nuevas

No: achievements ya se persiste en game_state.data. Sin dependencia. Añadir campos opcionales solo si hacen falta, con compatibilidad de datos antiguos.

### Criterios de aceptación

- No se concede dominio con 9 intentos o en un solo día; se respetan umbral vigente, ventana y prerrequisitos.
- Un ID se concede una sola vez; no duplica notificación al hidratar, recargar o fusionar dos dispositivos.
- Insignia de área usa conjunto versionado: nuevas habilidades no eliminan medallas históricas; el repaso pendiente no revoca el reconocimiento.
- No cambia level_10 ni convierte aciertos acumulados en dominio; la UI explica cómo se obtiene cada insignia.

### Tests y verificación previstos

Límites 9/10 intentos, 79/80%, uno/dos días, prerrequisito bloqueado, repaso; merge por ID, hidratación y recarga sin duplicados; nuevos catálogos y notificaciones accesibles.

### Decisión de producto

Confirmar medallas permanentes por hito (recomendado) y conjunto inicial de áreas. Dependencia existente PIT-4 satisfecha; no necesita esperar los nuevos contenidos.

## PIT-21 — Glosario catalán-castellano

**Estimación:** S. **Orden:** 1. **Dependencias de implementación:** ninguna nueva dentro de F6.

### Alcance

Glosario editorial local de 30–40 términos usados por las operaciones actuales, con término castellano/catalán, definición breve y ejemplo (media/mitjana, mediana, perímetro, circunferencia, numerador, enteros…). Búsqueda insensible a mayúsculas y tildes, pero presentación ortográfica correcta. Acceso desde Ayuda y desde explicaciones por IDs de término explícitos; no reemplazar cadenas arbitrariamente ni traducir toda la interfaz.

### Archivos previstos

Nuevos `src/data/mathGlossary.ts`, `src/utils/glossary.ts`, `src/components/MathGlossary.tsx`; `Help.tsx`, `Layout.tsx` y `Exercise.tsx` para enlaces; tests del catálogo y navegación.

### Migraciones y dependencias nuevas

No; sin dependencia nueva. No requiere cambiar idioma de la app ni guardar preferencias en Supabase.

### Criterios de aceptación

- Lista con IDs únicos, ambos términos y ejemplo; distinguir conceptos que se confunden (media/mediana y círculo/circunferencia).
- Búsqueda encuentra «mitjana», «circumferencia» y sus variantes con acento; no altera los textos originales.
- Modal/panel con cierre, retorno de foco y teclado; disponible offline y sin perder ejercicio o temporizador.
- Contenido revisado por una persona que conozca el vocabulario escolar del niño antes de aceptarlo como definitivo.

### Tests y verificación previstos

Validación de IDs/entradas, búsqueda y acentos; apertura desde ayuda/explicación, foco, Escape/cierre y continuidad del ejercicio. Revisión humana lingüística pendiente de designar.

### Decisión de producto

Elegir revisor del vocabulario (familia o escuela). El plan propone solo glosario; traducción íntegra al catalán queda fuera.

## PIT-22 — Voz y repaso de examen

**Estimación:** L. **Orden:** 7. **Dependencias de implementación:** PIT-31, PIT-32.

### Alcance

Separar dos entregables independientes: PIT-31 lectura voluntaria de enunciados y PIT-32 repaso de examen con resultados diferidos. Esta issue coordina la aceptación. La voz es ayuda de acceso y sigue disponible durante examen; no requiere micrófono ni reconocimiento. El examen no actualiza dominio/logros/pistas como el flujo normal antes de terminar.

### Archivos previstos

Voz: `src/utils/problemText.ts`, `src/hooks/useProblemSpeech.ts`, `src/components/ReadAloudButton.tsx`, `Exercise.tsx`. Examen: nuevo `ExamPractice.tsx`, `examSession.ts`, `Home.tsx`, `GameContext.tsx`, `types/index.ts`, servicios e informes si se persiste; tests correspondientes.

### Migraciones y dependencias nuevas

Voz: ninguna migración/dependencia, usar API nativa con detección y fallback. Examen persistido: SÍ, nueva migración para admitir source='exam' en constraint de 0008; actualizar tipos, cola offline, consultas e informes antes de publicar. Aplicación PROHIBIDA sin aprobación; alternativa local sin guardar resultados. No falsear source como free/path ni cambiar 0008 histórica.

### Criterios de aceptación

- Voz: controla iniciar/parar, cancela en cambio de problema/pestaña/usuario, verbaliza matemáticas sin soluciones y funciona sin API mediante texto.
- Examen: 10 preguntas de habilidades elegidas y accesibles, una respuesta por pregunta, sin pistas/reintento/revelado inmediato; resumen con soluciones al finalizar.
- No contamina sesión diaria, rachas, dominio ni registros normales; si guarda resultados, source exam separado e idempotencia offline.
- No se filtran respuestas vía atributos accesibles; teclado matemático y lectura siguen como ayudas; restauración/cancelación definidas sin atribuir datos a otro usuario.

### Tests y verificación previstos

PIT-31: verbalización por variantes del problema, ciclo de API simulada y navegador real. PIT-32: sesión/reducer, navegación sin regenerar, cierre único, cancelación, offline/duplicados/source histórico y compatibilidad de informes. Examen manual en móvil/escritorio.

### Decisión de producto

Elegir examen sin tiempo por defecto (recomendado), y si guardar resultados separados con nueva migración o lanzar un MVP local. Voz ES inicial; CA posterior si se aprueba y hay voz disponible.

## PIT-23 — Más potencias y ampliación ESO

**Estimación:** L. **Orden:** 8. **Dependencias de implementación:** ninguna nueva dentro de F6.

### Alcance

Ampliación acotada con tres operaciones T3 nuevas: `power-general` (bases enteras no negativas, exponentes 0–5 con 0^0 excluido y resultado entero seguro), `power-of-ten` (10^n con n=0–6) y `algebra-substitution` (evaluar ax+b con enteros pequeños). Mantener `power` actual de cuadrados/cubos para el ciclo y su historial. Nuevas habilidades T3 con prerrequisitos de potencias/raíces, enteros y operaciones mixtas; accesibles desde Mi camino tras dominio. Propuesta inicial: no añadir estas tres operaciones nuevas al modo libre de 4.º/5.º/6.º; conservar la ampliación libre ya existente/en integración para ecuaciones y proporcionalidad inversa. Confirmar antes de implementar si también se incorporan las nuevas al modo `eso-extension`. Exponentes negativos, notación científica y expansión indefinida quedan fuera.

### Archivos previstos

`src/utils/generators/powers.ts`, nuevo `generators/algebra.ts`, `generators/index.ts`, `generators/shared.ts` si requiere límites; `types/index.ts`, `skillCatalog.ts`, `problemUtils.ts`, `operationLabels.ts`, `hints.ts`, `Exercise.tsx`, `MyPath.tsx` (evitar que presentación de potencias suponga solo ²/³); tests curriculares/contentStage/restauración. No cambiar recuentos de curso si las nuevas operaciones son solo T3.

### Migraciones y dependencias nuevas

No: operation es texto libre y skills JSON; sin dependencia nueva. Mantener IDs históricos, serializadores y contenido de sesiones antiguas compatibles.

### Criterios de aceptación

- Resultados exactos, finitos y dentro de Number.MAX_SAFE_INTEGER; 0^0 no se genera y a^0 se explica correctamente.
- PowerProblem actual conserva compatibilidad; las potencias generales se representan con exponente real en pantalla, pista, verbalización y explicación.
- Nuevas operaciones tienen un propietario único T3; bloqueadas sin prerrequisitos y disponibles tras dominarlos sin depender del selector de curso libre.
- Informes usan contentStage=ampliación ESO y source real; no se etiqueta T3 como un solo curso de primaria.
- Progresión explícita de dificultad, vocabulario y ejemplos revisados antes de añadir más familias.

### Tests y verificación previstos

Casos exponente 0/1/5, base 0/1, límites de enteros y sustitución con signos; invariantes de respuestas/distractores si existen; catálogo acíclico, propietario único, bloqueo/desbloqueo T3, filtros libre, informes/source y compatibilidad de sesiones antiguas.

### Decisión de producto

Aprobar estas tres familias iniciales o reducirlas a potencias y decidir su inclusión en el modo libre `eso-extension` que se integra en paralelo. Validar secuencia con familia/escuela; no se afirma cobertura integral del currículo ESO.

## Detalle de las tareas nuevas

### PIT-29 — Acceso de solo lectura al dominio para el administrador

Desglose de PIT-19 (L). Preparar un acceso mínimo al progreso real guardado en game_state.data.skills para el administrador único existente; no crear cuentas familiares ni acceso general a todos los estados.

Archivos previstos: supabase/migrations/<siguiente>_admin_skill_progress.sql, DATABASE_MIGRATION.md, src/services/adminService.ts y sus tests.

Requiere migración SQL y aprobación expresa antes de aplicarla; sin dependencia nueva. Proponer RPC admin_get_skill_progress con comprobación is_admin, acceso de solo lectura y respuesta limitada a skills/updated_at del niño solicitado. No devolver PIN, credenciales ni datos de otras familias.

Aceptación: admin autorizado lee progreso del niño seleccionado; anon y niño no obtienen progreso ajeno; entradas inválidas y fallo de red se manejan sin fallback que invente dominio. Tests con roles en BD desechable y tests del servicio. No aplicar migraciones durante planificación.

Estimación M. Precede al panel PIT-19. Detalle completo: docs/PLAN_F6.md.

### PIT-30 — Vista familiar de dominio y resumen semanal

Desglose de PIT-19 (L). Ampliar el panel del administrador único con dominio efectivo por habilidad, prerrequisitos y repaso pendiente, junto con resumen semanal a partir de intentos y desglose por source/tramo.

Archivos previstos: src/components/admin/AdminDashboard.tsx, nuevo SkillMasteryView.tsx, src/services/adminService.ts, src/utils/skillReport.ts y tests; reutilizar childReport.ts/contentStage.ts/weeklyTrend.ts/skillProgress.ts.

Sin migración propia ni dependencia; depende del acceso autorizado al dominio (otra tarea de PIT-19). No confundir porcentaje de aciertos con dominio ni prometer diagnóstico de errores típicos no guardados en el modelo actual.

Aceptación: estados reales correctos con prerequisitos y fecha local; cero intentos no se interpreta como suspenso; cambio de niño no muestra el estado previo; carga/error/vacío explícitos; SVG directo si se añaden gráficos; responsive y accesible. Tests de agregación, componente, aislamiento entre niños y roles.

Estimación M. Detalle: docs/PLAN_F6.md.

### PIT-31 — Lectura voluntaria de enunciados

Desglose de PIT-22 (L). Lectura bajo demanda en castellano con SpeechSynthesis del navegador, sin reconocimiento de voz ni servicio externo contratado. Crear verbalización del problema estructurado (fracciones, signos, potencias y SVG), sin leer respuestas o soluciones antes de tiempo.

Archivos previstos: src/utils/problemText.ts, src/hooks/useProblemSpeech.ts, src/components/ReadAloudButton.tsx, Exercise.tsx y tests. Sin migración ni dependencia nueva.

Aceptación: iniciar/parar con control accesible; cancelar al cambiar pregunta/pestaña/usuario o desmontar; fallback textual si API/voz no disponible; no autoplay; no lectura de secretos ni soluciones; modo examen conserva esta ayuda de acceso. Detectar voces disponibles y preferir locales, sin prometer funcionamiento offline universal.

Tests de verbalización por tipo y ciclo de vida con API simulada, más comprobación real en móvil/escritorio. Estimación M. No depende del modo examen ni del glosario para la primera versión en castellano. Detalle y fuente técnica: docs/PLAN_F6.md.

### PIT-32 — Repaso de examen con resultados diferidos

Desglose de PIT-22 (L). Sesión de repaso de 10 preguntas con selección de habilidades accesibles, sin pistas ni corrección inmediata, resumen y soluciones solo al finalizar; permitir teclado y lectura en voz alta como ayudas de acceso.

Archivos previstos: nuevo ExamPractice.tsx, src/utils/examSession.ts, Home.tsx, GameContext.tsx, src/types/index.ts, attemptService.ts, adminService.ts, childReport.ts/contentStage.ts y tests; no reutilizar sin adaptar el CHECK_ANSWER que actualiza dominio, logros y corrección inmediata.

Decisión pendiente: guardar resultados separados como source='exam' (recomendado; requiere extender constraint de 0008 con una NUEVA migración y aprobación para aplicarla) o MVP local sin guardar resultados del examen. Nunca clasificarlos falsamente como free/path. Sin dependencia nueva.

Aceptación: diez preguntas únicas por identidad, no cambia respuestas al navegar, no filtra soluciones ni opciones correctas antes del cierre, cancelación no altera dominio ni sesión diaria, envío idempotente sin duplicados offline y fuente separada si se guarda. Por defecto sin tiempo; decisión familiar para variantes. Tests de reducer, integración, offline/duplicados, restauración/usuario y permisos. Estimación L. Detalle: docs/PLAN_F6.md.

## Decisiones pendientes de la familia

- Panel: administrador único actual (recomendado) o nuevas cuentas de familiares vinculadas. Las cuentas múltiples quedan fuera de este MVP y requieren un diseño de autorización distinto.
- Autorizar por separado la aplicación de la nueva migración del acceso al dominio (PIT-29), después de revisar SQL y pruebas de roles.
- Examen: diez preguntas sin tiempo por defecto; decidir guardar resultados como source exam (nueva migración) o versión local sin resultados persistidos. No registrar un examen bajo un source incorrecto.
- Glosario: designar revisor familiar/escolar. Audio: castellano inicial, opcional y bajo demanda; decidir si el soporte catalán entra en una ampliación posterior.
- Contenido ESO: aceptar las tres familias propuestas o limitar el primer lote a potencias; validar su secuencia con el trabajo escolar del niño.
- Insignias: confirmar reconocimientos permanentes por hito y las áreas iniciales; teclado opcional y visualizaciones sin arrastre obligatorio son los valores recomendados.

## Riesgos y comprobaciones antes de implementar

- Dos tareas de visualización no deben inventar motores de respuesta/feedback diferentes. Compartir solo el marco visual y los controles; conservar respuestas calculadas desde datos del generador.
- El panel no puede reemplazar dominio por acierto global ni inferir tipos de error a partir de un booleano. Añadir diagnóstico detallado requeriría otro alcance y datos adecuados.
- Examen debe separar su estado y la aplicación de resultados de CHECK_ANSWER, que actualmente modifica puntuación, logros, dominio e intentos de inmediato. Mantener ayuda de lectura/teclado no equivale a permitir pistas.
- Web Speech ofrece síntesis y sus voces se descubren en ejecución; planificar cancelación y fallback, no garantizar disponibilidad offline ni voz catalana en todos los dispositivos. Referencia técnica primaria: [Web Speech API, síntesis](https://webaudio.github.io/web-speech-api/#tts-section). No se propone reconocimiento, micrófono ni proveedor TTS contratado.
- La política mínima de voz será preferir voces locales disponibles; si no hay voz adecuada, mantener texto y un aviso. Usar una voz remota como alternativa automática necesitaría decisión explícita, sin afirmar que la API siempre procesa localmente.
- Los cambios de esquema se despliegan antes que el código que los requiere; cada lote mantiene compatibles los intentos offline y las versiones anteriores. No reutilizar ni modificar la migración 0008.

## Verificación de esta planificación

Se actualizan las descripciones de PIT-15..PIT-23 con alcance, archivos, criterios, tests, tamaño, dependencias y decisiones. Se crean PIT-29..PIT-32 solo por el desglose anterior y se enlazan los bloqueos reales. No se modifican estados, código de aplicación, dependencias, migraciones ni commits. El único archivo añadido por esta tarea es docs/PLAN_F6.md.

