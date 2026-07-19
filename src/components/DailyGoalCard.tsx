import type { DailyProgress } from '../types';
import { DAILY_GOAL, computeDayStreak, localDateKey } from '../utils/dailyGoal';

interface DailyGoalCardProps {
  daily: DailyProgress | null;
  practiceDays: string[];
}

/** Meta diaria de ejercicios y racha de días de práctica. */
export function DailyGoalCard({ daily, practiceDays }: DailyGoalCardProps) {
  const today = localDateKey(new Date());
  const todayCount = daily && daily.date === today ? daily.count : 0;
  const goalMet = todayCount >= DAILY_GOAL;
  const percent = Math.min(100, Math.round((todayCount / DAILY_GOAL) * 100));
  const dayStreak = computeDayStreak(practiceDays, new Date());

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl" aria-hidden="true">
            🎯
          </span>
          <span className="font-semibold text-gray-800">
            {goalMet ? '¡Meta cumplida! 🎉' : 'Meta de hoy'}
          </span>
          <span className="text-gray-600">
            {todayCount} / {DAILY_GOAL} hoy
          </span>
        </div>
        {dayStreak >= 2 && (
          <span className="font-semibold text-orange-600">🔥 {dayStreak} días seguidos</span>
        )}
      </div>
      <div
        role="progressbar"
        aria-label="Progreso de la meta diaria"
        aria-valuenow={todayCount}
        aria-valuemin={0}
        aria-valuemax={DAILY_GOAL}
        className="mt-3 h-3 w-full rounded-full bg-gray-200"
      >
        <div
          className={`h-3 rounded-full transition-all duration-500 ${goalMet ? 'bg-green-500' : 'bg-blue-500'}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
