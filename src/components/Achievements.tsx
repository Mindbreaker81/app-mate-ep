import { useGame } from '../context/GameContext';
import { isMasteryBadgeId, masteryAchievementCatalog } from '../utils/masteryAchievements';

export function Achievements() {
  const { state } = useGame();
  // Las insignias por dominio tienen su propia sección: no se repiten en la rejilla normal.
  const unlockedAchievements = state.achievements.filter((a) => a.unlocked && !isMasteryBadgeId(a.id));
  const lockedAchievements = state.achievements.filter((a) => !a.unlocked);

  // Insignias por dominio (PIT-20): catálogo completo, el candado indica las
  // que faltan y la descripción explica cómo se consigue cada una.
  const unlockedBadgeIds = new Set(
    state.achievements.filter((a) => a.unlocked).map((a) => a.id),
  );
  const badges = masteryAchievementCatalog().map((badge) => ({
    ...badge,
    unlocked: unlockedBadgeIds.has(badge.id),
  }));
  const unlockedBadgeCount = badges.filter((badge) => badge.unlocked).length;

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 mb-6" aria-live="polite" aria-atomic="true">
      {unlockedAchievements.length > 0 && (
        <>
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
        </>
      )}

      <section className={unlockedAchievements.length > 0 ? 'mt-6' : ''}>
        <h3 className="text-lg font-bold text-gray-800 mb-1">🎖️ Insignias por dominio</h3>
        <p className="text-sm text-gray-600 mb-3">
          Se ganan al dominar cada habilidad (y cada área) en «Mi camino»: {unlockedBadgeCount} de {badges.length}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={
                badge.unlocked
                  ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-white p-3 rounded-lg text-center'
                  : 'bg-gray-100 text-gray-500 p-3 rounded-lg text-center'
              }
            >
              <div className="text-2xl mb-1">{badge.unlocked ? badge.icon : '🔒'}</div>
              <div className="font-bold text-sm">{badge.name}</div>
              <div className={`text-xs ${badge.unlocked ? 'opacity-90' : ''}`}>{badge.description}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
