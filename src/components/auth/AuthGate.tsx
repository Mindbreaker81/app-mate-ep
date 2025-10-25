import { useState } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';

type Mode = 'login' | 'register';

interface AuthGateProps {
  children: ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const { session, loading } = useAuth();
  const [mode, setMode] = useState<Mode>('login');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
        <div className="bg-white shadow-lg rounded-lg px-8 py-10 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-lg font-semibold text-gray-700">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 px-4">
        <div className="bg-white shadow-xl rounded-3xl p-8 max-w-2xl w-full space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-gray-800">Bienvenido a Pitágoritas</h1>
            <p className="text-gray-600">Crea tu perfil o inicia sesión con tu usuario y PIN.</p>
          </div>
          <div className="flex justify-center gap-4">
            <button
              className={`px-4 py-2 rounded-full font-semibold transition-colors ${
                mode === 'login' ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-700'
              }`}
              onClick={() => setMode('login')}
            >
              Iniciar sesión
            </button>
            <button
              className={`px-4 py-2 rounded-full font-semibold transition-colors ${
                mode === 'register' ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-700'
              }`}
              onClick={() => setMode('register')}
            >
              Registrarme
            </button>
          </div>
          {mode === 'login' ? (
            <LoginForm onSwitch={() => setMode('register')} />
          ) : (
            <RegisterForm onSwitch={() => setMode('login')} />
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
