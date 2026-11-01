import React, { createContext, useContext, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { Fraction, MixedNumber, RemainderAnswer } from '../../types';

/**
 * Controles de respuesta extraídos de Exercise.tsx (PIT-18). Todos registran
 * sus inputs en un registro compartido para que el teclado matemático en
 * pantalla sepa a qué campo enviar cada tecla. El registro es opcional: sin
 * proveedor los componentes funcionan exactamente igual que antes.
 */

interface KeyboardFieldRegistry {
  register(id: string, element: HTMLInputElement | null): void;
  get(id: string): HTMLInputElement | null;
  activeId: string | null;
  setActiveId(id: string | null): void;
  ids(): string[];
}

const AnswerKeyboardContext = createContext<KeyboardFieldRegistry | null>(null);

export function AnswerKeyboardProvider({ children }: { children: ReactNode }) {
  const elements = useRef(new Map<string, HTMLInputElement>());
  const [activeId, setActiveId] = useState<string | null>(null);

  const registry = useMemo<KeyboardFieldRegistry>(
    () => ({
      register: (id, element) => {
        if (element) {
          elements.current.set(id, element);
        } else {
          elements.current.delete(id);
        }
      },
      get: (id) => elements.current.get(id) ?? null,
      activeId,
      setActiveId,
      ids: () => [...elements.current.keys()],
    }),
    [activeId],
  );

  return <AnswerKeyboardContext.Provider value={registry}>{children}</AnswerKeyboardContext.Provider>;
}

export function useKeyboardRegistry(): KeyboardFieldRegistry | null {
  return useContext(AnswerKeyboardContext);
}

/**
 * Props para registrar un input bajo un id. Sin proveedor (p. ej. en tests que
 * montan los componentes aislados) devuelve un objeto vacío y el input se
 * comporta como uno normal.
 */
export function useKeyboardInputProps(id: string): {
  ref: (element: HTMLInputElement | null) => void;
  onFocus: () => void;
  onMouseUp: () => void;
  onKeyUp: () => void;
} {
  const registry = useKeyboardRegistry();
  return {
    ref: (element) => registry?.register(id, element),
    onFocus: () => registry?.setActiveId(id),
    onMouseUp: () => registry?.setActiveId(id),
    onKeyUp: () => registry?.setActiveId(id),
  };
}

export function FractionInputs({
  value,
  onChange,
  disabled,
}: {
  value: { numerator: string; denominator: string };
  onChange: React.Dispatch<React.SetStateAction<{ numerator: string; denominator: string }>>;
  disabled: boolean;
}) {
  const numeratorProps = useKeyboardInputProps('numerator');
  const denominatorProps = useKeyboardInputProps('denominator');
  return (
    <span>
      <input
        type="number"
        inputMode="numeric"
        aria-label="Numerador"
        className="h-12 w-20 rounded-lg border-2 border-blue-400 text-center text-2xl mx-1"
        placeholder="Num"
        value={value.numerator}
        onChange={(e) => onChange((prev) => ({ ...prev, numerator: e.target.value }))}
        disabled={disabled}
        {...numeratorProps}
      />
      <span className="text-xl">/</span>
      <input
        type="number"
        inputMode="numeric"
        aria-label="Denominador"
        className="h-12 w-20 rounded-lg border-2 border-blue-400 text-center text-2xl mx-1"
        placeholder="Den"
        value={value.denominator}
        onChange={(e) => onChange((prev) => ({ ...prev, denominator: e.target.value }))}
        disabled={disabled}
        {...denominatorProps}
      />
    </span>
  );
}

export function MixedNumberInputs({
  value,
  onChange,
  disabled,
}: {
  value: { whole: string; numerator: string; denominator: string };
  onChange: React.Dispatch<React.SetStateAction<{ whole: string; numerator: string; denominator: string }>>;
  disabled: boolean;
}) {
  const wholeProps = useKeyboardInputProps('whole');
  return (
    <div className="flex items-center justify-center gap-2">
      <input
        type="number"
        inputMode="numeric"
        aria-label="Parte entera"
        className="h-12 w-20 rounded-lg border-2 border-blue-400 text-center text-2xl"
        placeholder="Ent"
        value={value.whole}
        onChange={(e) => onChange((prev) => ({ ...prev, whole: e.target.value }))}
        disabled={disabled}
        {...wholeProps}
      />
      <FractionInputs
        value={{ numerator: value.numerator, denominator: value.denominator }}
        onChange={(updater) => {
          onChange((prev) => {
            const next = typeof updater === 'function' ? updater(prev) : updater;
            return { ...prev, numerator: next.numerator, denominator: next.denominator };
          });
        }}
        disabled={disabled}
      />
    </div>
  );
}

export function RemainderInputs({
  value,
  onChange,
  disabled,
}: {
  value: { quotient: string; remainder: string };
  onChange: React.Dispatch<React.SetStateAction<{ quotient: string; remainder: string }>>;
  disabled: boolean;
}) {
  const quotientProps = useKeyboardInputProps('quotient');
  const remainderProps = useKeyboardInputProps('remainder');
  return (
    <div className="flex items-center justify-center gap-2">
      <input
        type="number"
        inputMode="numeric"
        aria-label="Cociente"
        className="h-12 w-20 rounded-lg border-2 border-blue-400 text-center text-2xl"
        value={value.quotient}
        onChange={(e) => onChange((prev) => ({ ...prev, quotient: e.target.value }))}
        disabled={disabled}
        {...quotientProps}
      />
      <span className="text-lg">resto</span>
      <input
        type="number"
        inputMode="numeric"
        aria-label="Resto"
        className="h-12 w-20 rounded-lg border-2 border-blue-400 text-center text-2xl"
        value={value.remainder}
        onChange={(e) => onChange((prev) => ({ ...prev, remainder: e.target.value }))}
        disabled={disabled}
        {...remainderProps}
      />
    </div>
  );
}

export function NumericInput({
  userAnswer,
  setAnswer,
  disabled,
  setValidationError,
}: {
  userAnswer: string | Fraction | MixedNumber | RemainderAnswer;
  setAnswer: (value: string) => void;
  disabled: boolean;
  setValidationError: (value: string | null) => void;
}) {
  const fieldProps = useKeyboardInputProps('value');
  return (
    <div className="flex items-center justify-center gap-3">
      <span className="text-2xl text-blue-600">=</span>
      <input
        type="number"
        inputMode="numeric"
        aria-label="Tu respuesta"
        placeholder="Tu respuesta"
        className="h-12 w-32 rounded-lg border-2 border-blue-400 text-center text-2xl"
        value={typeof userAnswer === 'string' ? userAnswer : ''}
        onChange={(e) => {
          setValidationError(null);
          setAnswer(e.target.value);
        }}
        disabled={disabled}
        {...fieldProps}
      />
    </div>
  );
}

export function PromptInput({
  userAnswer,
  setAnswer,
  disabled,
  setValidationError,
  decimal = false,
  factorization = false,
  allowNegative = false,
}: {
  userAnswer: string | Fraction | MixedNumber | RemainderAnswer;
  setAnswer: (value: string) => void;
  disabled: boolean;
  setValidationError: (value: string | null) => void;
  decimal?: boolean;
  factorization?: boolean;
  allowNegative?: boolean;
}) {
  const currentValue = typeof userAnswer === 'string' ? userAnswer : '';
  const fieldProps = useKeyboardInputProps('value');

  const toggleSign = () => {
    setValidationError(null);
    setAnswer(currentValue.startsWith('-') ? currentValue.slice(1) : `-${currentValue}`);
  };

  return (
    <div className="flex items-center justify-center gap-3">
      {!factorization && <span className="text-2xl text-blue-600">=</span>}
      <input
        type={factorization || decimal || allowNegative ? 'text' : 'number'}
        inputMode={factorization ? undefined : decimal ? 'decimal' : 'numeric'}
        step={factorization || allowNegative ? undefined : decimal ? 'any' : '1'}
        aria-label={factorization ? 'Factores primos' : 'Tu respuesta'}
        placeholder={factorization ? '2 x 2 x 3' : 'Tu respuesta'}
        className="h-12 w-full max-w-xs rounded-lg border-2 border-blue-400 text-center text-2xl"
        value={currentValue}
        onChange={(e) => {
          setValidationError(null);
          setAnswer(e.target.value);
        }}
        disabled={disabled}
        {...fieldProps}
      />
      {allowNegative && (
        <button
          type="button"
          aria-label="Cambiar signo"
          onClick={toggleSign}
          disabled={disabled}
          className="h-12 w-12 shrink-0 rounded-lg border-2 border-blue-400 text-xl font-bold text-blue-700 hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 transition-colors"
        >
          ±
        </button>
      )}
    </div>
  );
}
