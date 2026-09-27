import React, { useEffect, useState } from 'react';

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
  const [temaActual, setTemaActual] = useState<'light' | 'dark'>(() =>
    document.documentElement.classList.contains('light') ? 'light' : 'dark'
  );

  useEffect(() => {
    const actualizarTema = () => {
      setTemaActual(document.documentElement.classList.contains('light') ? 'light' : 'dark');
    };

    actualizarTema();
    const observer = new MutationObserver(actualizarTema);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

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
  const esModoClaro = temaActual === 'light';

  return (
    <div
      className={`${clasesTamanio} rounded-full border border-[var(--primary)]/30 flex items-center justify-center font-black shrink-0 ${className}`}
      style={{
        backgroundColor: esModoClaro ? 'rgba(25, 59, 112, 0.5)' : 'rgba(255, 255, 255, 0.5)',
        color: esModoClaro ? '#ffffff' : 'var(--primary)',
      }}
    >
      {inicial}
    </div>
  );
};