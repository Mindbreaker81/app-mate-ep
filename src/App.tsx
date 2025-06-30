import { GameProvider } from './context/GameContext';
import { Layout } from './components/Layout';
import { Home } from './components/Home';
import './style.css';

function App() {
  return (
    <GameProvider>
      <Layout>
        <Home />
      </Layout>
    </GameProvider>
  );
}

export default App; 