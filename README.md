# Pitagoritas

© 2025 Edmundo Rosales Mayor. Todos los derechos reservados.

# 🧮 Pitagoritas - ¡Sumas puntos, restas dudas y multiplicas diversión!

Una aplicación web interactiva para que niños de 4º de Primaria practiquen matemáticas de forma divertida. Con sistema de autenticación, persistencia en la nube y seguimiento de progreso personalizado.

**Stack:** React 19 • TypeScript • Vite • Tailwind CSS • Supabase

**🔗 Deploy:** [https://pitagoritas.vercel.app](https://app-mate-ep.vercel.app) (o tu URL de Vercel)

## ✨ Características

### 🔐 Autenticación y Perfiles
- **Login infantil**: Sistema de autenticación con username único y PIN de 6 dígitos
- **Avatares personalizables**: Selección de emojis como avatar
- **Progreso personalizado**: Cada usuario tiene su propio historial y estadísticas
- **Persistencia en la nube**: Datos guardados en Supabase con seguridad RLS

### 📝 Ejercicios y Operaciones
- **7 tipos de operaciones**: Suma, resta, multiplicación, división, fracciones y operaciones mixtas
- **Operación mixta**: Combina múltiples operaciones con orden de precedencia (PEMDAS)
- **10 niveles progresivos**: Dificultad escalable para todas las operaciones
- **Validación robusta**: Fracciones deben estar simplificadas
- **Explicaciones paso a paso**: Solución detallada cuando fallas

### 🎮 Gamificación
- **Sistema de logros**: 9 medallas desbloqueables
- **Rachas**: Seguimiento de respuestas correctas consecutivas
- **Puntuación máxima**: Record personal guardado
- **Modos de práctica**: Enf

ócate en operaciones específicas
- **Modos de tiempo**: Practica contra reloj (30s, 1min, 2min)

### 📊 Estadísticas y Progreso
- **Guardado inmediato**: Cada intento se guarda instantáneamente en Supabase
- **Estadísticas detalladas**: Por operación, dificultad y progreso semanal
- **Funciona offline**: Cola local sincroniza cuando hay conexión
- **Sincronización inteligente**: Solo al login, no duplica conteos

### 🎨 UX y Diseño
- **Diseño responsivo**: Perfecto en móviles y tablets
- **Interfaz intuitiva**: Pensada para niños de 4º Primaria
- **Feedback visual claro**: Sin animaciones que bloqueen la pantalla
- **Sección de ayuda**: Instrucciones accesibles desde el header

## 🚀 Tecnologías

**Frontend:**
- React 19 - Biblioteca de interfaz de usuario
- TypeScript 5.8 - Tipado estático para mayor robustez
- Vite 7 - Build tool ultrarrápido
- Tailwind CSS 3 - Framework de CSS utilitario

**Backend:**
- Supabase - Backend as a Service (PostgreSQL + Auth)
- Row Level Security (RLS) - Seguridad a nivel de fila

**Testing y Calidad:**
- Vitest - Framework de pruebas unitarias
- Testing Library - Testing de componentes React
- ESLint + Prettier - Linting y formateo de código
- GitHub Actions - CI/CD automatizado

## 📦 Instalación

### Prerrequisitos

- Node.js 20.x (ver `.nvmrc`)
- npm 7.x o superior
- Cuenta en [Supabase](https://supabase.com) (para desarrollo)

### Pasos de instalación

1. **Clonar el repositorio**
   ```bash
   git clone <url-del-repositorio>
   cd pitagoritas
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   
   Crea un archivo `.env.local` en la raíz:
   ```env
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-anon-key
   VITE_SUPABASE_EMAIL_DOMAIN=gmail.com
   ```

4. **Configurar base de datos**
   
   Ejecuta las migraciones en Supabase Dashboard → SQL Editor:
   ```bash
   # En orden:
   supabase/migrations/0001_create_profiles_attempts.sql
   supabase/migrations/0002_auto_create_profile_trigger.sql
   ```
   
   O con Supabase CLI:
   ```bash
   supabase db push
   ```

5. **Ejecutar en modo desarrollo**
   ```bash
   npm run dev
   ```

6. **Abrir en el navegador**
   ```
   http://localhost:5173
   ```

## 🧪 Pruebas

```bash
# Ejecutar todos los tests
npm test

# Watch mode
npm run test:watch

# Con UI interactiva
npm run test:ui

# Con cobertura
npm test -- --coverage
```

**Cobertura actual:** ~36% con 32 tests pasando

## 🏗️ Scripts disponibles

```bash
# Desarrollo
npm run dev          # Servidor de desarrollo
npm run preview      # Preview de build de producción

# Build
npm run typecheck    # Verificación de tipos TypeScript
npm run build        # Build para producción (incluye typecheck)

# Testing
npm test             # Ejecutar tests
npm run test:watch   # Tests en watch mode
npm run test:ui      # Tests con UI interactiva

# Calidad de código
npm run lint         # Linting
npm run lint:fix     # Linting con auto-fix
```

## 📱 Uso de la aplicación

### Primera vez

1. **Registro**:
   - Click en "Registrarme"
   - Elige un username único (3-15 caracteres)
   - Crea un PIN de 6 dígitos
   - Selecciona tu avatar favorito 😃

2. **Login**:
   - Ingresa tu username
   - Ingresa tu PIN
   - ¡Listo para jugar!

### Durante el juego

1. **Ejercicio**: La app muestra un problema matemático
2. **Responder**: Escribe tu respuesta en el campo de texto
3. **Comprobar**: Presiona Enter o click en "Enviar"
4. **Feedback**:
   - ✅ Correcto: Se suma un punto y racha
   - ❌ Incorrecto: Se muestra la explicación paso a paso
5. **Siguiente**: Click en "Siguiente" para continuar

### Personalización

- **Modos de práctica**: Enfoca tu práctica en una operación específica
- **Modos de tiempo**: Añade presión de tiempo para desafíos
- **Estadísticas**: Revisa tu progreso y áreas de mejora
- **Logros**: Desbloquea medallas al alcanzar hitos

## 🎯 Sistema de Logros

- 🎯 **¡Primer Acierto!** - Primer ejercicio correcto
- ➕ **Sumador Experto** - 10 sumas correctas
- ➖ **Rey de las Restas** - 10 restas correctas
- ✖️ **Maestro de las Multiplicaciones** - 10 multiplicaciones correctas
- ➗ **Campeón de las Divisiones** - 10 divisiones correctas
- 🔥 **¡En Racha!** - 5 correctas seguidas
- ⚡ **¡Imparable!** - 10 correctas seguidas
- 🏆 **Campeón de Matemáticas** - 50 ejercicios correctos
- 💎 **¡Puntuación Perfecta!** - 20 ejercicios sin fallar

## 📚 Documentación

- **[CHANGELOG.md](./CHANGELOG.md)** - Historial de cambios y versiones
- **[TECHNICAL.md](./TECHNICAL.md)** - Documentación técnica completa
- **[PLAN_DE_TRABAJO.md](./PLAN_DE_TRABAJO.md)** - Plan de desarrollo y fases

## 🌐 Despliegue en Vercel

### Opción 1: Despliegue automático desde GitHub

1. **Subir el código a GitHub**
   ```bash
   git add .
   git commit -m "Deploy to Vercel"
   git push origin main
   ```

2. **Conectar con Vercel**
   - Ve a [vercel.com](https://vercel.com)
   - Conecta tu cuenta de GitHub
   - Importa el repositorio
   - Vercel detectará automáticamente que es un proyecto Vite

3. **Configuración automática**
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. **Configurar variables de entorno en Vercel**
   - Settings → Environment Variables
   - Agregar:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
     - `VITE_SUPABASE_EMAIL_DOMAIN`
   - Aplicar a: Production, Preview, Development

5. **Re-deploy después de configurar variables**
   - Las variables `VITE_*` se hornean durante el build
   - Deployments → ... → Redeploy

### Opción 2: Despliegue manual con Vercel CLI

```bash
# Instalar Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

## 📁 Estructura del proyecto

```
pitagoritas/
├── src/
│   ├── components/          # Componentes React
│   │   ├── auth/           # Sistema de autenticación
│   │   ├── Exercise.tsx    # Componente de ejercicios
│   │   ├── DetailedStats.tsx # Estadísticas detalladas
│   │   └── ...
│   ├── context/            # Contextos de React
│   │   ├── AuthContext.tsx # Autenticación
│   │   └── GameContext.tsx # Estado del juego
│   ├── services/           # Servicios
│   │   ├── attemptService.ts  # Guardado de intentos
│   │   ├── statsService.ts    # Estadísticas
│   │   └── instrumentationService.ts # Telemetría
│   ├── lib/
│   │   └── supabaseClient.ts  # Cliente de Supabase
│   ├── utils/              # Utilidades
│   │   ├── problemGenerator.ts # Generador de problemas
│   │   ├── statsUtils.ts      # Funciones de estadísticas
│   │   └── ...
│   ├── types/              # Tipos TypeScript
│   ├── App.tsx
│   └── main.tsx
├── supabase/
│   └── migrations/         # Migraciones SQL versionadas
├── .github/workflows/
│   └── ci.yml             # CI/CD
├── archive/               # Archivos obsoletos archivados
├── public/
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── vitest.config.ts
```

## 🔧 Troubleshooting

### La app muestra "página en blanco" en Vercel

**Solución:** Verifica que las variables de entorno estén configuradas y re-despliega.

### Estadísticas aparecen en 0 después de login

**Solución:** Implementado delay de 500ms para asegurar que la sesión esté establecida. Si persiste, verifica las políticas RLS en Supabase.

### Botón "Salir" no funciona

**Solución:** Ya corregido con `preventDefault()` y `stopPropagation()`. Si persiste, limpia caché del navegador.

### Datos se pierden al hacer logout

**Solución:** Implementado guardado inmediato. Cada intento se guarda instantáneamente en Supabase.

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Changelog

Ver [CHANGELOG.md](./CHANGELOG.md) para el historial completo de cambios.

**Última versión:** 1.0.0 (2025-10-26)

## 📄 Licencia

Este proyecto es privado. Todos los derechos reservados.

## 👨‍💻 Autor

**Edmundo Rosales Mayor**

Desarrollado para ayudar a niños de 4º de Primaria a practicar matemáticas de forma divertida.

---

**¡Sumas puntos, restas dudas y multiplicas diversión! 🧮🎓**
