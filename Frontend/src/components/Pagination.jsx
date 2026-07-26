import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Componente genérico de paginación client-side.
 *
 * Sin conocimiento del dominio: no sabe nada de clientes, préstamos ni
 * productos. Solo recibe números + callback. La lista padre es responsable
 * de filtrar y luego hacer `slice` sobre la lista filtrada.
 *
 * Layout (izquierda → derecha):
 *   - Indicador "Mostrando X-Y de Z"
 *   - Botón "Anterior" (disabled en página 1)
 *   - Números de página con elipsis (1 2 ... 5 6 7 ... 20)
 *   - Botón "Siguiente" (disabled en última página)
 *
 * Mobile (< sm): oculta los números, conserva flechas + indicador.
 *
 * Edge cases:
 *   - totalPages <= 1 → solo el indicador (sin barra completa).
 *   - 0 items → "Sin resultados".
 *   - currentPage fuera de rango → clamp defensivo a [1, totalPages].
 */
export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  siblingCount = 1,
}) {
  // Edge: 0 o 1 página → solo el indicador (sin flechas ni números).
  if (totalPages <= 1) {
    return (
      <div className="flex items-center justify-between mt-4 text-xs text-slate-500 dark:text-slate-400">
        <span>
          {totalItems === 0
            ? 'Sin resultados'
            : `Mostrando ${totalItems} de ${totalItems}`}
        </span>
      </div>
    );
  }

  // Clamp defensivo: si currentPage viene stale (p.ej. tras un filtro que
  // dejó 0 items en la página actual), lo bajamos a un rango válido.
  const safePage = Math.max(1, Math.min(currentPage, totalPages));
  const from = (safePage - 1) * pageSize + 1;
  const to = Math.min(safePage * pageSize, totalItems);

  /**
   * Construye el array de páginas a renderizar, intercalando 'ellipsis-left'
   * y 'ellipsis-right' cuando hay muchos saltos. Inspirado en el patrón
   * estándar de Material-UI / Ant Design.
   *
   * totalNumbers = siblings en cada lado + current + first + last
   * totalBlocks  = totalNumbers + 2 elipsis (cuando aplica)
   */
  const buildPageNumbers = () => {
    const pages = [];
    const totalNumbers = siblingCount * 2 + 3; // siblings + first + last + current
    const totalBlocks = totalNumbers + 2; // + 2 for ellipsis

    // Pocas páginas: render directo, sin elipsis.
    if (totalPages <= totalBlocks) {
      for (let i = 1; i <= totalPages; i += 1) pages.push(i);
      return pages;
    }

    const leftSibling = Math.max(safePage - siblingCount, 1);
    const rightSibling = Math.min(safePage + siblingCount, totalPages);

    const showLeftDots = leftSibling > 2;
    const showRightDots = rightSibling < totalPages - 1;

    if (!showLeftDots && showRightDots) {
      // Elipsis solo a la derecha: 1 2 3 4 5 ... 20
      const leftRange = 1 + 2 * siblingCount + 1;
      for (let i = 1; i <= leftRange; i += 1) pages.push(i);
      pages.push('ellipsis-right');
      pages.push(totalPages);
    } else if (showLeftDots && !showRightDots) {
      // Elipsis solo a la izquierda: 1 ... 16 17 18 19 20
      pages.push(1);
      pages.push('ellipsis-left');
      const rightRange = totalPages - 2 * siblingCount;
      for (let i = rightRange; i <= totalPages; i += 1) pages.push(i);
    } else {
      // Elipsis en ambos lados: 1 ... 4 5 6 ... 20
      pages.push(1);
      pages.push('ellipsis-left');
      for (let i = leftSibling; i <= rightSibling; i += 1) pages.push(i);
      pages.push('ellipsis-right');
      pages.push(totalPages);
    }
    return pages;
  };

  const pageNumbers = buildPageNumbers();

  return (
    <nav
      role="navigation"
      aria-label="Paginación"
      className="flex items-center justify-between gap-2 mt-6 text-xs"
    >
      <span className="text-slate-500 dark:text-slate-400 font-medium">
        Mostrando{' '}
        <strong className="text-slate-700 dark:text-slate-300">
          {from}-{to}
        </strong>{' '}
        de{' '}
        <strong className="text-slate-700 dark:text-slate-300">
          {totalItems}
        </strong>
      </span>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(safePage - 1)}
          disabled={safePage === 1}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50"
          aria-label="Página anterior"
        >
          <ChevronLeft size={14} />
        </button>

        <div className="hidden sm:flex items-center gap-1">
          {pageNumbers.map((p, i) =>
            p === 'ellipsis-left' || p === 'ellipsis-right' ? (
              <span
                key={`ellipsis-${i}`}
                className="px-2 text-slate-400 dark:text-slate-600"
                aria-hidden="true"
              >
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                aria-current={p === safePage ? 'page' : undefined}
                aria-label={`Página ${p}`}
                className={`min-w-[28px] h-7 px-2 rounded-lg text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 ${
                  p === safePage
                    ? 'bg-violet-600 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {p}
              </button>
            )
          )}
        </div>

        {/* Mobile: indicador compacto current/total en vez de números */}
        <span className="sm:hidden px-2 text-slate-500 dark:text-slate-400 font-medium">
          {safePage} / {totalPages}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(safePage + 1)}
          disabled={safePage === totalPages}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50"
          aria-label="Página siguiente"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </nav>
  );
}

export default Pagination;
