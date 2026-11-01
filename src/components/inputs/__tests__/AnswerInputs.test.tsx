import { fireEvent, render, screen } from '@testing-library/react';
import { useEffect, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import {
  AnswerKeyboardProvider,
  FractionInputs,
  MixedNumberInputs,
  NumericInput,
  PromptInput,
  RemainderInputs,
  useKeyboardRegistry,
} from '../AnswerInputs';

describe('FractionInputs', () => {
  it('renderiza numerador y denominador y notifica los cambios', () => {
    const onChange = vi.fn();
    render(<FractionInputs value={{ numerator: '3', denominator: '' }} onChange={onChange} disabled={false} />);
    const numerator = screen.getByLabelText('Numerador') as HTMLInputElement;
    expect(numerator.value).toBe('3');
    fireEvent.change(screen.getByLabelText('Denominador'), { target: { value: '4' } });
    expect(onChange).toHaveBeenCalled();
  });
});

describe('MixedNumberInputs', () => {
  it('renderiza parte entera y fracción con etiquetas propias', () => {
    const onChange = vi.fn();
    render(<MixedNumberInputs value={{ whole: '2', numerator: '', denominator: '' }} onChange={onChange} disabled={false} />);
    expect(screen.getByLabelText('Parte entera')).toBeTruthy();
    expect(screen.getByLabelText('Numerador')).toBeTruthy();
    expect(screen.getByLabelText('Denominador')).toBeTruthy();
  });
});

describe('RemainderInputs', () => {
  it('renderiza cociente y resto y notifica los cambios', () => {
    const onChange = vi.fn();
    render(<RemainderInputs value={{ quotient: '5', remainder: '' }} onChange={onChange} disabled={false} />);
    expect((screen.getByLabelText('Cociente') as HTMLInputElement).value).toBe('5');
    fireEvent.change(screen.getByLabelText('Resto'), { target: { value: '2' } });
    expect(onChange).toHaveBeenCalled();
  });
});

describe('NumericInput y PromptInput', () => {
  it('NumericInput conserva la etiqueta accesible y avisa del error al escribir', () => {
    const setAnswer = vi.fn();
    const setValidationError = vi.fn();
    render(
      <NumericInput userAnswer="" setAnswer={setAnswer} disabled={false} setValidationError={setValidationError} />,
    );
    fireEvent.change(screen.getByLabelText('Tu respuesta'), { target: { value: '9' } });
    expect(setAnswer).toHaveBeenCalledWith('9');
    expect(setValidationError).toHaveBeenCalledWith(null);
  });

  it('PromptInput con negativos conserva la etiqueta y el botón ±', () => {
    const setAnswer = vi.fn();
    const setValidationError = vi.fn();
    render(
      <PromptInput userAnswer="" setAnswer={setAnswer} disabled={false} setValidationError={setValidationError} allowNegative />,
    );
    expect(screen.getByLabelText('Tu respuesta')).toBeTruthy();
    expect(screen.getByLabelText('Cambiar signo')).toBeTruthy();
  });
});

describe('registro de campos para el teclado', () => {
  it('los inputs se registran en el registro compartido al montarse', () => {
    const seen: string[] = [];

    function Probe() {
      const registry = useKeyboardRegistry();
      useEffect(() => {
        if (registry) {
          seen.push(...registry.ids());
        }
      });
      return null;
    }

    function Harness() {
      const [frac, setFrac] = useState({ numerator: '', denominator: '' });
      return (
        <AnswerKeyboardProvider>
          <FractionInputs value={frac} onChange={setFrac} disabled={false} />
          <Probe />
        </AnswerKeyboardProvider>
      );
    }

    render(<Harness />);
    expect(seen).toContain('numerator');
    expect(seen).toContain('denominator');
  });
});
