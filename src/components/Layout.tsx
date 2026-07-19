import React, { useState } from 'react';
import { Help } from './Help';
import { useAuth } from '../context/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

const GITHUB_PROFILE_URL = 'https://github.com/mindbreaker81';
const CHANGELOG_URL = 'https://github.com/Mindbreaker81/app-mate-ep/blob/main/CHANGELOG.md';

export function Layout({ children }: LayoutProps) {
  const [showHelp, setShowHelp] = useState(false);
  const { profile, signOut } = useAuth();
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 flex flex-col">
      <div className="container mx-auto px-4 py-8 flex-1 flex flex-col">
        <header className="text-center mb-8">
          <div className="flex justify-center items-center mb-4 gap-4">
            <img 
              src="/logo.png" 
              alt="Pitagoritas Logo" 
              className="h-16 w-16 rounded-lg shadow-lg"
            />
            <div className="flex flex-col items-start gap-2">
              <h1 className="text-4xl md:text-6xl font-bold text-gray-800">
                Pitagoritas
              </h1>
              <a
                href={CHANGELOG_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-full bg-white/80 px-3 py-1 text-sm font-semibold text-blue-700 shadow hover:bg-white"
              >
                v{__APP_VERSION__}
              </a>
            </div>
          </div>

          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-2">
            ¡Sumas puntos, restas dudas y multiplicas diversión!
          </p>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-6">
            Practica matemáticas de 4.º a 6.º de Primaria de forma divertida
          </p>

          <div className="flex flex-wrap justify-center items-center gap-3 mt-6">
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded shadow hover:bg-blue-700 transition-colors text-base"
              onClick={() => setShowHelp(true)}
            >
              ¿Cómo se usa?
            </button>
            {profile && (
              <>
                <div className="flex items-center gap-2 bg-white rounded-full px-3 py-1 shadow">
                  <span className="text-2xl" aria-hidden="true">
                    {profile.avatar ?? '🙂'}
                  </span>
                  <span className="text-sm font-semibold text-gray-700">{profile.username}</span>
                </div>
                <button
                  className="px-4 py-2 bg-red-500 text-white rounded shadow hover:bg-red-600 transition-colors text-base font-semibold"
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    await signOut();
                  }}
                  type="button"
                >
                  Salir
                </button>
              </>
            )}
          </div>
        </header>
        <main className="max-w-4xl mx-auto flex-1 w-full">
          {showHelp ? <Help onClose={() => setShowHelp(false)} /> : children}
        </main>
        <footer className="text-center mt-12 text-gray-500 text-sm">
          <p>¡Diviértete aprendiendo matemáticas! 🎓</p>
          <p className="mt-2">
            © {currentYear} mindbreaker81 ·{' '}
            <a
              href={GITHUB_PROFILE_URL}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-blue-700 hover:text-blue-800"
            >
              GitHub @mindbreaker81
            </a>
          </p>
          <p className="mt-1">
            <a
              href={CHANGELOG_URL}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-blue-700 hover:text-blue-800"
            >
              Versión v{__APP_VERSION__}
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
} 