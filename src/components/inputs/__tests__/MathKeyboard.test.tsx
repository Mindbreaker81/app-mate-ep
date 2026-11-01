import { fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import {
  AnswerKeyboardProvider,
  FractionInputs,
  NumericInput,
  RemainderInputs,
} from '../AnswerInputs';
import { MathKeyboard, type MathKeyboardField } from '../MathKeyboard';

function keyboardGroup() {
  return screen.getByRole('group', { name: 'Teclado matemático' });
}

function SingleHarness({
  decimal = false,
  allowNegative = false,
  disabled = false,
}: {
  decimal?: boolean;
  allowNegative?: boolean;
  disabled?: boolean;
}) {
  const [value, setValue] = useState('');
  const fields: MathKeyboardField[] = [
    { id: 'value', label: 'Respuesta', value, onEdit: (next) => setValue(next.value) },
  ];
  return (
    <AnswerKeyboardProvider>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmitSpy();
        }}
      >
        <NumericInput userAnswer={value} setAnswer={setValue} disabled={disabled} setValidationError={() => {}} />
        <MathKeyboard fields={fields} decimal={decimal} allowNegative={allowNegative} disabled={disabled} />
      </form>
      <span data-testid="mirror">{value}</span>
    </AnswerKeyboardProvider>
  );
}

const onSubmitSpy = vi.fn();

describe('MathKeyboard', () => {
  it('los dígitos actualizan el campo y el botón no envía el formulario', () => {
    onSubmitSpy.mockClear();
    render(<SingleHarness />);
    const group = keyboardGroup();
    fireEvent.click(within(group).getByRole('button', { name: '1' }));
    fireEvent.click(within(group).getByRole('button', { name: '2' }));
    expect(screen.getByTestId('mirror').textContent).toBe('12');
    expect(onSubmitSpy).not.toHaveBeenCalled();
  });

  it('borra el último dígito', () => {
    render(<SingleHarness />);
    const group = keyboardGroup();
    fireEvent.click(within(group).getByRole('button', { name: '7' }));
    fireEvent.click(within(group).getByRole('button', { name: 'Borrar' }));
    expect(screen.getByTestId('mirror').textContent).toBe('');
  });

  it('la coma solo está disponible si se permite decimal', () => {
    const withoutDecimal = render(<SingleHarness decimal={false} />);
    expect(within(keyboardGroup()).queryByRole('button', { name: 'Coma' })).toBeNull();
    withoutDecimal.unmount();

    render(<SingleHarness decimal />);
    const comma = within(keyboardGroup()).getByRole('button', { name: 'Coma' });
    fireEvent.click(within(keyboardGroup()).getByRole('button', { name: '3' }));
    fireEvent.click(comma);
    fireEvent.click(within(keyboardGroup()).getByRole('button', { name: '5' }));
    expect(screen.getByTestId('mirror').textContent).toBe('3,5');
  });

  it('± solo aparece con negativos y alterna el signo', () => {
    const withoutNegative = render(<SingleHarness allowNegative={false} />);
    expect(within(keyboardGroup()).queryByRole('button', { name: 'Cambiar signo' })).toBeNull();
    withoutNegative.unmount();

    render(<SingleHarness allowNegative />);
    const group = keyboardGroup();
    fireEvent.click(within(group).getByRole('button', { name: '5' }));
    fireEvent.click(within(group).getByRole('button', { name: 'Cambiar signo' }));
    expect(screen.getByTestId('mirror').textContent).toBe('-5');
    fireEvent.click(within(group).getByRole('button', { name: 'Cambiar signo' }));
    expect(screen.getByTestId('mirror').textContent).toBe('5');
  });

  it('deshabilitado no edita', () => {
    render(<SingleHarness disabled />);
    fireEvent.click(within(keyboardGroup()).getByRole('button', { name: '1' }));
    expect(screen.getByTestId('mirror').textContent).toBe('');
  });

  it('en fracciones la barra cambia de numerador a denominador', () => {
    function FractionHarness() {
      const [frac, setFrac] = useState({ numerator: '', denominator: '' });
      const fields: MathKeyboardField[] = [
        { id: 'numerator', label: 'Numerador', value: frac.numerator, onEdit: (next) => setFrac((prev) => ({ ...prev, numerator: next.value })) },
        { id: 'denominator', label: 'Denominador', value: frac.denominator, onEdit: (next) => setFrac((prev) => ({ ...prev, denominator: next.value })) },
      ];
      return (
        <AnswerKeyboardProvider>
          <FractionInputs value={frac} onChange={setFrac} disabled={false} />
          <MathKeyboard fields={fields} fieldSwitcher="slash" />
        </AnswerKeyboardProvider>
      );
    }

    render(<FractionHarness />);
    const group = keyboardGroup();
    fireEvent.click(within(group).getByRole('button', { name: '3' }));
    fireEvent.click(within(group).getByRole('button', { name: 'Siguiente campo' }));
    fireEvent.click(within(group).getByRole('button', { name: '4' }));
    expect((screen.getByLabelText('Numerador') as HTMLInputElement).value).toBe('3');
    expect((screen.getByLabelText('Denominador') as HTMLInputElement).value).toBe('4');
  });

  it('en cociente y resto permite cambiar de campo', () => {
    function RemainderHarness() {
      const [value, setValue] = useState({ quotient: '', remainder: '' });
      const fields: MathKeyboardField[] = [
        { id: 'quotient', label: 'Cociente', value: value.quotient, onEdit: (next) => setValue((prev) => ({ ...prev, quotient: next.value })) },
        { id: 'remainder', label: 'Resto', value: value.remainder, onEdit: (next) => setValue((prev) => ({ ...prev, remainder: next.value })) },
      ];
      return (
        <AnswerKeyboardProvider>
          <RemainderInputs value={value} onChange={setValue} disabled={false} />
          <MathKeyboard fields={fields} fieldSwitcher="cycle" />
        </AnswerKeyboardProvider>
      );
    }

    render(<RemainderHarness />);
    const group = keyboardGroup();
    fireEvent.click(within(group).getByRole('button', { name: '5' }));
    fireEvent.click(within(group).getByRole('button', { name: 'Cambiar de campo' }));
    fireEvent.click(within(group).getByRole('button', { name: '2' }));
    expect((screen.getByLabelText('Cociente') as HTMLInputElement).value).toBe('5');
    expect((screen.getByLabelText('Resto') as HTMLInputElement).value).toBe('2');
  });
});
