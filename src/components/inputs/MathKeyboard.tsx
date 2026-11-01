import { deleteBackward, insertText, toggleNumericSign, type FieldEditResult } from '../../utils/answerEditing';
import { useKeyboardRegistry } from './AnswerInputs';

/**
 * Teclado matemático opcional en pantalla (PIT-18). Lo abre el niño con el
 * botón «Teclado»; NO sustituye al teclado nativo (los inputs conservan su
 * inputMode y la entrada física). Cada tecla edita el campo activo respetando
 * cursor y selección mediante las funciones puras de answerEditing.ts.
 */

export interface MathKeyboardField {
  /** Debe coincidir con el id registrado por el input (useKeyboardInputProps). */
  id: string;
  label: string;
  value: string;
  onEdit(next: FieldEditResult): void;
}

export interface MathKeyboardProps {
  fields: MathKeyboardField[];
  /** Muestra la coma decimal (el validador acepta coma y punto). */
  decimal?: boolean;
  /** Muestra ± solo en operaciones que admiten negativos. */
  allowNegative?: boolean;
  /** Factorización: 'x' como separador (validación existente, sin coma). */
  factorization?: boolean;
  /** Cambio de campo: barra (fracciones/mixtos) o ciclo (cociente/resto). */
  fieldSwitcher?: 'slash' | 'cycle';
  disabled?: boolean;
}

const KEY_CLASS =
  'h-11 w-11 rounded-lg border-2 border-blue-300 bg-white text-lg font-semibold text-blue-800 ' +
  'hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ' +
  'focus-visible:outline-blue-500 transition-colors disabled:opacity-40';

export function MathKeyboard({
  fields,
  decimal = false,
  allowNegative = false,
  factorization = false,
  fieldSwitcher,
  disabled = false,
}: MathKeyboardProps) {
  const registry = useKeyboardRegistry();

  const activeId = registry?.activeId ?? null;
  const currentField = fields.find((field) => field.id === activeId) ?? fields[0] ?? null;

  if (!currentField) {
    return null;
  }

  const apply = (edit: (value: string, start: number, end: number) => FieldEditResult) => {
    if (disabled) {
      return;
    }
    const element = registry?.get(currentField.id) ?? null;
    const focused = element !== null && element === document.activeElement && !element.disabled;
    const start = focused && element.selectionStart !== null ? element.selectionStart : currentField.value.length;
    const end = focused && element.selectionEnd !== null ? element.selectionEnd : currentField.value.length;
    const next = edit(currentField.value, start, end);
    currentField.onEdit(next);
    // Restaurar el cursor tras el re-render del valor controlado.
    if (element) {
      window.setTimeout(() => {
        element.focus();
        if (element.selectionStart !== null) {
          element.setSelectionRange(next.caret, next.caret);
        }
      }, 0);
    }
  };

  const switchField = () => {
    if (disabled || fields.length < 2) {
      return;
    }
    const index = fields.findIndex((field) => field.id === currentField.id);
    const target = fields[Math.min(index + 1, fields.length - 1)];
    registry?.setActiveId(target.id);
    registry?.get(target.id)?.focus();
  };

  const toggleSign = () =>
    apply((value, start) => {
      const nextValue = toggleNumericSign(value);
      const addingSign = nextValue.length > value.length;
      return { value: nextValue, caret: addingSign ? start + 1 : Math.max(start - 1, 0) };
    });

  const keyButton = (label: string, ariaLabel: string, onClick: () => void) => (
    <button
      key={ariaLabel}
      type="button"
      aria-label={ariaLabel}
      className={KEY_CLASS}
      onClick={onClick}
      // El clic no mueve el foco del input: el cursor sigue donde estaba.
      onMouseDown={(event) => event.preventDefault()}
      disabled={disabled}
    >
      {label}
    </button>
  );

  const digit = (value: string) => keyButton(value, value, () => apply((v, s, e) => insertText(v, s, e, value)));

  return (
    <div
      role="group"
      aria-label="Teclado matemático"
      className="flex flex-col items-center gap-1 p-2 bg-gray-50 rounded-lg border border-gray-200"
    >
      <div className="flex flex-wrap justify-center gap-1">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(digit)}
        {digit('0')}
        {factorization
          ? keyButton('x', 'Por', () => apply((v, s, e) => insertText(v, s, e, 'x')))
          : decimal
            ? keyButton(',', 'Coma', () => apply((v, s, e) => insertText(v, s, e, ',')))
            : null}
        {allowNegative ? keyButton('±', 'Cambiar signo', toggleSign) : null}
        {keyButton('⌫', 'Borrar', () => apply((v, s, e) => deleteBackward(v, s, e)))}
        {fieldSwitcher && fields.length > 1
          ? keyButton(
              fieldSwitcher === 'slash' ? '/' : '⇄',
              fieldSwitcher === 'slash' ? 'Siguiente campo' : 'Cambiar de campo',
              switchField,
            )
          : null}
      </div>
    </div>
  );
}
