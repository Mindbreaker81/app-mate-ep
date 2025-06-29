import { useGame } from '../context/GameContext';

export function ScoreBoard() {
  const { state } = useGame();

  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-lg shadow-lg mb-6">
      <div className="flex justify-between items-center">
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
        <div className="mt-4 text-center">
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
  );
} 