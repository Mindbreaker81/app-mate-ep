import { useGame } from '../context/GameContext';
import { LEVELS } from '../utils/gameConfig';

export function ScoreBoard() {
  const { state, setLevelMode, setManualLevel } = useGame();
  const effectiveLevel = state.levelMode === 'manual' ? state.manualLevel : state.level;

  return (
    <div className="space-y-4">
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
              />
            </div>
            <p className="text-sm mt-2">
              {state.score === state.maxScore ? '¡Nuevo récord!' : `${state.score} de ${state.maxScore}`}
            </p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-lg p-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <h3 className="text-lg font-bold text-gray-800">Nivel Actual</h3>
            <p className="text-2xl font-bold text-blue-600">{effectiveLevel}</p>
            <p className="text-sm text-gray-600">{LEVELS.find((entry) => entry.id === effectiveLevel)?.name}</p>
            {state.levelMode === 'auto' && state.level !== effectiveLevel && (
              <p className="text-xs text-gray-500 mt-1">Progreso automático: {state.level}</p>
            )}
          </div>

          <div className="text-center">
            <h3 className="text-lg font-bold text-gray-800">Racha Actual</h3>
            <p className="text-2xl font-bold text-orange-600">{state.streak}</p>
            <p className="text-sm text-gray-600">Mejor: {state.bestStreak}</p>
          </div>
        </div>

        <div className="mt-4 border-t pt-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Control de dificultad</h4>
          <div className="flex flex-wrap gap-2 justify-center mb-3">
            <button
              type="button"
              onClick={() => setLevelMode('auto')}
              className={`px-3 py-1 rounded-full text-sm ${
                state.levelMode === 'auto' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              Automático
            </button>
            <button
              type="button"
              onClick={() => setLevelMode('manual')}
              className={`px-3 py-1 rounded-full text-sm ${
                state.levelMode === 'manual' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              Manual
            </button>
          </div>
          {state.levelMode === 'manual' && (
            <div className="flex items-center justify-center gap-2">
              <label htmlFor="manual-level" className="text-sm text-gray-600">
                Nivel:
              </label>
              <select
                id="manual-level"
                value={state.manualLevel}
                onChange={(event) => setManualLevel(Number.parseInt(event.target.value, 10))}
                className="border rounded px-2 py-1 text-sm"
              >
                {LEVELS.map((level) => (
                  <option key={level.id} value={level.id}>
                    {level.id} — {level.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

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
        <p className="text-xs text-gray-500 text-center mt-2">Curso: {state.grade === '5e' ? '5.º' : '4.º'} Primaria</p>
      </div>
    </div>
  );
}
