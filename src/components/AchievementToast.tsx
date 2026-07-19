import { useEffect, useState } from 'react';
import type { Achievement } from '../types';

/** Aviso flotante cuando el niño desbloquea un logro; se oculta solo a los 4 s. */
export function AchievementToast({ achievement }: { achievement: Achievement | null }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!achievement) {
      setVisible(false);
      return undefined;
    }

    setVisible(true);
    const timeoutId = setTimeout(() => setVisible(false), 4000);
    return () => clearTimeout(timeoutId);
  }, [achievement]);

  if (!achievement || !visible) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-4 inset-x-0 z-50 mx-auto w-fit max-w-sm rounded-xl border-2 border-amber-400 bg-amber-100 px-5 py-3 shadow-lg"
    >
      <div className="flex items-center gap-3">
        <span className="text-3xl" aria-hidden="true">
          {achievement.icon}
        </span>
        <div>
          <div className="font-bold text-amber-900">🏆 ¡Logro desbloqueado!</div>
          <div className="text-sm font-semibold text-amber-800">{achievement.name}</div>
        </div>
      </div>
    </div>
  );
}
