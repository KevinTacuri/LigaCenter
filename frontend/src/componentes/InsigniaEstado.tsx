import React from 'react';

interface InsigniaEstadoProps {
  estado: string;
  tipo?: 'partido' | 'sancion' | 'usuario' | 'general';
  className?: string;
}

export const InsigniaEstado: React.FC<InsigniaEstadoProps> = ({
  estado,
  tipo = 'general',
  className = '',
}) => {
  const est = estado ? estado.toLowerCase().trim() : '';

  let config = {
    label: estado || 'N/A',
    bg: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    icono: 'info',
    animar: false,
  };

  if (tipo === 'partido') {
    switch (est) {
      case 'en_curso':
      case 'en vivo':
      case 'jugando':
        config = {
          label: 'EN VIVO',
          bg: 'bg-rose-500/15 text-rose-400 border-rose-500/30 shadow-xs shadow-rose-500/10',
          icono: 'sensors',
          animar: true,
        };
        break;
      case 'finalizado':
      case 'terminado':
        config = {
          label: 'Finalizado',
          bg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
          icono: 'check_circle',
          animar: false,
        };
        break;
      case 'programado':
      case 'pendiente':
        config = {
          label: 'Programado',
          bg: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
          icono: 'schedule',
          animar: false,
        };
        break;
      case 'suspendido':
      case 'cancelado':
        config = {
          label: est === 'suspendido' ? 'Suspendido' : 'Cancelado',
          bg: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
          icono: 'warning',
          animar: false,
        };
        break;
      default:
        config.label = estado;
        break;
    }
  } else if (tipo === 'sancion') {
    if (est === 'activa' || est === 'activo') {
      config = {
        label: 'Activa',
        bg: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
        icono: 'gavel',
        animar: false,
      };
    } else {
      config = {
        label: 'Cumplida',
        bg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        icono: 'verified',
        animar: false,
      };
    }
  } else if (tipo === 'usuario' || tipo === 'general') {
    if (est === 'activo' || est === 'active' || est === '1' || est === 'true') {
      config = {
        label: 'Activo',
        bg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        icono: 'check_circle',
        animar: false,
      };
    } else if (est === 'inactivo' || est === 'inactive' || est === '0' || est === 'false') {
      config = {
        label: 'Inactivo',
        bg: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
        icono: 'pause_circle',
        animar: false,
      };
    }
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border transition-all ${config.bg} ${className}`}
    >
      <span
        className={`material-symbols-outlined text-[12px] ${
          config.animar ? 'animate-pulse' : ''
        }`}
      >
        {config.icono}
      </span>
      <span>{config.label}</span>
    </span>
  );
};
