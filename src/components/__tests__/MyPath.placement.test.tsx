import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PLACEMENT_PLAN, PlacementTest, problemPrompt } from '../MyPath';
import { generateOperation } from '../../utils/generators';
import { LEVELS } from '../../utils/gameConfig';
import { answersMatch, formatProblemAnswer, parseFullNumber } from '../../utils/problemUtils';

const placementLevel = 3;
const levelConfig = LEVELS.find((entry) => entry.id === placementLevel)!;

describe('Prueba de colocación: enunciados (problemPrompt)', () => {
  it('cada operación del plan produce un enunciado visible, sin NaN ni vacíos', () => {
    for (const plan of PLACEMENT_PLAN) {
      for (let i = 0; i < 10; i += 1) {
        const problem = generateOperation(plan.operation, placementLevel, levelConfig);
        const prompt = problemPrompt(problem);
        expect(prompt, `sin enunciado para ${plan.operation}`).not.toBe('');
        expect(prompt, `NaN/undefined en ${plan.operation}`).not.toMatch(/NaN|undefined/);
      }
    }
  });

  it('los problemas numéricos usan el símbolo de la operación y terminan en "= ?"', () => {
    const addition = generateOperation('addition', placementLevel, levelConfig);
    expect(problemPrompt(addition)).toMatch(/^\d+ \+ \d+ = \?$/);

    const multiplication = generateOperation('multiplication', placementLevel, levelConfig);
    expect(problemPrompt(multiplication)).toMatch(/^\d+ × \d+ = \?$/);

    const division = generateOperation('division', placementLevel, levelConfig);
    expect(problemPrompt(division)).toMatch(/^\d+ ÷ \d+ = \?$/);
  });

  it('las potencias se muestran con exponente en superíndice (² o ³)', () => {
    for (let i = 0; i < 10; i += 1) {
      const problem = generateOperation('power', placementLevel, levelConfig);
      expect(problemPrompt(problem)).toMatch(/^\d+[²³] = \?$/);
    }
  });

  it('los problemas con enunciado lo mantienen tal cual', () => {
    const mean = generateOperation('mean', placementLevel, levelConfig);
    const hasPrompt = 'prompt' in mean;
    expect(hasPrompt).toBe(true);
    if (!hasPrompt) {
      return;
    }
    expect(problemPrompt(mean)).toBe(mean.prompt);
  });

  it('la respuesta correcta formateada se acepta en la prueba de colocación (punto y coma decimal)', () => {
    for (const plan of PLACEMENT_PLAN) {
      for (let i = 0; i < 10; i += 1) {
        const problem = generateOperation(plan.operation, placementLevel, levelConfig);
        const canonical = formatProblemAnswer(problem);
        // El input de la colocación pasa por parseFullNumber: la respuesta debe ser un número válido.
        expect(
          parseFullNumber(canonical),
          `${plan.operation}: la respuesta correcta "${canonical}" no es un número válido`,
        ).not.toBeNull();
        expect(answersMatch(problem, canonical), `${plan.operation}: rechaza "${canonical}"`).toBe(true);
        const withComma = canonical.replace('.', ',');
        if (withComma !== canonical) {
          expect(answersMatch(problem, withComma), `${plan.operation}: rechaza "${withComma}"`).toBe(true);
        }
      }
    }
  });
});

describe('Prueba de colocación: componente', () => {
  const renderPlacement = () =>
    render(<PlacementTest onFinish={vi.fn()} onCancel={vi.fn()} />);

  it('la primera pregunta se anuncia y queda asociada al input; el progreso es accesible', () => {
    renderPlacement();

    // Primera pregunta del plan: addition → "N + M = ?"
    const input = screen.getByRole('textbox');
    expect(input).toHaveAccessibleName(/^\d+ \+ \d+ = \?$/);
    expect(input).toHaveFocus();

    const progress = screen.getByRole('progressbar');
    expect(progress).toHaveAttribute('aria-valuemax', String(PLACEMENT_PLAN.length));
    expect(progress).toHaveAttribute('aria-valuenow', '0');
    expect(screen.getByText(/pregunta 1 de/)).toBeInTheDocument();

    // El campo referencia el texto «pregunta X de 16» vía aria-describedby.
    const progressText = screen.getByText(/pregunta 1 de/);
    expect(input).toHaveAttribute('aria-describedby', progressText.id);
  });

  it('una respuesta numérica avanza a la siguiente pregunta', () => {
    renderPlacement();

    fireEvent.change(screen.getByRole('textbox'), { target: { value: '7' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }));

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1');
    expect(screen.getByText(/pregunta 2 de/)).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('regresión: respuesta vacía no cuenta como fallo ni avanza; muestra aviso accesible', () => {
    renderPlacement();

    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }));

    // No avanza: sigue en la primera pregunta.
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
    expect(screen.getByText(/pregunta 1 de/)).toBeInTheDocument();
    // Aviso visible y anunciado por los lectores de pantalla.
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Escribe tu respuesta antes de continuar.');
    const progressText = screen.getByText(/pregunta 1 de/);
    // El input queda marcado como inválido y enlazado al aviso y al texto de progreso.
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', `${progressText.id} ${alert.id}`);
    // El mismo resultado pulsando Intro (submit del formulario).
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.submit(input.closest('form')!);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  });

  it('regresión: texto no numérico tampoco avanza y muestra el aviso', () => {
    renderPlacement();

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'abc' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }));

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
