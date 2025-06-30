import { useGame } from '../context/GameContext';
import { TIME_MODES, formatTime } from '../utils/timeConfig';

export function TimeModes() {
  const { state, setTimeMode } = useGame();
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        ⏱️ Modo de Tiempo
      </h2>
      <p className="text-gray-600 mb-6">
        Elige si quieres ejercicios con límite de tiempo o sin presión
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {TIME_MODES.map((mode) => (
          <button
            key={mode.mode}
            onClick={() => setTimeMode(mode.mode)}
            className={`p-4 rounded-lg border-2 transition-all duration-200 hover:scale-105 ${
              state.timeMode === mode.mode
                ? 'border-green-500 bg-green-50 shadow-md'
                : 'border-gray-200 bg-gray-50 hover:border-green-300 hover:bg-green-25'
            }`}
          >
            <div className="text-center">
              <div className="text-2xl mb-2">
                {mode.mode === 'no-limit' ? '♾️' : '⏰'}
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">
                {mode.label}
              </h3>
              {mode.seconds > 0 && (
                <div className="text-lg font-bold text-green-600 mb-1">
                  {formatTime(mode.seconds)}
                </div>
              )}
              <p className="text-sm text-gray-600">
                {mode.description}
              </p>
              {state.timeMode === mode.mode && (
                <div className="mt-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    ✓ Activo
                  </span>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
      
      <div className="mt-6 p-4 bg-green-50 rounded-lg">
        <h3 className="font-semibold text-green-800 mb-2">💡 Consejo</h3>
        <p className="text-sm text-green-700">
          Los ejercicios con tiempo te ayudan a mejorar la velocidad de cálculo. 
          ¡Empieza sin límite y ve aumentando la dificultad!
        </p>
      </div>
    </div>
  );
} 