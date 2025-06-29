import { Layout } from './Layout';
import { ScoreBoard } from './ScoreBoard';
import { Exercise } from './Exercise';

export function Home() {
  return (
    <Layout>
      <ScoreBoard />
      <Exercise />
    </Layout>
  );
} 