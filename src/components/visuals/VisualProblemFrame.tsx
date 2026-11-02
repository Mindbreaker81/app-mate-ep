import { useId, useState } from 'react';
import type { ReactNode } from 'react';

/**
 * Marco accesible reutilizable para los ejercicios visuales (PIT-15; lo
 * reutilizan PIT-16 y PIT-17): SVG directo con título y descripción
 * vinculados, y alternativa textual (o tabla) equivalente que NUNCA revela
 * la solución. La alternativa está oculta por defecto (sr-only para lectores
 * de pantalla): en varios visuales equivale a leer los datos, así que quien
 * la necesite la abre con el botón «Ver tabla» (aria-expanded). Sin
 * librerías de charts.
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
  const [showAlternative, setShowAlternative] = useState(false);

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
      <div className="text-center">
        <button
          type="button"
          aria-expanded={showAlternative}
          onClick={() => setShowAlternative((show) => !show)}
          className="text-sm font-medium text-blue-700 underline hover:text-blue-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
        >
          {showAlternative ? 'Ocultar tabla' : 'Ver tabla'}
        </button>
      </div>
      {/* Visible ocupa todo el ancho (la tabla no queda apretada en móvil); oculto, sr-only. */}
      <div className={showAlternative ? 'w-full text-sm text-gray-600' : 'sr-only'}>
        {alternative}
      </div>
    </div>
  );
}
