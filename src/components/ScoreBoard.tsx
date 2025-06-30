import { useGame } from '../context/GameContext';
import { LEVELS } from '../utils/gameConfig';

export function ScoreBoard() {
  const { state } = useGame();
  const currentLevel = LEVELS.find(l => l.id === state.level);

  return (
    <div className="space-y-4">
      {/* Puntuación principal */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <div className="text-center">
            <h3 className="text-lg font-bold">Puntuación Actual</h3>
            <p className="text-3xl font-bold text-yellow-300">{state.score}</p>
          </div>
          
          <div className="text-center">
            <h3 className="text-lg font-bold">Mejor Puntuación</h3>
            <p className="text-3xl font-bold text-green-300">{state.maxScore}</p>
          </div>
        </div>
        
        {state.score > 0 && (
          <div className="text-center">
            <div className="bg-white bg-opacity-20 rounded-full h-2">
              <div 
                className="bg-yellow-300 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((state.score / Math.max(state.maxScore, 1)) * 100, 100)}%` }}
              ></div>
            </div>
            <p className="text-sm mt-2">
              {state.score === state.maxScore ? '¡Nuevo récord!' : `${state.score} de ${state.maxScore}`}
            </p>
          </div>
        )}
      </div>

      {/* Nivel y racha */}
      <div className="bg-white rounded-lg shadow-lg p-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <h3 className="text-lg font-bold text-gray-800">Nivel Actual</h3>
            <p className="text-2xl font-bold text-blue-600">{state.level}</p>
            <p className="text-sm text-gray-600">{currentLevel?.name}</p>
          </div>
          
          <div className="text-center">
            <h3 className="text-lg font-bold text-gray-800">Racha Actual</h3>
            <p className="text-2xl font-bold text-orange-600">{state.streak}</p>
            <p className="text-sm text-gray-600">Mejor: {state.bestStreak}</p>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="bg-white rounded-lg shadow-lg p-4">
        <h3 className="text-lg font-bold text-gray-800 mb-3">📊 Estadísticas</h3>
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-green-600">{state.correctExercises}</p>
            <p className="text-sm text-gray-600">Correctas</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-600">{state.totalExercises}</p>
            <p className="text-sm text-gray-600">Total</p>
          </div>
        </div>
        {state.totalExercises > 0 && (
          <div className="mt-3 text-center">
            <p className="text-lg font-bold text-purple-600">
              {Math.round((state.correctExercises / state.totalExercises) * 100)}% de acierto
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 