import React from 'react';

interface TarjetaLogoCircularProps {
  nombre: string;
  logo?: string | null;
  resolverUrl?: (url: string | null) => string | null;
  tamanio?: 'sm' | 'md' | 'lg';
  className?: string;
}

const TAMANIOS: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-14 h-14 text-xl',
  lg: 'w-20 h-20 text-2xl',
};

export const TarjetaLogoCircular: React.FC<TarjetaLogoCircularProps> = ({
  nombre,
  logo,
  resolverUrl,
  tamanio = 'sm',
  className = '',
}) => {
  const urlResuelta = resolverUrl ? resolverUrl(logo || null) : logo || null;
  const clasesTamanio = TAMANIOS[tamanio];

  if (urlResuelta) {
    return (
      <img
        src={urlResuelta}
        alt={nombre}
        className={`${clasesTamanio} rounded-full object-cover border border-slate-200 shrink-0 ${className}`}
      />
    );
  }

  const inicial = nombre?.trim()?.[0]?.toUpperCase() || '?';
  return (
    <div
      className={`${clasesTamanio} rounded-full border border-slate-200 bg-slate-100 flex items-center justify-center font-bold text-slate-500 shrink-0 ${className}`}
    >
      {inicial}
    </div>
  );
};