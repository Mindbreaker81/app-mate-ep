import { useGame } from '../context/GameContext';
import { getAccuracyPercentage, getWeakestOperation, getWeeklyProgressData } from '../utils/statsUtils';

export function DetailedStats() {
  const { state } = useGame();
  const { stats } = state;
  
  const weeklyData = getWeeklyProgressData(stats);
  const weakestOp = getWeakestOperation(stats);
  
  const operationLabels = {
    addition: 'Sumas',
    subtraction: 'Restas', 
    multiplication: 'Multiplicaciones',
    division: 'Divisiones'
  };
  
  const difficultyLabels = {
    easy: 'Fácil',
    medium: 'Medio',
    hard: 'Difícil'
  };
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        📊 Estadísticas Detalladas
      </h2>
      
      {/* Resumen General */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-800">Tiempo Promedio</h3>
          <p className="text-2xl font-bold text-blue-600">
            {Math.round(stats.averageTime)}s
          </p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="font-semibold text-green-800">Porcentaje Acierto</h3>
          <p className="text-2xl font-bold text-green-600">
            {getAccuracyPercentage(state.correctExercises, state.totalExercises)}%
          </p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="font-semibold text-purple-800">Operación Más Débil</h3>
          <p className="text-lg font-bold text-purple-600">
            {operationLabels[weakestOp as keyof typeof operationLabels]}
          </p>
        </div>
      </div>
      
      {/* Estadísticas por Operación */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-700">📈 Rendimiento por Operación</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(stats.operationStats).map(([operation, data]) => (
            <div key={operation} className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-700">
                  {operationLabels[operation as keyof typeof operationLabels]}
                </span>
                <span className="text-sm text-gray-500">
                  {data.difficulty === 'easy' ? '🟢' : data.difficulty === 'medium' ? '🟡' : '🔴'}
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Aciertos:</span>
                  <span className="font-semibold">{data.correct}/{data.total}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Precisión:</span>
                  <span className="font-semibold">
                    {data.total > 0 ? getAccuracyPercentage(data.correct, data.total) : 0}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tiempo:</span>
                  <span className="font-semibold">{Math.round(data.averageTime)}s</span>
                </div>
              </div>
              {data.total > 0 && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${getAccuracyPercentage(data.correct, data.total)}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Estadísticas por Dificultad */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-700">🎯 Rendimiento por Dificultad</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(stats.difficultyStats).map(([difficulty, data]) => (
            <div key={difficulty} className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-700">
                  {difficultyLabels[difficulty as keyof typeof difficultyLabels]}
                </span>
                <span className="text-sm">
                  {difficulty === 'easy' ? '🟢' : difficulty === 'medium' ? '🟡' : '🔴'}
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Aciertos:</span>
                  <span className="font-semibold">{data.correct}/{data.total}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Precisión:</span>
                  <span className="font-semibold">
                    {data.total > 0 ? getAccuracyPercentage(data.correct, data.total) : 0}%
                  </span>
                </div>
              </div>
              {data.total > 0 && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${getAccuracyPercentage(data.correct, data.total)}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Progreso Semanal */}
      {weeklyData.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-700">📅 Progreso Semanal</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {weeklyData.slice(-4).map((week) => (
                <div key={week.week} className="text-center">
                  <div className="text-sm text-gray-600 mb-1">
                    Semana {week.week.split('-W')[1]}
                  </div>
                  <div className="text-lg font-bold text-blue-600">
                    {week.correctAnswers}/{week.totalAnswers}
                  </div>
                  <div className="text-xs text-gray-500">
                    {Math.round(week.averageTime)}s promedio
                  </div>
                  {week.totalAnswers > 0 && (
                    <div className="mt-1">
                      <div className="w-full bg-gray-200 rounded-full h-1">
                        <div 
                          className="bg-blue-600 h-1 rounded-full"
                          style={{ width: `${getAccuracyPercentage(week.correctAnswers, week.totalAnswers)}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Recomendaciones */}
      <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">
        <h3 className="font-semibold text-yellow-800 mb-2">💡 Recomendaciones</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          {weakestOp && (
            <li>• Practica más {operationLabels[weakestOp as keyof typeof operationLabels].toLowerCase()}</li>
          )}
          {stats.averageTime > 30 && (
            <li>• Intenta resolver los ejercicios más rápido</li>
          )}
          {getAccuracyPercentage(state.correctExercises, state.totalExercises) < 70 && (
            <li>• Revisa las explicaciones cuando falles</li>
          )}
          {state.streak < 5 && (
            <li>• Intenta mantener una racha de respuestas correctas</li>
          )}
        </ul>
      </div>
    </div>
  );
} 