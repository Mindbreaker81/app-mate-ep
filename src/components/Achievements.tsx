import { useGame } from '../context/GameContext';

export function Achievements() {
  const { state } = useGame();
  const unlockedAchievements = state.achievements.filter(a => a.unlocked);
  const lockedAchievements = state.achievements.filter(a => !a.unlocked);

  if (unlockedAchievements.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
      <h3 className="text-lg font-bold text-gray-800 mb-3">🏆 Logros Desbloqueados</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {unlockedAchievements.map((achievement) => (
          <div 
            key={achievement.id}
            className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-3 rounded-lg text-center"
          >
            <div className="text-2xl mb-1">{achievement.icon}</div>
            <div className="font-bold text-sm">{achievement.name}</div>
            <div className="text-xs opacity-90">{achievement.description}</div>
          </div>
        ))}
      </div>
      
      {lockedAchievements.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-gray-600 mb-2">Logros por desbloquear: {lockedAchievements.length}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {lockedAchievements.slice(0, 3).map((achievement) => (
              <div 
                key={achievement.id}
                className="bg-gray-200 text-gray-500 p-2 rounded text-center"
              >
                <div className="text-lg mb-1">🔒</div>
                <div className="font-bold text-xs">{achievement.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 