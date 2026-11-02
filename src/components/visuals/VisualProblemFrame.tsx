import { useId } from 'react';
import type { ReactNode } from 'react';

/**
 * Marco accesible reutilizable para los ejercicios visuales (PIT-15; lo
 * reutilizan PIT-16 y PIT-17): SVG directo con título y descripción
 * vinculados, y alternativa textual (o tabla) equivalente que NUNCA revela
 * la solución. Sin librerías de charts.
 */
export function VisualProblemFrame({
  title,
  description,
  alternative,
  children,
  viewBox = '0 0 640 120',
  maxHeight = 160,
}: {
  title: string;
  description: string;
  /** Alternativa equivalente (texto, tabla…) para quien no ve el gráfico; no debe contener la respuesta. */
  alternative: ReactNode;
  children: ReactNode;
  viewBox?: string;
  maxHeight?: number;
}) {
  const titleId = useId();
  const descId = useId();

  return (
    <div className="space-y-3">
      <svg
        role="img"
        aria-labelledby={`${titleId} ${descId}`}
        viewBox={viewBox}
        className="w-full max-w-md mx-auto"
        style={{ maxHeight }}
      >
        <title id={titleId}>{title}</title>
        <desc id={descId}>{description}</desc>
        {children}
      </svg>
      <div className="text-sm text-gray-600 text-center">{alternative}</div>
    </div>
  );
}
