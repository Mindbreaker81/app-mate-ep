import { GameProvider } from './context/GameContext';
import { Home } from './components/Home';
import './style.css';

function App() {
  return (
    <GameProvider>
      <Home />
    </GameProvider>
  );
}

export default App; 