import React from 'react';

interface PaginadorProps {
  paginaActual: number;
  totalPaginas: number;
  totalRegistros?: number;
  onCambiarPagina: (pagina: number) => void;
  etiqueta?: string;
  className?: string;
}

export const Paginador: React.FC<PaginadorProps> = ({
  paginaActual,
  totalPaginas,
  totalRegistros,
  onCambiarPagina,
  etiqueta = 'registros',
  className = '',
}) => {
  if (totalPaginas <= 1) return null;

  // Generar rango de números de página inteligente
  const obtenerNumerosPagina = () => {
    const paginas: (number | string)[] = [];
    const maxVisibles = 5;

    if (totalPaginas <= maxVisibles + 2) {
      for (let i = 1; i <= totalPaginas; i++) paginas.push(i);
    } else {
      paginas.push(1);

      let inicio = Math.max(2, paginaActual - 1);
      let fin = Math.min(totalPaginas - 1, paginaActual + 1);

      if (paginaActual <= 3) {
        inicio = 2;
        fin = 4;
      } else if (paginaActual >= totalPaginas - 2) {
        inicio = totalPaginas - 3;
        fin = totalPaginas - 1;
      }

      if (inicio > 2) paginas.push('...');
      for (let i = inicio; i <= fin; i++) paginas.push(i);
      if (fin < totalPaginas - 1) paginas.push('...');

      paginas.push(totalPaginas);
    }
    return paginas;
  };

  return (
    <div className={`p-4 border-t border-[var(--outline)] bg-[var(--surface-container-low)]/95 backdrop-blur-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs ${className}`}>
      {/* Texto informativo */}
      <div className="text-[var(--on-surface-muted)] font-medium flex items-center gap-1.5">
        <span className="material-symbols-outlined text-[var(--text-accent)] text-sm">auto_awesome_motion</span>
        <span>
          Página <strong className="text-[var(--on-surface)] font-bold">{paginaActual}</strong> de{' '}
          <strong className="text-[var(--on-surface)] font-bold">{totalPaginas}</strong>
          {totalRegistros !== undefined && (
            <span className="ml-1 text-[var(--on-surface-variant)] font-normal">
              ({totalRegistros} {etiqueta})
            </span>
          )}
        </span>
      </div>

      {/* Botones de navegación */}
      <div className="flex items-center gap-1.5 flex-wrap justify-center">
        {/* Botón Anterior */}
        <button
          type="button"
          disabled={paginaActual === 1}
          onClick={() => onCambiarPagina(paginaActual - 1)}
          className="px-3 py-1.5 rounded-lg bg-[var(--surface-container-high)] border border-[var(--outline)] text-[var(--on-surface-variant)] font-bold hover:bg-[var(--primary)] hover:text-white hover:border-[var(--primary)] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 cursor-pointer"
        >
          <span className="material-symbols-outlined text-sm">chevron_left</span>
          <span>Anterior</span>
        </button>

        {/* Números de Página */}
        <div className="flex items-center gap-1">
          {obtenerNumerosPagina().map((pag, index) => {
            if (typeof pag === 'string') {
              return (
                <span key={`dots-${index}`} className="px-2 py-1 text-[var(--on-surface-muted)] font-bold">
                  ...
                </span>
              );
            }

            const esActiva = pag === paginaActual;

            return (
              <button
                key={pag}
                type="button"
                onClick={() => onCambiarPagina(pag)}
                className={`min-w-[32px] h-8 px-2 rounded-lg font-extrabold text-xs transition-all cursor-pointer ${
                  esActiva
                    ? 'bg-[var(--primary)] text-white shadow-md shadow-[var(--primary)]/20 border border-[var(--primary-strong)] scale-105'
                    : 'bg-[var(--surface-container-high)] border border-[var(--outline)] text-[var(--on-surface-muted)] hover:bg-[var(--surface-container-highest)] hover:text-[var(--on-surface)]'
                }`}
              >
                {pag}
              </button>
            );
          })}
        </div>

        {/* Botón Siguiente */}
        <button
          type="button"
          disabled={paginaActual === totalPaginas}
          onClick={() => onCambiarPagina(paginaActual + 1)}
          className="px-3 py-1.5 rounded-lg bg-[var(--surface-container-high)] border border-[var(--outline)] text-[var(--on-surface-variant)] font-bold hover:bg-[var(--primary)] hover:text-white hover:border-[var(--primary)] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 cursor-pointer"
        >
          <span>Siguiente</span>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
        </button>
      </div>
    </div>
  );
};
