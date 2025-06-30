# Pitágoritas

© 2024 Edmundo Rosales Mayor. Todos los derechos reservados.

# 🧮 Pitágoritas - ¡Sumas puntos, restas dudas y multiplicas diversión!

Una aplicación web interactiva y divertida para que los niños de 4º de Primaria practiquen matemáticas de forma lúdica. Desarrollada con React, TypeScript, Vite y Tailwind CSS.

## ✨ Características

- **Ejercicios aleatorios**: Sumas, restas, multiplicaciones y divisiones exactas
- **Sistema de niveles**: Progresión de dificultad desbloqueable
- **Logros y medallas**: Sistema de gamificación para motivar el aprendizaje
- **Rachas de respuestas**: Seguimiento de respuestas correctas consecutivas
- **Explicaciones paso a paso**: Cuando el niño falla, se muestra la solución detallada
- **Sistema de puntuación**: Contador visible de respuestas correctas
- **Puntuación máxima**: Se guarda automáticamente en el navegador
- **Animaciones**: Confeti cuando la respuesta es correcta
- **Diseño responsivo**: Funciona perfectamente en móviles y tablets
- **Interfaz atractiva**: Colores y diseño pensado para niños

## 🚀 Tecnologías

- **React 18** - Biblioteca de interfaz de usuario
- **TypeScript** - Tipado estático para mayor robustez
- **Vite** - Herramienta de construcción rápida
- **Tailwind CSS** - Framework de CSS utilitario
- **Canvas Confetti** - Animaciones de confeti
- **Vitest** - Framework de pruebas unitarias

## 📦 Instalación

### Prerrequisitos

- Node.js 16.x o superior
- npm 7.x o superior

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

3. **Ejecutar en modo desarrollo**
   ```bash
   npm run dev
   ```

4. **Abrir en el navegador**
   ```
   http://localhost:5173
   ```

## 🧪 Pruebas

Para ejecutar las pruebas unitarias:

```bash
npm run test
```

Para ejecutar las pruebas en modo watch:

```bash
npm run test:watch
```

## 🏗️ Scripts disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run preview` - Previsualiza la build de producción
- `npm run test` - Ejecuta las pruebas unitarias
- `npm run test:watch` - Ejecuta las pruebas en modo watch

## 📱 Uso de la aplicación

1. **Inicio**: La aplicación muestra automáticamente un ejercicio matemático
2. **Responder**: El niño escribe su respuesta en el campo de texto
3. **Comprobar**: Al hacer clic en "Comprobar", se valida la respuesta
4. **Resultado**: 
   - Si es correcta: Aparece confeti y se suma un punto
   - Si es incorrecta: Se muestra la respuesta correcta y la explicación
5. **Continuar**: Se puede pasar al siguiente ejercicio o reiniciar el juego

## 🎯 Funcionalidades educativas

### Sistema de Niveles

- **Nivel 1**: Sumas y restas simples (1-20)
- **Nivel 2**: Sumas, restas y multiplicaciones (1-50) - Se desbloquea con 10 puntos
- **Nivel 3**: Todas las operaciones (1-100) - Se desbloquea con 25 puntos
- **Nivel 4**: Operaciones complejas (1-200) - Se desbloquea con 50 puntos

### Sistema de Logros

- 🎯 ¡Primer Acierto! - Primer ejercicio correcto
- ➕ Sumador Experto - 10 sumas correctas
- ➖ Rey de las Restas - 10 restas correctas
- ✖️ Maestro de las Multiplicaciones - 10 multiplicaciones correctas
- ➗ Campeón de las Divisiones - 10 divisiones correctas
- 🔥 ¡En Racha! - 5 correctas seguidas
- ⚡ ¡Imparable! - 10 correctas seguidas
- 🏆 Campeón de Matemáticas - 50 ejercicios correctos
- 💎 ¡Puntuación Perfecta! - 20 ejercicios sin fallar

### Tipos de ejercicios

- **Sumas**: Números del 1 al 100 (según nivel)
- **Restas**: Números del 50 al 100 (resultado positivo)
- **Multiplicaciones**: Tablas del 1 al 12
- **Divisiones**: Divisiones exactas sin decimales

### Sistema de puntuación

- **Puntuación actual**: Se incrementa con cada respuesta correcta
- **Puntuación máxima**: Se guarda automáticamente y persiste entre sesiones
- **Racha actual**: Respuestas correctas consecutivas
- **Mejor racha**: Racha más alta alcanzada
- **Estadísticas**: Total de ejercicios y porcentaje de acierto

### Explicaciones educativas

Cada ejercicio incluye una explicación paso a paso cuando el niño falla:
- Descomposición de números
- Proceso de cálculo
- Verificación del resultado

## 🌐 Despliegue en Vercel

### Opción 1: Despliegue automático desde GitHub

1. **Subir el código a GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
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

### Opción 2: Despliegue manual

1. **Instalar Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Construir la aplicación**
   ```bash
   npm run build
   ```

3. **Desplegar**
   ```bash
   vercel --prod
   ```

### Variables de entorno (opcional)

Si necesitas configurar variables de entorno en Vercel:
- Ve a tu proyecto en Vercel Dashboard
- Settings → Environment Variables
- Agrega las variables necesarias

## 📁 Estructura del proyecto

```
pitagoritas/
├── src/
│   ├── components/          # Componentes React
│   │   ├── Exercise.tsx     # Componente principal del ejercicio
│   │   ├── Home.tsx         # Página principal
│   │   ├── Layout.tsx       # Layout de la aplicación
│   │   ├── ScoreBoard.tsx   # Tablero de puntuación
│   │   └── Achievements.tsx # Sistema de logros
│   ├── context/             # Contexto de React
│   │   └── GameContext.tsx  # Estado global del juego
│   ├── types/               # Definiciones de TypeScript
│   │   └── index.ts         # Tipos de la aplicación
│   ├── utils/               # Utilidades
│   │   ├── problemGenerator.ts  # Generador de problemas
│   │   ├── gameConfig.ts    # Configuración de niveles y logros
│   │   └── __tests__/       # Pruebas unitarias
│   ├── test/                # Configuración de pruebas
│   │   └── setup.ts         # Setup de Vitest
│   ├── App.tsx              # Componente raíz
│   ├── main.ts              # Punto de entrada
│   └── style.css            # Estilos globales
├── public/                  # Archivos estáticos
├── index.html               # HTML principal
├── package.json             # Dependencias y scripts
├── tailwind.config.js       # Configuración de Tailwind
├── vitest.config.ts         # Configuración de Vitest
└── README.md                # Este archivo
```

## 🎨 Personalización

### Colores y tema

Los colores se pueden personalizar editando `tailwind.config.js`:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        secondary: '#8B5CF6',
        // ... más colores
      }
    }
  }
}
```

### Dificultad de ejercicios

Para ajustar la dificultad, modifica `src/utils/problemGenerator.ts`:

```typescript
// Cambiar rangos de números
num1 = Math.floor(Math.random() * 50) + 1; // Números más pequeños
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👨‍💻 Autor

Desarrollado para ayudar a niños de 4º de Primaria a practicar matemáticas de forma divertida.

---

**¡Sumas puntos, restas dudas y multiplicas diversión! 🧮🎓** 