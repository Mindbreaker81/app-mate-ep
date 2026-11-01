import { useMemo, useState } from 'react';
import { useGame } from '../context/GameContext';
import type { GradeId, Problem, SkillProgress, SkillState } from '../types';
import { getGradeConfig, LEVELS } from '../utils/gameConfig';
import { SKILL_AREAS, SKILLS, TIER_LABELS, type Skill } from '../utils/skillCatalog';
import {
  DAILY_SESSION_SIZE,
  buildDailySession,
  createSkillProgress,
  deriveSkillState,
  prerequisitesMet,
  recordSkillAttempt,
} from '../utils/skillProgress';
import { generateOperation } from '../utils/generators';
import { answersMatch, parseFullNumber } from '../utils/problemUtils';

const STATE_LABELS: Record<SkillState, { label: string; classes: string }> = {
  locked: { label: '🔒 Bloqueada', classes: 'bg-gray-100 text-gray-500 border-gray-200' },
  practicing: { label: '✏️ En práctica', classes: 'bg-blue-50 text-blue-800 border-blue-200' },
  dominated: { label: '🌟 Dominada', classes: 'bg-green-50 text-green-800 border-green-200' },
  review: { label: '🔁 Repaso hoy', classes: 'bg-amber-50 text-amber-800 border-amber-200' },
};

/** Modo de práctica que entrena una habilidad (el primero disponible en el curso). */
function practiceModeForSkill(skill: Skill, grade: GradeId): string | null {
  const modes = getGradeConfig(grade).availablePracticeModes;
  for (const mode of modes) {
    if (mode === 'all') {
      continue;
    }
    const modeOperations = MODE_OPERATIONS[mode];
    if (modeOperations?.some((operation) => skill.operations.includes(operation as never))) {
      return mode;
    }
  }
  return null;
}

// Mapa mínimo modo → operaciones (espejo de OPERATION_MAP para el camino).
const MODE_OPERATIONS: Record<string, string[]> = {
  addition: ['addition'],
  subtraction: ['subtraction'],
  multiplication: ['multiplication'],
  division: ['division', 'division-remainder'],
  fractions: ['fraction-addition', 'fraction-subtraction', 'fraction-multiplication', 'fraction-division'],
  mixed: ['mixed'],
  decimals: ['decimal-addition', 'decimal-subtraction', 'decimal-multiplication', 'decimal-division'],
  powers: ['power', 'square-root'],
  percentages: ['percentage'],
  estimation: ['estimation'],
  factorization: ['factorization'],
  'word-problems': ['word-problem'],
  comparison: ['compare-fractions', 'compare-decimals', 'compare-fraction-decimal', 'order-values'],
  conversions: ['mixed-number-addition', 'mixed-number-subtraction', 'mixed-number-convert', 'fraction-to-decimal', 'decimal-to-fraction'],
  'number-theory': ['factorization', 'gcd', 'lcm'],
  geometry: ['perimeter-rectangle', 'perimeter-square', 'area-rectangle', 'area-triangle', 'angle-type'],
  units: ['unit-conversion'],
  statistics: ['mean', 'median', 'mode', 'range'],
  rounding: ['round-decimal'],
  integers: ['integer-addition', 'integer-subtraction', 'integer-multiplication', 'integer-division', 'integer-compare', 'integer-order'],
  equations: ['simple-equation', 'two-step-equation'],
  ratios: ['ratio', 'proportion', 'inverse-proportion'],
  probability: ['probability-simple', 'probability-compare'],
  'geometry-advanced': ['circle-area', 'circle-circumference', 'volume-rectangular-prism', 'triangle-angle-sum'],
  scales: ['scale-conversion'],
  'number-sense': ['place-value', 'sequence', 'proportionality-check'],
  finance: ['finance'],
};

interface MyPathProps {
  onStartSkill: () => void;
}

