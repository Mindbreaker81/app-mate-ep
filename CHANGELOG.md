# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Versionado Semántico](https://semver.org/lang/es/).

## [Sin publicar]

### Añadido
- **Teclado matemático opcional en pantalla** (PIT-18): el niño lo abre con el
  botón «⌨️ Teclado» y no sustituye al teclado nativo. Dígitos, borrado que
  respeta cursor y selección, coma decimal cuando el problema la admite, ± solo
  en operaciones con negativos, «x» en factorización, «/» para pasar de
  numerador a denominador y cambio de campo en cociente/resto. Botones de 44 px
  con nombres accesibles que no envían el formulario. También disponible en la
  prueba de colocación. Preferencia guardada localmente por usuario
  (`pitagoritas.mathKeyboard.<userId>`), sin migración.
- **Glosario catalán–castellano** (PIT-21): 40 términos matemáticos usados por
  las operaciones actuales, cada uno con término en castellano y catalán,
  definición breve y ejemplo, en `src/data/mathGlossary.ts` (lista única,
  pendiente de revisión familiar del vocabulario). Buscador insensible a
  mayúsculas y tildes («mitjana», «circumferencia», «perímetre»). Acceso desde
  la cabecera, desde la ayuda y desde las explicaciones de cada ejercicio con
  enlaces por IDs de término explícitos según la operación; fichas con «Ver
  también» para los pares que se confunden (media/mediana, círculo/
  circunferencia). El panel es un overlay modal accesible (Escape, retorno de
  foco, navegación con teclado) que no desmonta el ejercicio ni detiene el
  temporizador; funciona offline. La interfaz sigue en castellano.
- **Insignias por dominio** (PIT-20): sección nueva en «Logros» con una insignia
  permanente por habilidad dominada (`mastery:<habilidad>`) y una por área
  (`mastery-area:<área>`, conjuntos versionados explícitos). El dominio es el del
  motor real (ventana de 12 intentos, mín. 10, ≥80 % y 2 días, con
  prerrequisitos); un repaso pendiente nunca retira la insignia. Se conceden al
  responder y también al hidratar/fusionar el progreso (en silencio, sin
  duplicar por ID). Persisten en `game_state.data`, sin migración ni cambio en
  los logros existentes.

## [4.1.0] - 2026-11-02

### Añadido
- **Modo libre «Ampliación ESO»** en 6.º (PIT-14): práctica el contenido T3
  (ecuaciones de dos pasos, proporcionalidad inversa) sin exigir prerrequisitos;
  en «Mi camino» siguen exigiéndose. Categoría propia «Ampliació ESO» (29 modos en 6.º).
- **Nueva operación `fraction-percent`** (PIT-13): equivalencias fracción–decimal–porcentaje
  con valores exactos (denominadores 2, 4, 5, 10, 20, 25, 50, 100): «¿qué porcentaje
  es 2/5?», «¿qué fracción es 75 %?» y «¿qué fracción es 0.75?». Entra en la
  habilidad «Fracción–decimal–porcentaje» de «Mi camino» y en el modo
  «Conversiones» de 5.º y 6.º (44 operaciones en 5.º, 65 en 6.º).

## [4.0.0] - 2026-11-01

### Añadido
- **Catálogo de habilidades** (`skillCatalog.ts`): progreso persistido por habilidad,
  niveles y repaso espaciado
- **Pestaña «Mi camino»**: sesión diaria guiada, prueba de colocación y chip de
  habilidad en curso
- **Pistas graduales y segundo intento** antes de revelar la solución, con aviso
  de simplificación en fracciones
- **Ampliación curricular del ciclo 6-12-1** (7 operaciones nuevas, 64 en 6.º):
  - Valor posicional hasta milésimas (`place-value`)
  - Secuencias aritméticas y geométricas (`sequence`)
  - Comprobación de proporcionalidad con tabla y opción múltiple (`proportionality-check`)
  - Finanzas: IVA, mejores precios, rebajas e interés simple (`finance`)
  - Comparar probabilidades con contexto (ruleta, bolsa, dados) (`probability-compare`)
  - Ecuaciones de dos pasos (`two-step-equation`)
  - Proporcionalidad inversa (obreros y días, trabajo constante) (`inverse-proportion`)
