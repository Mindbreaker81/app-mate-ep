import React from 'react';

interface HelpProps {
  onClose: () => void;
}

export const Help: React.FC<HelpProps> = ({ onClose }) => (
  <div className="bg-white rounded-lg shadow-lg p-8 relative animate-fade-in">
    <button
      className="absolute top-4 right-4 text-blue-600 hover:text-blue-800 text-lg font-bold"
      onClick={onClose}
      aria-label="Cerrar ayuda"
    >
      ✕
    </button>
    <h2 className="text-2xl font-bold mb-4 text-blue-700">¿Cómo se usa Pitágoritas?</h2>
    <ul className="list-disc pl-6 space-y-2 text-gray-700 text-lg mb-6">
      <li>
        <b>Navegación:</b> Usa las pestañas o botones principales para cambiar entre modos de práctica, estadísticas, logros y más.
      </li>
      <li>
        <b>Ejercicios:</b> Selecciona el modo (todas las operaciones, sumas, restas, etc.) y elige el tiempo si lo deseas. Escribe tu respuesta y pulsa <b>Enter</b> o el botón de enviar.
      </li>
      <li>
        <b>Botón "Siguiente"</b>: Aparece tras responder. Úsalo para pasar al siguiente ejercicio.
      </li>
      <li>
        <b>Colores del temporizador:</b> Verde (mucho tiempo), amarillo (tiempo medio), rojo (poco tiempo).
      </li>
      <li>
        <b>Estadísticas:</b> Consulta tu progreso semanal, rendimiento por operación y dificultad, y tu tiempo promedio de respuesta.
      </li>
      <li>
        <b>Logros:</b> Se desbloquean automáticamente al cumplir ciertos hitos, como tu primer acierto, rachas de respuestas correctas, o alcanzar una puntuación perfecta.
      </li>
      <li>
        <b>Progresión de niveles:</b> Supera ejercicios y mejora tu puntuación para desbloquear niveles más difíciles.
      </li>
      <li>
        <b>Recomendaciones:</b> La app te sugiere en qué áreas practicar más, según tus resultados.
      </li>
      <li>
        <b>Animaciones:</b> Cuando aciertas, verás confeti y estrellas como recompensa visual.
      </li>
      <li>
        <b>Guardar progreso:</b> Todo tu avance y logros se guardan automáticamente en tu dispositivo.
      </li>
    </ul>
    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded text-blue-800">
      <b>Consejo:</b> ¡Practica todos los días para mejorar tus habilidades y desbloquear todos los logros!
    </div>
  </div>
);

// Animación opcional en style.css:
// .animate-fade-in { animation: fade-in 0.5s; }
// @keyframes fade-in { from { opacity: 0; transform: translateY(20px);} to { opacity: 1; transform: none; } } 