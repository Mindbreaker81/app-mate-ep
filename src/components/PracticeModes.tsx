import React from 'react';
import { useGame } from '../context/GameContext';
import { PRACTICE_MODES } from '../utils/practiceConfig';

export function PracticeModes() {
  const { state, setPracticeMode } = useGame();
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        🎯 Modo de Práctica
      </h2>
      <p className="text-gray-600 mb-6">
        Elige qué operaciones quieres practicar específicamente
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {PRACTICE_MODES.map((mode) => (
          <button
            key={mode.mode}
            onClick={() => setPracticeMode(mode.mode)}
            className={`p-4 rounded-lg border-2 transition-all duration-200 hover:scale-105 ${
              state.practiceMode === mode.mode
                ? 'border-blue-500 bg-blue-50 shadow-md'
                : 'border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-25'
            }`}
          >
            <div className="text-center">
              <div className="text-3xl mb-2">{mode.icon}</div>
              <h3 className="font-semibold text-gray-800 mb-1">
                {mode.label}
              </h3>
              <p className="text-sm text-gray-600">
                {mode.description}
              </p>
              {state.practiceMode === mode.mode && (
                <div className="mt-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    ✓ Activo
                  </span>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
      
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">💡 Consejo</h3>
        <p className="text-sm text-blue-700">
          Practicar operaciones específicas te ayuda a mejorar en las áreas donde más lo necesitas. 
          ¡Usa las estadísticas para identificar tus puntos débiles!
        </p>
      </div>
    </div>
  );
} 