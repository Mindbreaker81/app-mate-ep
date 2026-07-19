import confetti from 'canvas-confetti';

/** Ráfaga de confeti al acertar; más grande en rachas múltiplo de 5. */
export function celebrate(streak: number): void {
  const isMilestone = streak > 0 && streak % 5 === 0;

  try {
    confetti({
      particleCount: isMilestone ? 120 : 40,
      spread: isMilestone ? 120 : 70,
      origin: { y: 0.7 },
      disableForReducedMotion: true,
    });
  } catch {
    // Sin canvas (tests, navegadores antiguos): la celebración es opcional.
  }
}