- **2 modos de práctica nuevos**: `number-sense` y `finance` (22 modos en 5.º, 28 en 6.º)
- **3 habilidades nuevas en «Mi camino»** como puente a 1.º de ESO, con
  prerrequisitos dominados: ecuaciones de dos pasos y proporcionalidad inversa
- **Unidades de medida completas**: mm, dm, dam, hm, cL, dL, mg, toneladas,
  superficie (m² ↔ cm²) y volumen (1 L = 1000 cm³)
- **Probabilidad con plantillas variadas** que aceptan la respuesta como
  decimal o fracción

### Corregido
- **Botón de la sesión de hoy en móvil**: con el estado «Completada 🎉» el botón
  se salía de la tarjeta a 390 px (la barra de progreso tenía un ancho mínimo de
  140 px). La barra baja a 80 px y el botón no se encoge ni parte el texto
- **Sesión completada y recarga**: al terminar la sesión diaria (10/10) y
  recargar, el contador volvía a 0/10 y se empezaba otra el mismo día (la
  clave guardada se borraba al completar). Ahora la sesión completada de hoy
  se conserva en localStorage y tras recargar se sigue mostrando como
  completada hasta el día siguiente; empezar otra solo si se pide
  explícitamente con un botón existente
- **StrictMode en desarrollo (PIT-28)**: el doble montaje encolaba dos veces
  la generación de problema y la segunda quedaba después de la restauración
  de la sesión diaria, pisando el ejercicio restaurado por uno de modo libre
  tras recargar (en producción no ocurría). La generación pasa por la acción
  idempotente `ENSURE_PROBLEM`, que solo crea problema si no hay uno
- **Pestañas de Home**: en escritorio el emoji salía duplicado («🧭 🧭 Mi
  camino») y en móvil el nombre accesible era solo el emoji (el texto estaba
  en `hidden sm:inline`). Ahora el emoji es decorativo (`aria-hidden`) y el
  texto siempre está en el árbol de accesibilidad (`sr-only sm:not-sr-only`)
- **Sesión al recargar**: la app se quedaba unos 15 s en «Cargando…» y devolvía
  al niño al login con «Supabase getSession tardó más de 15000ms» aunque el
  token fuera válido. El callback de `onAuthStateChange` era asíncrono y
  supabase-js retiene su lock de token mientras espera su promesa; las
  consultas de perfil/admin dentro del callback pedían ese mismo lock vía
  `getSession()` y se interbloqueaban. Ahora el callback es síncrono y difiere
  el trabajo con `setTimeout`, y no queda ningún `await` de supabase dentro
- **Informes**: distinguen el curso elegido del tramo del contenido (PIT-27).
  `contentStage.ts` deriva el tramo de cada intento a partir de su operación
  vía `skillCatalog`: repaso de 4.º, inicio/consolidación del ciclo 5.º–6.º
  (nunca un curso solo) y ampliación ESO (T3, aunque el curso elegido sea
  5.º/6.º). El informe del niño gana las secciones «Origen de los intentos»
  (modo libre frente a «Mi camino») y «Por tramo de contenido», la tabla por
  curso muestra la columna «Contenido» y los CSV de intentos y de habilidades
  incluyen las columnas «tramo» y «procedencia». La procedencia se guarda en
  la nueva columna `attempts.source` (migración 0008, aplicada en
  Supabase el 2026-11-01): `free`/`path`/`daily-session`/`placement`; los intentos
  históricos y los encolados por versiones antiguas se tratan como `free`,
  así que un repaso de 4.º hecho desde «Mi camino» ya no se confunde con el
  repaso del modo libre.
- **Sesión diaria de «Mi camino»**: se guarda en localStorage por usuario y se
  reanuda tras recargar la app (cola, habilidad en curso, ejercicios hechos y
  fecha); se descarta al cambiar de día o de usuario (PIT-28)
