import { useId } from 'react';
import type { ReactNode } from 'react';

/**
 * Marco accesible reutilizable para los ejercicios visuales (PIT-15, lo
 * reutilizan PIT-16 y PIT-17): SVG directo con título y descripción
 * vinculados, y alternativa textual equivalente que NUNCA revela la
 * solución. Sin librerías de charts.
 */
export function VisualProblemFrame({
  title,
  description,
  alternative,
  children,
}: {
  title: string;
  description: string;
  /** Texto equivalente para who no ve el gráfico; no debe contener la respuesta. */
  alternative: string;
  children: ReactNode;
}) {
  const titleId = useId();
  const descId = useId();
  const altId = useId();

  return (
    <div className="space-y-3">
      <svg
        role="img"
        aria-labelledby={`${titleId} ${descId}`}
        viewBox="0 0 640 120"
        className="w-full max-w-md mx-auto"
        style={{ maxHeight: 160 }}
      >
        <title id={titleId}>{title}</title>
        <desc id={descId}>{description}</desc>
        {children}
      </svg>
      <p id={altId} className="text-sm text-gray-600 text-center">
        {alternative}
      </p>
    </div>
  );
}
