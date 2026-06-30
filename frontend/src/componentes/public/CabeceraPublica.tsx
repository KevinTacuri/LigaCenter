import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAutenticacion } from '../../contexto/ContextoAutenticacion';
import logoImg from '../../assets/logo.svg';
import { BotonTema } from '../BotonTema';

interface CabeceraPublicaProps {
  onSearch?: (query: string) => void;
}

export const CabeceraPublica: React.FC<CabeceraPublicaProps> = ({ onSearch }) => {
  const navigate = useNavigate();
  const { usuario } = useAutenticacion();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() && onSearch) {
      onSearch(searchQuery.trim());
    } else if (searchQuery.trim()) {
      navigate(`/buscar?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const isAuthenticated = !!usuario;

  return (
    <header className="bg-[#11131c]/95 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 h-16 sticky top-0 z-40 flex items-center justify-between shrink-0">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 shrink-0">
        <img src={logoImg} className="w-8 h-8 object-contain" alt="LigaCenter" />
        <span className="font-black text-white text-sm uppercase tracking-tight hidden sm:block">
          Liga<span className="text-indigo-400">Center</span>
        </span>
      </Link>

      {/* Buscador */}
      <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-3 sm:mx-4">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-base pointer-events-none">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar partidos, competiciones, equipos, jugadores..."
            className="w-full bg-[#0c0e16] border border-slate-800 text-slate-200 text-sm rounded-xl pl-9 pr-4 py-2 outline-none focus:border-indigo-500/50 transition-colors placeholder-slate-500"
          />
        </div>
      </form>

      {/* Acciones derecha */}
      <div className="flex items-center gap-2 shrink-0">
        <BotonTema />

        {isAuthenticated ? (
          <Link
            to="/tablero"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-650 hover:bg-indigo-600 text-white rounded-lg text-xs font-bold transition-colors"
          >
            <span className="material-symbols-outlined text-sm">dashboard</span>
            <span className="hidden sm:inline">Panel</span>
          </Link>
        ) : (
          <>
            <Link
              to="/login"
              className="px-3 py-1.5 text-xs font-bold text-slate-300 hover:text-white transition-colors"
            >
              Iniciar Sesión
            </Link>
            <Link
              to="/registro"
              className="px-3 py-1.5 bg-indigo-650 hover:bg-indigo-600 text-white rounded-lg text-xs font-bold transition-colors"
            >
              Registrarse
            </Link>
          </>
        )}
      </div>
    </header>
  );
};