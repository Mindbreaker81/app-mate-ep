import { beforeEach, describe, expect, it, vi } from 'vitest';

const confettiMock = vi.hoisted(() => vi.fn());

vi.mock('canvas-confetti', () => ({ default: confettiMock }));

import { celebrate } from '../celebration';

describe('celebrate', () => {
  beforeEach(() => {
    confettiMock.mockClear();
  });

  it('lanza una ráfaga pequeña en un acierto normal', () => {
    celebrate(1);

    expect(confettiMock).toHaveBeenCalledTimes(1);
    const options = confettiMock.mock.calls[0][0];
    expect(options.particleCount).toBeLessThanOrEqual(50);
  });

  it('lanza una ráfaga grande en rachas múltiplo de 5', () => {
    celebrate(5);

    expect(confettiMock).toHaveBeenCalled();
    const options = confettiMock.mock.calls[0][0];
    expect(options.particleCount).toBeGreaterThanOrEqual(100);
  });

  it('racha 0 cuenta como acierto normal', () => {
    celebrate(0);

    const options = confettiMock.mock.calls[0][0];
    expect(options.particleCount).toBeLessThanOrEqual(50);
  });
});