- **Prueba de colocación**: se muestran todos los enunciados, se rechazan respuestas vacías y se mejora la accesibilidad.
- **Mi camino**: la sesión avanza por las habilidades previstas, genera ejercicios del nivel de cada habilidad y cuenta cada ejercicio una sola vez.
- **Cambio de pestaña**: se conservan respuestas y pistas, y el temporizador se pausa mientras el ejercicio está oculto.
- **Registro de intentos**: el callback utiliza el curso actual al guardarlos.
- **Lint**: corregido el error de `prefer-const` y las dependencias de los hooks.
- **Resta de nivel 1** podía dar resultado 0 (ahora siempre positivo estricto)
- **Comparación de opciones de texto** en los nuevos tipos de opción múltiple
  («¿Proporcional?» y comparar probabilidades) rechazaba la respuesta correcta

## [3.1.1] - 2026-07-19

### Corregido
- **Cambio de hora**: la evolución semanal salía vacía y la racha de días se
  rompía al cruzar el cambio horario de primavera (fechas por calendario)
- **Evolución semanal**: las barras altas se comprimían y falseaban la
  proporción entre semanas (un 50 % se dibujaba al 66 % de un 100 %)
- **Estado de juego**: sin red, el caché por usuario ya se usa como respaldo;
  antes el niño heredaba el progreso guardado por otro niño del dispositivo
- **Estado de juego**: se guarda al ocultar la pestaña, sin esperar al debounce
  de 2 s, para no perder el último logro al cerrar o cambiar de app

## [3.1.0] - 2026-07-19

### Añadido
- **Panel de administración** (un solo admin, login con email y contraseña):
  lista de niños con avisos, detalle con desglose por curso y tipo de ejercicio,
  avisos de refuerzo/fortaleza/inactividad, reseteo de PIN y cambio de contraseña
- **Evolución semanal por niño** en el panel admin (precisión de las últimas 8 semanas)
- **Exportación CSV de intentos** desde el panel admin (compatible Excel es-ES)
- **PWA instalable** con actualización automática y caché offline
- **Estado de juego por usuario en Supabase** (`game_state`): logros, récords y
  meta diaria siguen al niño entre dispositivos y ya no se mezclan entre hermanos
- **Meta diaria** de 10 ejercicios con barra de progreso y **racha de días** 🔥
- **Práctica recomendada**: tarjeta «💪 Te toca entrenar» según los puntos débiles
- **Botón ±** para respuestas negativas (enteros y ecuaciones eran irresolubles en móvil)
- **Confeti al acertar** (ráfaga grande en rachas de 5) y **toast de logros**
- **6 plantillas nuevas de problemas verbales**: dos pasos y datos distractores
- Botón «¿Por qué?» para ver la explicación también al acertar
- **Migración BD** `0007_game_state.sql` documentada en `DATABASE_MIGRATION.md`

### Cambiado
- En opción múltiple, tocar la opción envía la respuesta directamente
- Enter pasa al siguiente ejercicio tras responder
- «Reiniciar Juego» pide confirmación en dos pasos
- Inputs de respuesta más grandes (táctil infantil)
- El subtítulo ya incluye 6.º de Primaria

## [3.0.0] - 2026-07-01

### Añadido
- **Expansión curricular completa para 6.º de primaria (18 operaciones nuevas, 57 total)**
  - Números enteros: suma, resta, multiplicación, división, comparar y ordenar
  - Ecuaciones simples de un paso
  - Razones y proporcionalidad
  - Estadística ampliada: mediana, moda y rango (además de media)
  - Probabilidad simple
  - Geometría avanzada: área y longitud del círculo, volumen de prisma, suma de ángulos
  - Escalas en planos
- **6 modos de práctica nuevos** (`integers`, `equations`, `ratios`, `probability`, `geometry-advanced`, `scales`)
- **7 logros nuevos** para contenido de 6.º
- **Selector de curso ampliado** a 4.º, 5.º y 6.º
- **Migración BD** `0005_validate_grade_6e.sql` documentada en `DATABASE_MIGRATION.md`

### Cambiado
- Modo estadística incluye mediana, moda y rango en 6.º
- Help, README y TECHNICAL actualizados para v3.0

