import React, { useState } from 'react';
import { Help } from './Help';
import { useAuth } from '../context/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [showHelp, setShowHelp] = useState(false);
  const { profile, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 flex flex-col">
      <div className="container mx-auto px-4 py-8 flex-1 flex flex-col">
        <header className="text-center mb-8 relative">
          <div className="flex justify-center items-center mb-4">
            <img 
              src="/logo.png" 
              alt="Pitágoritas Logo" 
              className="h-16 w-16 mr-4 rounded-lg shadow-lg"
            />
            <h1 className="text-4xl md:text-6xl font-bold text-gray-800">
              Pitágoritas
            </h1>
            <div className="flex items-center gap-3 absolute right-0 top-0 h-full">
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded shadow hover:bg-blue-700 transition-colors text-base"
                onClick={() => setShowHelp(true)}
              >
                ¿Cómo se usa?
              </button>
              {profile && (
                <div className="flex items-center gap-3 bg-white rounded-full px-3 py-1 shadow">
                  <span className="text-2xl" aria-hidden="true">
                    {profile.avatar ?? '🙂'}
                  </span>
                  <span className="text-sm font-semibold text-gray-700">{profile.username}</span>
                  <button
                    className="text-sm text-red-500 hover:text-red-600 font-semibold"
                    onClick={() => signOut()}
                  >
                    Salir
                  </button>
                </div>
              )}
            </div>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-2">
            ¡Sumas puntos, restas dudas y multiplicas diversión!
          </p>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Practica matemáticas de 4º de Primaria de forma divertida
          </p>
        </header>
        <main className="max-w-4xl mx-auto flex-1 w-full">
          {showHelp ? <Help onClose={() => setShowHelp(false)} /> : children}
        </main>
        <footer className="text-center mt-12 text-gray-500 text-sm">
          <p>¡Diviértete aprendiendo matemáticas! 🎓</p>
          <p className="mt-2">© 2025 Edmundo Rosales Mayor. Todos los derechos reservados.</p>
        </footer>
      </div>
    </div>
  );
} 