import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const LINKS = [
  { label: 'Inicio',         path: '/' },
  { label: 'Nosotros',       path: '/nosotros' },
  { label: 'Logros',         path: '/logros' },
  { label: 'Tecnologías',    path: '/tecnologias' },
  { label: 'Documentación',  path: '/documentacion' },
];

export const NavLanding: React.FC = () => {
  const navegar = useNavigate();
  const { pathname } = useLocation();
  const [menuAbierto, setMenuAbierto] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0b10]/90 backdrop-blur-md border-b border-slate-900">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={() => navegar('/')}
          className="font-black text-base tracking-tight text-white cursor-pointer"
        >
          Liga<span className="text-indigo-400">Center</span>
        </button>

        {/* Links desktop */}
        <div className="hidden md:flex items-center gap-1">
          {LINKS.map((l) => (
            <button
              key={l.path}
              onClick={() => navegar(l.path)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                pathname === l.path
                  ? 'bg-indigo-500/15 text-indigo-400'
                  : 'text-slate-400 hover:text-white hover:bg-[#11131c]'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>

        {/* Botón login + hamburger */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navegar('/login')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">login</span>
            <span className="hidden sm:inline">Iniciar sesión</span>
          </button>
          {/* Hamburger mobile */}
          <button
            onClick={() => setMenuAbierto(!menuAbierto)}
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">
              {menuAbierto ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Menú mobile */}
      {menuAbierto && (
        <div className="md:hidden border-t border-slate-900 bg-[#0a0b10] px-6 py-4 flex flex-col gap-1">
          {LINKS.map((l) => (
            <button
              key={l.path}
              onClick={() => { navegar(l.path); setMenuAbierto(false); }}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                pathname === l.path
                  ? 'bg-indigo-500/15 text-indigo-400'
                  : 'text-slate-400 hover:text-white hover:bg-[#11131c]'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
};