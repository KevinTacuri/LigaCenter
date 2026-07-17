import React, { useState, useEffect } from 'react';

export const BotonTema: React.FC = () => {
  const [tema, setTema] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'dark';
  });

  useEffect(() => {
    const htmlEl = document.documentElement;
    if (tema === 'light') {
      htmlEl.classList.add('light');
      htmlEl.classList.remove('dark');
    } else {
      htmlEl.classList.add('dark');
      htmlEl.classList.remove('light');
    }
    localStorage.setItem('theme', tema);
  }, [tema]);

  // Listener para sincronizar múltiples botones de tema si cambian en otra parte de la UI
  useEffect(() => {
    const manejarCambioStorage = () => {
      const temaActual = (localStorage.getItem('theme') as 'light' | 'dark') || 'dark';
      setTema(temaActual);
    };
    window.addEventListener('storage', manejarCambioStorage);
    // Intervalo de respaldo para cambios rápidos en la misma ventana
    const intervalo = setInterval(() => {
      const temaActual = (localStorage.getItem('theme') as 'light' | 'dark') || 'dark';
      if (temaActual !== tema) {
        setTema(temaActual);
      }
    }, 500);

    return () => {
      window.removeEventListener('storage', manejarCambioStorage);
      clearInterval(intervalo);
    };
  }, [tema]);

  return (
    <button
      onClick={() => setTema(tema === 'light' ? 'dark' : 'light')}
      className="w-9 h-9 rounded-lg text-slate-400 hover:text-white dark:hover:text-white hover:bg-slate-800/40 dark:hover:bg-slate-800/40 light:hover:bg-slate-200/50 light:hover:text-[#193b70] transition-colors cursor-pointer flex items-center justify-center shrink-0 border border-transparent hover:border-slate-800 light:hover:border-slate-200"
      title={`Cambiar a modo ${tema === 'light' ? 'oscuro' : 'claro'}`}
    >
      <span className="material-symbols-outlined text-xl">
        {tema === 'light' ? 'dark_mode' : 'light_mode'}
      </span>
    </button>
  );
};
