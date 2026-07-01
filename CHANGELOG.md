# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Versionado Semántico](https://semver.org/lang/es/).

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
