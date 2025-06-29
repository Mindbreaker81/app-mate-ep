import { useState } from 'react';
import { useGame } from '../context/GameContext';
import confetti from 'canvas-confetti';

export function Exercise() {
  const { state, dispatch } = useGame();
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !state.currentProblem) return;

    const userAnswer = parseInt(inputValue);
    const isCorrect = userAnswer === state.currentProblem.answer;

    dispatch({
      type: 'SUBMIT_ANSWER',
      payload: { answer: inputValue, isCorrect }
    });

    if (isCorrect) {
      // Lanzar confeti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  };

  const handleNextProblem = () => {
    dispatch({ type: 'NEXT_PROBLEM' });
    setInputValue('');
  };

  const handleShowSolution = () => {
    dispatch({ type: 'SHOW_SOLUTION' });
  };

  const handleReset = () => {
    dispatch({ type: 'RESET_GAME' });
    setInputValue('');
  };

  if (!state.currentProblem) {
    return (
      <div className="text-center">
        <p className="text-lg">Cargando ejercicio...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      {/* Pregunta */}
      <div className="text-center mb-6">
        <h2 className="text-4xl font-bold text-gray-800 mb-4">
          {state.currentProblem.question}
        </h2>
        
        {/* Input para respuesta */}
        {state.isCorrect === null && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Escribe tu respuesta"
              className="w-full px-4 py-3 text-2xl text-center border-2 border-blue-300 rounded-lg focus:border-blue-500 focus:outline-none"
              autoFocus
            />
            <button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              Comprobar
            </button>
          </form>
        )}

        {/* Resultado */}
        {state.isCorrect !== null && (
          <div className="space-y-4">
            {state.isCorrect ? (
              <div className="text-green-600">
                <p className="text-2xl font-bold mb-2">¡Correcto! 🎉</p>
                <p className="text-lg">Tu respuesta: {state.userAnswer}</p>
              </div>
            ) : (
              <div className="text-red-600">
                <p className="text-2xl font-bold mb-2">Incorrecto 😔</p>
                <p className="text-lg">Tu respuesta: {state.userAnswer}</p>
                <p className="text-lg">Respuesta correcta: {state.currentProblem.answer}</p>
              </div>
            )}

            {/* Botones de acción */}
            <div className="space-y-2">
              {!state.isCorrect && !state.showSolution && (
                <button
                  onClick={handleShowSolution}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                  Ver Explicación
                </button>
              )}
              
              <button
                onClick={handleNextProblem}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
              >
                Siguiente Ejercicio
              </button>
              
              <button
                onClick={handleReset}
                className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
              >
                Reiniciar Juego
              </button>
            </div>
          </div>
        )}

        {/* Explicación */}
        {state.showSolution && !state.isCorrect && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-bold text-blue-800 mb-3">Explicación paso a paso:</h3>
            <ol className="space-y-2 text-left">
              {state.currentProblem.steps.map((step, index) => (
                <li key={index} className="text-blue-700">
                  {step}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
} 