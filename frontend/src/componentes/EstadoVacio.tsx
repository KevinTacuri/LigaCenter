import React from 'react';

interface EstadoVacioProps {
  icono?: string;
  titulo?: string;
  descripcion?: string;
  textoBoton?: string;
  onAccion?: () => void;
  className?: string;
}

export const EstadoVacio: React.FC<EstadoVacioProps> = ({
  icono = 'inbox',
  titulo = 'Sin registros encontrados',
  descripcion = 'No hay datos disponibles en esta sección por el momento.',
  textoBoton,
  onAccion,
  className = '',
}) => {
  return (
    <div
      className={`p-10 rounded-2xl bg-[#11131c]/60 border border-slate-800/80 text-center flex flex-col items-center justify-center my-4 backdrop-blur-xs ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-3.5 text-indigo-400 shadow-inner">
        <span className="material-symbols-outlined text-2xl">{icono}</span>
      </div>

      <h4 className="text-sm font-extrabold text-white mb-1 tracking-wide">{titulo}</h4>
      <p className="text-xs text-slate-400 max-w-sm font-normal leading-relaxed">{descripcion}</p>

      {textoBoton && onAccion && (
        <button
          type="button"
          onClick={onAccion}
          className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2 cursor-pointer"
        >
          <span className="material-symbols-outlined text-sm">add_circle</span>
          <span>{textoBoton}</span>
        </button>
      )}
    </div>
  );
};
