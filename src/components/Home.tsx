import { useState } from 'react';
import { Exercise } from './Exercise';
import { ScoreBoard } from './ScoreBoard';
import { Achievements } from './Achievements';
import { DetailedStats } from './DetailedStats';
import { PracticeModes } from './PracticeModes';
import { TimeModes } from './TimeModes';
import { useGame } from '../context/GameContext';
import { getGradeConfig } from '../utils/gameConfig';

type TabType = 'exercise' | 'stats' | 'achievements' | 'practice' | 'time';

export function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('exercise');
  const { state, resetGame, setGrade } = useGame();
  const gradeOptions = ['4t', '5e', '6e'] as const;
  const gradeLabel = state.grade === '4t' ? '4.º' : state.grade === '5e' ? '5.º' : '6.º';

  const tabs = [
    { id: 'exercise', label: '🧮 Ejercicio', icon: '🧮' },
    { id: 'stats', label: '📊 Estadísticas', icon: '📊' },
    { id: 'achievements', label: '🏆 Logros', icon: '🏆' },
    { id: 'practice', label: '🎯 Práctica', icon: '🎯' },
    { id: 'time', label: '⏱️ Tiempo', icon: '⏱️' }
  ];

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'exercise':
        return (
          <div className="space-y-6">
            <Exercise />
            <div className="flex justify-center">
              <button
                onClick={resetGame}
                className="px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 transition-colors"
              >
                🔄 Reiniciar Juego
              </button>
            </div>
          </div>
        );
      case 'stats':
        return (
          <div className="space-y-6">
            <ScoreBoard />
            <DetailedStats />
          </div>
        );
      case 'achievements':
        return <Achievements />;
      case 'practice':
        return <PracticeModes />;
      case 'time':
        return <TimeModes />;
      default:
        return null;
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Curso actual</h2>
            <p className="text-gray-600">Cambia entre 4.º, 5.º y 6.º para adaptar los ejercicios al currículo.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" role="group" aria-label="Selector de curso">
            {gradeOptions.map((grade) => {
              const config = getGradeConfig(grade);
              const isSelected = state.grade === grade;

              return (
                <button
                  key={grade}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setGrade(grade)}
                  className={`rounded-lg border-2 px-4 py-3 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
                      : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-indigo-300'
                  }`}
                >
                  <div className="font-semibold">{config.name}</div>
                  <div className="text-sm opacity-90">{config.description}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tabs de navegación */}
      <div className="bg-white rounded-lg shadow-lg p-2">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Secciones principales">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              id={`${tab.id}-tab`}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`${tab.id}-panel`}
              tabIndex={activeTab === tab.id ? 0 : -1}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Contenido de las tabs */}
      <div className="min-h-[500px]">
        <section
          id={`${activeTab}-panel`}
          role="tabpanel"
          aria-labelledby={`${activeTab}-tab`}
          className="min-h-[500px]"
        >
          {renderActiveTab()}
        </section>
      </div>
      
      {/* Información rápida del estado actual */}
      <div className="bg-white rounded-lg shadow-lg p-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">{state.score}</div>
            <div className="text-sm text-gray-600">Puntuación</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{state.streak}</div>
            <div className="text-sm text-gray-600">Racha</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">{state.level}</div>
            <div className="text-sm text-gray-600">Nivel</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-indigo-600">{gradeLabel}</div>
            <div className="text-sm text-gray-600">Curso</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-600">{state.achievements.filter(a => a.unlocked).length}</div>
            <div className="text-sm text-gray-600">Logros</div>
          </div>
        </div>
      </div>
    </div>
  );
} 