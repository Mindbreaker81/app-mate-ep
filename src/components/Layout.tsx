import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between p-4 bg-blue-600 text-white">
        <div className="font-bold text-xl">Pitágoritas</div>
      </header>
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
} 