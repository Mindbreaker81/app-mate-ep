import { useEffect } from 'react';
import confetti from 'canvas-confetti';

interface ConfettiProps {
  trigger: boolean;
}

export function Confetti({ trigger }: ConfettiProps) {

  useEffect(() => {
    if (trigger) {
      // Lanzar confeti usando la API global
      confetti({
        particleCount: 30, // Reducido aún más
        spread: 25, // Más concentrado
        origin: { y: 0.95, x: 0.5 }, // Posición muy baja
        gravity: 2.0, // Mucha gravedad para caída rápida
        ticks: 80, // Duración muy corta
        colors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7'],
        startVelocity: 20, // Velocidad inicial baja
        decay: 0.8, // Decay muy rápido
        scalar: 0.8 // Partículas más pequeñas
      });

      // Limpiar después de 1.5 segundos
      const timeout = setTimeout(() => {
        // No necesitamos resetear ya que confetti se limpia automáticamente
      }, 1500);

      return () => {
        clearTimeout(timeout);
      };
    }
  }, [trigger]);

  // Verificar si el confeti está habilitado
  const confettiEnabled = localStorage.getItem('confetti-enabled') !== 'false';

  if (!confettiEnabled) {
    return null;
  }

  return null;
}