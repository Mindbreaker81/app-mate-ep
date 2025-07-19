import React, { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

interface ConfettiProps {
  trigger: boolean;
}

export function Confetti({ trigger }: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const confettiInstance = useRef<any>(null);

  useEffect(() => {
    if (trigger && canvasRef.current) {
      // Crear una instancia de confeti específica para este canvas
      confettiInstance.current = confetti.create(canvasRef.current, {
        resize: true,
        useWorker: true
      });

      // Lanzar confeti en una zona específica
      confettiInstance.current({
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
        if (confettiInstance.current) {
          confettiInstance.current.reset();
        }
      }, 1500);

      return () => {
        clearTimeout(timeout);
        if (confettiInstance.current) {
          confettiInstance.current.reset();
        }
      };
    }
  }, [trigger]);

  // Verificar si el confeti está habilitado
  const confettiEnabled = localStorage.getItem('confetti-enabled') !== 'false';

  if (!confettiEnabled) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 h-32 pointer-events-none z-30">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{
          width: '100%',
          height: '100%',
          pointerEvents: 'none'
        }}
      />
    </div>
  );
}