## [2.0.0] - 2026-07-01

### Añadido
- **Expansión curricular completa para 5.º de primaria (39 operaciones)**
  - Problemas verbales con enunciados variados
  - Comparar y ordenar fracciones/decimales
  - Fracciones mixtas y conversiones fracción ↔ decimal
  - Divisiones con resto
  - MCD y MCM (modo Teoría de números)
  - Raíz cuadrada exacta
  - Media aritmética
  - Geometría: perímetros, áreas y tipos de ángulo
  - Unidades de medida y redondeo decimal
- **12 modos de práctica nuevos** agrupados por categorías (básico, fracciones/decimales, avanzado, aplicación)
- **21 logros** (12 nuevos para contenido de 5.º)
- **Selector de nivel manual** además del progreso automático por puntuación
- **Pesos en modo "Todas"** para equilibrar la variedad de ejercicios
- **Arquitectura modular** del generador en `src/utils/generators/`
- **Migración BD** documentada en `DATABASE_MIGRATION.md` (columna `grade` en `attempts`)

### Cambiado
- Porcentajes ampliados (descuentos, aumentos, más valores)
- Estimación ampliada (suma, resta, división además de multiplicación)
- Operaciones mixtas: 12 plantillas (antes 6)
- README, Help y TECHNICAL alineados con el contenido real

## [1.2.0] - 2026-04-03

### Añadido
- **Cobertura curricular ampliada a 5.º de primaria**
  - Nuevos ejercicios con decimales
  - Potencias (cuadrados y cubos)
  - Fracciones con multiplicación y división
  - Porcentajes y proporcionalidad básica
  - Estimación y factorización

- **Versión visible en la aplicación**
  - La versión ahora se muestra en el header y el footer
  - Enlace directo al changelog desde la interfaz

### Cambiado
- **Branding de autoría**
  - El copyright de la app pasa a `mindbreaker81`
  - Se añade referencia visible al usuario de GitHub `@mindbreaker81`

- **Fuente única de versión**
  - `package.json` pasa a ser la referencia principal de la versión mostrada en la web-app
  - La versión renderizada en la UI se inyecta en build time para evitar duplicaciones manuales

- **Experiencia de juego y accesibilidad**
  - Mejoras en tabs, feedback accesible y visibilidad del estado de la app
  - Ajustes de interfaz para mostrar mejor el estado actual y el progreso

### Corregido
- **Mensajes de autenticación en despliegue**
  - Se aclara cuando Supabase bloquea login/registro por confirmación de email
  - El mensaje guía a desactivar `Confirm email` o configurar `Site URL` y `Redirect URLs`

- **Persistencia y robustez**
  - Mejoras en timer, cola offline y sincronización local/remota
  - Utilidades compartidas para fracciones, expresiones y validación de respuestas

### Técnico
- **Actualización reciente de dependencias**
  - React y Vite actualizados para corregir vulnerabilidades conocidas
  - Ajustes de tipados y tooling (`@types/node`, `@typescript-eslint`)

- **Testing**
  - Nuevos tests para expansión curricular, Home, Exercise, GameContext y cola de intentos

## [1.0.0] - 2025-10-26

### Añadido
- **Sistema de autenticación infantil completo**
  - Registro con username único, PIN de 6 dígitos y selección de avatar (emojis)
  - Login simplificado para niños sin necesidad de email
  - Autenticación basada en Supabase Auth con emails sintéticos
  
- **Persistencia de datos en Supabase**
  - Tabla `profiles` para información de usuarios
  - Tabla `attempts` para almacenar cada intento de ejercicio
  - Políticas RLS (Row Level Security) para seguridad de datos por usuario
  - Sistema de cola offline con fallback cuando no hay conexión
  
- **Sistema de guardado inmediato (Solución C híbrida)**
  - Cada intento se guarda inmediatamente en Supabase
  - Estadísticas locales se actualizan en tiempo real
  - Sincronización inteligente solo al iniciar sesión
  - Funciona offline con cola local que se sincroniza automáticamente
  
