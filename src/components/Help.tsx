import React, { useState } from 'react';
import { MathGlossary } from './MathGlossary';

interface HelpProps {
  onClose: () => void;
}

export const Help: React.FC<HelpProps> = ({ onClose }) => {
  const [showGlossary, setShowGlossary] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 relative animate-fade-in max-h-[80vh] overflow-y-auto">
      <button
        className="absolute top-4 right-4 text-blue-600 hover:text-blue-800 text-lg font-bold"
        onClick={onClose}
        aria-label="Cerrar ayuda"
      >
        ✕
      </button>
      <h2 className="text-2xl font-bold mb-4 text-blue-700">¿Cómo se usa Pitagoritas?</h2>
      <ul className="list-disc pl-6 space-y-2 text-gray-700 text-lg mb-6">
        <li>
          <b>Curso:</b> Elige 4.º, 5.º o 6.º de Primaria. Cada curso tiene operaciones y modos de práctica adaptados.
        </li>
        <li>
          <b>Modos de práctica:</b> Puedes practicar todas las operaciones o enfocarte en sumas, fracciones, problemas verbales, geometría, etc.
        </li>
        <li>
          <b>Nivel:</b> Por defecto sube automáticamente con tu puntuación. También puedes elegir un nivel fijo en el panel de puntuación (modo manual).
        </li>
        <li>
          <b>Respuestas:</b> Fracciones deben estar simplificadas. En divisiones con resto escribe cociente y resto. En comparaciones elige una opción.
        </li>
        <li>
          <b>5.º de Primaria incluye:</b> decimales, fracciones avanzadas, potencias, raíces, porcentajes, estimación, MCD/MCM, problemas con enunciado, geometría, unidades de medida y volumen, estadística, valor posicional, secuencias, proporcionalidad y finanzas (IVA, rebajas, interés).
        </li>
        <li>
          <b>6.º de Primaria incluye:</b> enteros negativos, ecuaciones de uno y dos pasos, razones y proporcionalidad directa e inversa, mediana/moda/rango, probabilidad (comparando casos), círculo y volumen, escalas y todo el contenido de 5.º.
        </li>
        <li>
          <b>Estadísticas y logros:</b> Consulta tu progreso y desbloquea medallas al practicar diferentes áreas.
        </li>
        <li>
          <b>Glosario:</b> Consulta las palabras matemáticas en castellano y en catalán (media/mitjana, perímetro/perímetre…).
        </li>
      </ul>
      <div className="mb-6">
        <button
          type="button"
          onClick={() => setShowGlossary(true)}
          aria-label="Abrir el glosario catalán-castellano"
          className="px-4 py-2 bg-purple-500 text-white rounded shadow hover:bg-purple-700 transition-colors text-base font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-500"
        >
          📖 Glosario catalán-castellano
        </button>
      </div>
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded text-blue-800">
        <b>Consejo:</b> Usa modos específicos para reforzar lo que estás viendo en clase. El modo &ldquo;Todas&rdquo; mezcla todo con variedad equilibrada.
      </div>
      {showGlossary && <MathGlossary onClose={() => setShowGlossary(false)} />}
    </div>
  );
};
