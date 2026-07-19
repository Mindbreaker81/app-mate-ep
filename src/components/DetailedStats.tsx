import { useGame } from '../context/GameContext';
import { StatsView } from './StatsView';

export function DetailedStats() {
  const { state } = useGame();

  return (
    <StatsView
      stats={state.stats}
      correctExercises={state.correctExercises}
      totalExercises={state.totalExercises}
      streak={state.streak}
    />
  );
}
