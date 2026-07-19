import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../context/GameContext';
import { fetchOwnAttempts } from '../services/statsService';
import { buildChildReport } from '../utils/childReport';
import { formatOperationLabel } from '../utils/operationLabels';
import { getPracticeModesForGrade, practiceModeForOperation } from '../utils/practiceConfig';
import type { PracticeMode } from '../types';

interface Recommendation {
  mode: PracticeMode;
  operation: string;
  accuracy: number;
}

/** Tarjeta «Te toca entrenar»: convierte los avisos de refuerzo en un botón de práctica. */
export function RecommendedPractice() {
  const { session } = useAuth();
  const { state, setPracticeMode } = useGame();
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const userId = session?.user?.id ?? null;

  useEffect(() => {
    if (!userId) {
      return undefined;
    }

    let cancelled = false;

    const load = async () => {
      const attempts = await fetchOwnAttempts(userId);
      if (cancelled || !attempts || attempts.length === 0) {
        return;
      }

      const report = buildChildReport(attempts);
      const availableModes = new Set(getPracticeModesForGrade(state.grade).map((m) => m.mode));

      for (const advisory of report.advisories) {
        if (advisory.kind !== 'reinforce' || !advisory.operation) {
          continue;
        }
        const mode = practiceModeForOperation(advisory.operation);
        if (mode && availableModes.has(mode)) {
          setRecommendation({
            mode,
            operation: advisory.operation,
            accuracy: advisory.accuracy ?? 0,
          });
          return;
        }
      }
      setRecommendation(null);
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [userId, state.grade]);

  if (!recommendation) {
    return null;
  }

  return (
    <div className="mb-6 rounded-lg border-2 border-orange-300 bg-orange-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-bold text-orange-800">
            💪 Te toca entrenar: {formatOperationLabel(recommendation.operation)}
          </div>
          <p className="text-sm text-orange-700">
            Llevas un {recommendation.accuracy} % de aciertos. ¡Un poco de práctica y lo dominas!
          </p>
        </div>
        <button
          type="button"
          onClick={() => setPracticeMode(recommendation.mode)}
          className="px-4 py-2 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors"
        >
          Practicar ahora
        </button>
      </div>
    </div>
  );
}
