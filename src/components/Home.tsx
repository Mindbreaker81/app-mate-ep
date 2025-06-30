import { useState } from 'react';
import { Exercise } from './Exercise';
import { ScoreBoard } from './ScoreBoard';
import { Achievements } from './Achievements';
import { DetailedStats } from './DetailedStats';
import { PracticeModes } from './PracticeModes';
import { TimeModes } from './TimeModes';
import { useGame } from '../context/GameContext';

type TabType = 'exercise' | 'stats' | 'achievements' | 'practice' | 'time';

export function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('exercise');
  const { state, resetGame } = useGame();
  
  const tabs = [
    { id: 'exercise', label: '🧮 Ejercicio', icon: '🧮' },
    { id: 'stats', label: '📊 Estadísticas', icon: '📊' },
    { id: 'achievements', label: '🏆 Logros', icon: '🏆' },
    { id: 'practice', label: '🎯 Práctica', icon: '🎯' },
    { id: 'time', label: '⏱️ Tiempo', icon: '⏱️' }
  ];
  
  return (
    <div className="space-y-6">
      {/* Tabs de navegación */}
      <div className="bg-white rounded-lg shadow-lg p-2">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
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
        {activeTab === 'exercise' && (
          <div className="space-y-6">
            <Exercise />
            <div className="flex justify-center">
              <button
                onClick={resetGame}
                className="px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
              >
                🔄 Reiniciar Juego
              </button>
            </div>
          </div>
        )}
        
        {activeTab === 'stats' && (
          <div className="space-y-6">
            <ScoreBoard />
            <DetailedStats />
          </div>
        )}
        
        {activeTab === 'achievements' && (
          <Achievements />
        )}
        
        {activeTab === 'practice' && (
          <PracticeModes />
        )}
        
        {activeTab === 'time' && (
          <TimeModes />
        )}
      </div>
      
      {/* Información rápida del estado actual */}
      <div className="bg-white rounded-lg shadow-lg p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
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
            <div className="text-2xl font-bold text-orange-600">{state.achievements.filter(a => a.unlocked).length}</div>
            <div className="text-sm text-gray-600">Logros</div>
          </div>
        </div>
      </div>
    </div>
  );
} 