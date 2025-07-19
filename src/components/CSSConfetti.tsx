import { useEffect, useState } from 'react';

interface CSSConfettiProps {
  trigger: boolean;
}

export function CSSConfetti({ trigger }: CSSConfettiProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (trigger) {
      setShowConfetti(true);
      const timeout = setTimeout(() => setShowConfetti(false), 2000);
      return () => clearTimeout(timeout);
    }
  }, [trigger]);

  // Verificar si el confeti está habilitado
  const confettiEnabled = localStorage.getItem('confetti-enabled') !== 'false';

  if (!confettiEnabled || !showConfetti) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 h-24 pointer-events-none z-20 overflow-hidden">
      {[...Array(15)].map((_, i) => (
        <div
          key={i}
          className={`absolute w-2 h-2 rounded-full animate-confetti-fall`}
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 0.5}s`,
            animationDuration: `${1 + Math.random()}s`,
            backgroundColor: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7'][Math.floor(Math.random() * 5)]
          }}
        />
      ))}
    </div>
  );
}