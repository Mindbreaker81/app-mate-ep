import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 flex flex-col">
      <div className="container mx-auto px-4 py-8 flex-1 flex flex-col">
        <header className="text-center mb-8">
          <div className="flex justify-center items-center mb-4">
            <img 
              src="/logo.png" 
              alt="Pitágoritas Logo" 
              className="h-16 w-16 mr-4 rounded-lg shadow-lg"
            />
            <h1 className="text-4xl md:text-6xl font-bold text-gray-800">
              Pitágoritas
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-2">
            ¡Sumas puntos, restas dudas y multiplicas diversión!
          </p>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Practica matemáticas de 4º de Primaria de forma divertida
          </p>
        </header>
        <main className="max-w-4xl mx-auto flex-1 w-full">
          {children}
        </main>
        <footer className="text-center mt-12 text-gray-500 text-sm">
          <p>¡Diviértete aprendiendo matemáticas! 🎓</p>
          <p className="mt-2">© 2024 Edmundo Rosales Mayor. Todos los derechos reservados.</p>
        </footer>
      </div>
    </div>
  );
} 