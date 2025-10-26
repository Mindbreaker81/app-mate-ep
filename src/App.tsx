import { GameProvider } from './context/GameContext';
import { Layout } from './components/Layout';
import { Home } from './components/Home';
import { AuthProvider } from './context/AuthContext';
import { AuthGate } from './components/auth/AuthGate';
import './style.css';

function App() {
  return (
    <AuthProvider>
      <AuthGate>
        <GameProvider>
          <Layout>
            <Home />
          </Layout>
        </GameProvider>
      </AuthGate>
    </AuthProvider>
  );
}

export default App; 