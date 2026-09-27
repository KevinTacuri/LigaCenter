import React from 'react';

interface BadgeEstadoFixtureProps {
  estado: string;
  tipo?: 'partido' | 'general';
  className?: string;
}

export const BadgeEstadoFixture: React.FC<BadgeEstadoFixtureProps> = ({
  estado,
  tipo = 'partido',
  className = '',
}) => {
  const valor = estado?.toLowerCase().trim() || '';

  const estilosPorEstado: Record<string, { label: string; clases: string }> = {
    'en_curso': {
      label: 'EN VIVO',
      clases: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    },
    'finalizado': {
      label: 'Finalizado',
      clases: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    },
    'programado': {
      label: 'Programado',
      clases: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
    },
    'pendiente': {
      label: 'Pendiente',
      clases: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    },
    'cancelado': {
      label: 'Cancelado',
      clases: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    },
    'suspendido': {
      label: 'Suspendido',
      clases: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    },
    'reprogramado': {
      label: 'Reprogramado',
      clases: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
    },
    'activo': {
      label: 'Activo',
      clases: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    },
    'inactivo': {
      label: 'Inactivo',
      clases: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
    },
  };

  const config = estilosPorEstado[valor] || {
    label: estado || 'N/A',
    clases: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 border rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider ${config.clases} ${className}`}
    >
      <span className="material-symbols-outlined text-[12px]">
        {valor === 'en_curso' ? 'sensors' : valor === 'finalizado' ? 'check_circle' : valor === 'programado' || valor === 'pendiente' ? 'schedule' : valor === 'cancelado' || valor === 'suspendido' ? 'warning' : 'info'}
      </span>
      <span>{config.label}</span>
    </span>
  );
};
