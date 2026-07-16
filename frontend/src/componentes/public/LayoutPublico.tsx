import React from 'react';
import { CabeceraPublica } from './CabeceraPublica';

interface LayoutPublicoProps {
  children: React.ReactNode;
  onSearch?: (query: string) => void;
}
export const LayoutPublico: React.FC<LayoutPublicoProps> = ({ children, onSearch }) => {
  return (
    <div className="min-h-screen bg-[#0a0b10] text-slate-100 font-sans">
      <CabeceraPublica onSearch={onSearch} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
      <footer className="border-t border-slate-800 mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs text-slate-500 font-medium">
            © {new Date().getFullYear()} LigaCenter - Plataforma de Gestión Deportiva
          </p>
        </div>
      </footer>
    </div>
  );
};