export function MyPath({ onStartSkill }: MyPathProps) {
  const { state, dispatch } = useGame();
  const [showPlacement, setShowPlacement] = useState(false);
  const skillProgress = state.skillProgress ?? {};

  const sessionProgress = Math.min(state.daily?.count ?? 0, DAILY_SESSION_SIZE);
  const sessionDone = sessionProgress >= DAILY_SESSION_SIZE;

  const startSkill = (skill: Skill) => {
    const mode = practiceModeForSkill(skill, state.grade);
    if (!mode) {
      return;
    }
    dispatch({ type: 'SET_PATH_SKILL', payload: skill.id });
    dispatch({ type: 'SET_PRACTICE_MODE', payload: mode as never });
    onStartSkill();
  };

  const startDailySession = () => {
    const session = buildDailySession(skillProgress);
    dispatch({ type: 'START_DAILY_SESSION', payload: session });
    const first = SKILLS.find((skill) => skill.id === session[0]);
    if (first) {
      startSkill(first);
    }
  };

  const areas = Object.values(SKILL_AREAS);

  return (
    <div className="space-y-6">
      {/* Sesión de hoy */}
      <div className="bg-white rounded-lg shadow-lg p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">🗓️ Sesión de hoy</h2>
            <p className="text-gray-600 text-sm">
              {sessionDone
                ? '¡Sesión completada! Puedes seguir con el modo libre.'
                : `${sessionProgress} de ${DAILY_SESSION_SIZE} ejercicios de tu camino.`}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div
              role="progressbar"
              aria-valuenow={sessionProgress}
              aria-valuemin={0}
              aria-valuemax={DAILY_SESSION_SIZE}
              aria-label="Progreso de la sesión de hoy"
              className="flex-1 min-w-[140px] h-3 bg-gray-200 rounded-full overflow-hidden"
            >
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${(sessionProgress / DAILY_SESSION_SIZE) * 100}%` }}
              />
            </div>
            <span className="text-sm font-bold text-gray-700">
              {sessionProgress}/{DAILY_SESSION_SIZE}
            </span>
            <button
              type="button"
              onClick={startDailySession}
              disabled={sessionDone}
              className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {sessionDone ? 'Completada 🎉' : sessionProgress > 0 ? 'Continuar' : 'Sesión de hoy'}
            </button>
          </div>
        </div>
      </div>

      {/* Prueba de colocación (solo si no hay progreso aún) */}
      {Object.keys(skillProgress).length === 0 && !showPlacement && (
        <div className="bg-indigo-50 border-2 border-indigo-200 rounded-lg p-5 text-center">
          <h3 className="text-lg font-bold text-indigo-900">¿Empezamos con un test rápido?</h3>
          <p className="text-indigo-800 text-sm mt-1">
            Una prueba de colocación de 16 ejercicios para colocar tu camino. El modo libre sigue disponible siempre.
          </p>
          <button
            type="button"
            onClick={() => setShowPlacement(true)}
            className="mt-3 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Hacer la prueba de colocación
          </button>
        </div>
      )}
      {showPlacement && (
        <PlacementTest
          onFinish={(progress) => {
            dispatch({ type: 'MERGE_SKILL_PROGRESS', payload: progress });
            setShowPlacement(false);
          }}
          onCancel={() => setShowPlacement(false)}
        />
      )}

      {/* Mapa de habilidades por área */}
      {areas.map((area) => {
        const areaSkills = SKILLS.filter((skill) => skill.areaId === area.id);
        if (areaSkills.length === 0) {
          return null;
        }
        return (
          <div key={area.id} className="bg-white rounded-lg shadow-lg p-5">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              {area.icon} {area.name}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {areaSkills.map((skill) => {
                const progress = skillProgress[skill.id];
                const unlocked = prerequisitesMet(skill, skillProgress);
                const skillState = deriveSkillState(progress ?? createSkillProgress(), unlocked);
                const level = progress?.level ?? 1;
                const styles = STATE_LABELS[skillState];
                const tierLabel = TIER_LABELS[skill.tier];

                return (
                  <div key={skill.id} className={`rounded-lg border-2 p-4 ${styles.classes}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold">
                          {skill.icon} {skill.name}
                        </div>
                        <div className="text-xs mt-1 opacity-80">
                          {tierLabel}
                          {skillState !== 'locked' && ` · Nivel ${level}/3`}
                        </div>
                      </div>
                      <span className="text-xs font-semibold whitespace-nowrap">{styles.label}</span>
                    </div>
                    {skillState !== 'locked' && (
                      <button
                        type="button"
                        onClick={() => startSkill(skill)}
                        className="mt-3 w-full px-3 py-1.5 bg-white/80 border border-current rounded font-semibold text-sm hover:bg-white transition-colors"
                      >
                        Practicar ahora
                      </button>
                    )}
                    {skillState === 'locked' && (
                      <p className="mt-2 text-xs opacity-75">
                        Se desbloquea al dominar: {skill.prerequisites.map((id) => SKILLS.find((s) => s.id === id)?.name ?? id).join(', ')}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// — Prueba de colocación —

const PLACEMENT_PLAN: Array<{ skillId: string; operation: Parameters<typeof generateOperation>[0] }> = [
  { skillId: 'sumas-restas', operation: 'addition' },
  { skillId: 'sumas-restas', operation: 'subtraction' },
  { skillId: 'multiplicacion-division', operation: 'multiplication' },
  { skillId: 'multiplicacion-division', operation: 'division' },
  { skillId: 'decimales', operation: 'decimal-addition' },
  { skillId: 'decimales', operation: 'decimal-subtraction' },
  { skillId: 'decimales', operation: 'decimal-multiplication' },
  { skillId: 'estimacion-redondeo', operation: 'round-decimal' },
  { skillId: 'estadistica', operation: 'mean' },
  { skillId: 'estadistica', operation: 'median' },
  { skillId: 'porcentajes', operation: 'percentage' },
  { skillId: 'geometria-basica', operation: 'area-rectangle' },
  { skillId: 'geometria-basica', operation: 'perimeter-square' },
  { skillId: 'unidades', operation: 'unit-conversion' },
  { skillId: 'potencias-raices', operation: 'power' },
  { skillId: 'teoria-numeros', operation: 'lcm' },
];

function problemPrompt(problem: Problem): string {
  if ('prompt' in problem && problem.prompt) {
    return problem.prompt;
  }
  return '';
}

function PlacementTest({
  onFinish,
  onCancel,
}: {
  onFinish: (progress: Record<string, SkillProgress>) => void;
  onCancel: () => void;
}) {
  const placementLevel = 3;
  const levelConfig = LEVELS.find((entry) => entry.id === placementLevel)!;

  const questions = useMemo(
    () => PLACEMENT_PLAN.map((plan) => generateOperation(plan.operation, placementLevel, levelConfig)),
    [levelConfig],
  );

  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [results, setResults] = useState<Record<string, boolean[]>>({});

  if (index >= questions.length) {
    // Resultado: progreso inicial a partir de los resultados por habilidad (se repiten todos).
    const progress: Record<string, SkillProgress> = {};
    for (const [skillId, outcomes] of Object.entries(results)) {
      let skillProgress: SkillProgress | undefined;
      for (const outcome of outcomes) {
        skillProgress = recordSkillAttempt(skillProgress, { isCorrect: outcome, isFirstTry: true });
      }
      if (skillProgress) {
        progress[skillId] = skillProgress;
      }
    }
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 text-center">
        <h3 className="text-xl font-bold text-gray-800">¡Prueba terminada!</h3>
        <p className="text-gray-600 mt-2">
          Tu camino está ajustado con {questions.length} ejercicios. Puedes empezar tu sesión de hoy.
        </p>
        <button
          type="button"
          onClick={() => onFinish(progress)}
          className="mt-4 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          Ver mi camino
        </button>
      </div>
    );
  }

  const current = questions[index];
  const plan = PLACEMENT_PLAN[index];
  const prompt = problemPrompt(current);

  const submit = () => {
    const parsed = parseFullNumber(answer);
    const isCorrect = parsed !== null && answersMatch(current, answer);
    setResults((prev) => ({
      ...prev,
      [plan.skillId]: [...(prev[plan.skillId] ?? []), isCorrect],
    }));
    setAnswer('');
    setIndex((value) => value + 1);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-500">
          Prueba de colocación · pregunta {index + 1} de {questions.length}
        </span>
        <button type="button" onClick={onCancel} className="text-sm text-gray-500 underline hover:text-gray-700">
          Cancelar
        </button>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-6">
        <div className="h-full bg-indigo-500" style={{ width: `${(index / questions.length) * 100}%` }} />
      </div>
      <p className="text-2xl font-semibold text-gray-800 text-center mb-6">{prompt}</p>
      <form
        className="flex justify-center gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <input
          type="text"
          inputMode="decimal"
          aria-label="Respuesta"
          className="h-12 w-32 rounded-lg border-2 border-indigo-400 text-center text-2xl"
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          autoFocus
        />
        <button
          type="submit"
          className="px-5 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}
