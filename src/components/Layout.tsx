import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-800 mb-4">
            🧮 Mate EP
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            ¡Practica matemáticas de 4º de Primaria de forma divertida! 
            Sumas, restas, multiplicaciones y divisiones te esperan.
          </p>
        </header>
        
        <main className="max-w-4xl mx-auto">
          {children}
        </main>
        
        <footer className="text-center mt-12 text-gray-500">
          <p>¡Diviértete aprendiendo matemáticas! 🎓</p>
        </footer>
      </div>
    </div>
  );
} 