- **Operación mixta (mixed)**
  - Nueva operación que combina suma, resta, multiplicación y división
  - Respeta orden de operaciones matemáticas (PEMDAS)
  - Explicaciones paso a paso del proceso de resolución
  - Integrada en sistema de estadísticas y modos de práctica

- **Mejoras de estadísticas**
  - Recálculo desde Supabase al iniciar sesión
  - Categorías separadas para fracciones y operaciones mixtas
  - Progreso semanal detallado
  - Estadísticas por operación y dificultad

- **Sistema de migraciones SQL versionadas**
  - Directorio `supabase/migrations/` con migraciones numeradas
  - Trigger automático para crear perfiles al registrarse
  - Políticas RLS granulares (SELECT, INSERT, UPDATE separadas)

- **CI/CD mejorado**
  - GitHub Actions con lint, typecheck, tests y build
  - Variables de entorno configuradas en Vercel
  - Deploy automático desde GitHub

### Cambiado
- **Nombre de la aplicación**: "Pitágoritas" → "Pitagoritas" (sin tilde)
- **Interfaz de usuario mejorada**
  - Botón "Salir" reposicionado debajo del título
  - Layout responsive mejorado para móviles
  - Feedback visual simplificado
  
- **Sistema de estadísticas inmutable**
  - Funciones `updateWeeklyProgress`, `updateOperationStats` y `updateDifficultyStats` ahora son inmutables
  - Evita mutaciones que causaban doble conteo
  - Mejor rendimiento y predictibilidad

- **Timeout de sesión aumentado**
  - De 7 segundos a 15 segundos para conexiones lentas
  - Delay de 500ms antes de cargar estadísticas para asegurar sesión establecida

### Eliminado
- **Sistema de confeti** (CSS y Canvas)
  - Removido por bloquear inputs y botones
  - Feedback visual ahora solo usa texto (✅ "¡Correcto!" / ❌ "Incorrecto")
  
- **Animaciones de estrellas**
  - Eliminadas por bloquear el campo de respuesta
  
- **Componente DebugAuth**
  - Ya no necesario después de estabilizar el sistema de autenticación

### Corregido
- **Problema de perfiles faltantes**: Usuarios autenticados sin perfil en tabla `profiles`
- **Doble conteo de estadísticas**: Durante sesión activa se contaban intentos dos veces
- **Botón Salir no funcionaba**: Handler de click mejorado con `preventDefault` y `stopPropagation`
- **Estadísticas no se cargaban**: Query bloqueada por RLS solucionada con delay de sesión
- **Pérdida de datos recientes**: Sistema de guardado inmediato evita pérdida al hacer logout
- **Variables de entorno en Vercel**: Configuradas correctamente para producción

### Seguridad
- **Políticas RLS granulares** en todas las tablas
- **Validación de username**: Solo alfanuméricos, 3-15 caracteres
- **Validación de PIN**: Exactamente 6 dígitos numéricos
- **Rate limiting**: Cooldown tras intentos fallidos de login
- **Datos por usuario aislados**: Cada usuario solo puede acceder a sus propios datos

### Técnico
- **Supabase integrado**: Proyecto `supabase-pitagoritas` conectado
- **Base de datos**: PostgreSQL con RLS habilitado
- **Testing**: Vitest + Testing Library con 32 tests pasando
- **Cobertura de código**: ~36% con enfoque en lógica crítica
- **Type safety**: TypeScript strict mode habilitado
- **Linting**: ESLint + Prettier configurados

### Documentación
- Documento técnico consolidado (`TECHNICAL.md`)
- Plan de trabajo actualizado (`PLAN_DE_TRABAJO.md`)
- README completamente renovado con guías de instalación y uso
- Scripts SQL de migración documentados

---

## [0.1.0] - 2025-01-XX (versión anterior)

### Características iniciales
- Ejercicios básicos: sumas, restas, multiplicaciones, divisiones
- Fracciones: suma y resta de fracciones propias
- Sistema de niveles (10 niveles)
- Sistema de logros
- Estadísticas almacenadas en localStorage
- Confeti y animaciones (posteriormente removidos)
- Modos de práctica y tiempo
- Diseño responsive con Tailwind CSS
