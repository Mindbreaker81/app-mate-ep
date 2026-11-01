import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MATH_GLOSSARY, type GlossaryTerm } from '../data/mathGlossary';
import { getGlossaryTerm, searchGlossary } from '../utils/glossary';

interface MathGlossaryProps {
  onClose: () => void;
  /** Término destacado al abrir (desde una explicación o un «Ver también»). */
  initialTermId?: string;
}

/**
 * Panel modal del glosario catalán–castellano. Es un overlay `fixed`: no
 * desmonta el contenido de debajo (ejercicio, temporizador y ayuda siguen
 * montados) y funciona offline porque los datos son locales.
 */
export function MathGlossary({ onClose, initialTermId }: MathGlossaryProps) {
  const [query, setQuery] = useState('');
  const [highlightedId, setHighlightedId] = useState<string | null>(() =>
    initialTermId && getGlossaryTerm(initialTermId) ? initialTermId : null,
  );
  const dialogRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // El foco entra en el buscador al abrir y vuelve al elemento que lo abrió.
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    searchRef.current?.focus();
    return () => {
      previous?.focus();
    };
  }, []);

  // Desplaza el término destacado a la vista (si el navegador lo permite).
  useEffect(() => {
    if (!highlightedId) {
      return;
    }
    const element = dialogRef.current?.querySelector(`[data-term-id="${highlightedId}"]`);
    if (element && typeof element.scrollIntoView === 'function') {
      element.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedId]);

  const results = useMemo(() => searchGlossary(query), [query]);

  const jumpToTerm = (termId: string) => {
    setQuery('');
    setHighlightedId(termId);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== 'Tab' || !dialogRef.current) {
      return;
    }
    const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
      'input, button, [href], [tabindex]:not([tabindex="-1"])',
    );
    if (focusables.length === 0) {
      return;
    }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Glosario de términos matemáticos catalán-castellano"
        className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-lg bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center justify-between gap-4 border-b border-gray-200 p-4">
          <h2 className="text-xl font-bold text-blue-700">📖 Glosario catalán–castellano</h2>
          <button
            type="button"
            className="text-lg font-bold text-blue-600 hover:text-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
            onClick={onClose}
            aria-label="Cerrar glosario"
          >
            ✕
          </button>
        </div>

        <div className="border-b border-gray-200 p-4">
          <input
            ref={searchRef}
            type="search"
            role="searchbox"
            aria-label="Buscar en el glosario"
            placeholder="Busca en castellano o en catalán…"
            className="h-12 w-full rounded-lg border-2 border-blue-400 px-4 text-lg"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {results.length === 0 ? (
            <p className="py-8 text-center text-gray-600" role="status">
              Sin resultados para «{query}». Prueba con otra palabra.
            </p>
          ) : (
            <ul className="space-y-3">
              {results.map((term) => (
                <GlossaryTermCard
                  key={term.id}
                  term={term}
                  highlighted={highlightedId === term.id}
                  onJump={jumpToTerm}
                />
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-gray-200 p-3 text-center text-sm text-gray-500">
          {results.length} de {MATH_GLOSSARY.length} términos · la interfaz sigue en castellano
        </div>
      </div>
    </div>
  );
}

function GlossaryTermCard({
  term,
  highlighted,
  onJump,
}: {
  term: GlossaryTerm;
  highlighted: boolean;
  onJump: (termId: string) => void;
}) {
  const relatedTerms = (term.related ?? [])
    .map((id) => getGlossaryTerm(id))
    .filter((related): related is GlossaryTerm => related !== null);

  return (
    <li>
      <article
        data-term-id={term.id}
        aria-current={highlighted ? 'true' : undefined}
        className={`rounded-lg border-2 p-4 ${
          highlighted ? 'border-amber-400 bg-amber-50' : 'border-gray-200 bg-gray-50'
        }`}
      >
        <header className="flex flex-wrap items-baseline gap-x-3">
          <h3 className="text-lg font-bold text-gray-800">{term.es}</h3>
          <span lang="ca" className="text-lg font-semibold text-purple-700">
            {term.ca}
          </span>
        </header>
        <p className="mt-1 text-gray-700">{term.definition}</p>
        <p className="mt-1 text-gray-600">
          <span className="font-semibold">Ejemplo:</span> {term.example}
        </p>
        {relatedTerms.length > 0 && (
          <p className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <span className="font-semibold text-gray-600">Ver también:</span>
            {relatedTerms.map((related) => (
              <button
                key={related.id}
                type="button"
                onClick={() => onJump(related.id)}
                className="rounded-full border border-blue-300 bg-blue-50 px-2 py-0.5 font-semibold text-blue-800 hover:bg-blue-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
              >
                {related.es}
              </button>
            ))}
          </p>
        )}
      </article>
    </li>
  );
}
