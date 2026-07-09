import React from 'react';
import { useAutenticacion } from '../contexto/ContextoAutenticacion';
import { useCampeonato } from '../contexto/ContextoCampeonato';
import { serviciosCampeonatos } from '../servicios/api';
import { BotonTema } from './BotonTema';
import { sileo } from 'sileo';

interface CabeceraEstandarProps {
  titulo?: string;
  subtitulo?: string;
  leftElement?: React.ReactNode;
}

export const CabeceraEstandar: React.FC<CabeceraEstandarProps> = ({
  titulo,
  subtitulo,
  leftElement,
}) => {
  const { usuario, tieneRol } = useAutenticacion();
  const { campeonatoActivo, panelCampeonatosAbierto, setPanelCampeonatosAbierto } = useCampeonato();

  const manejarDescargarReglamento = async () => {
    if (!campeonatoActivo) return;
    try {
      const blob = await serviciosCampeonatos.descargarReglamento(campeonatoActivo.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Reglamento-${campeonatoActivo.name.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      sileo.error({
        title: 'Error de Descarga',
        description: 'No se pudo descargar el reglamento del torneo.'
      });
    }
  };

  // Valores por defecto si no se especifican
  const displayTitle = titulo || campeonatoActivo?.name || 'LigaCenter';
  const displaySubtitle =
    subtitulo ||
    (usuario
      ? `${usuario.name} • ${usuario.roles?.[0]?.replace('_', ' ') || 'Usuario'}`
      : 'Plataforma Deportiva');

  const esAdministrador = tieneRol('administrador');

  return (
    <header className="bg-[#11131c]/90 backdrop-blur-md border-b border-slate-800 px-6 h-16 sticky top-0 z-30 shadow-xs flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        {leftElement}
        <div>
          <h1 className="text-lg font-black text-white leading-none tracking-tight">
            {displayTitle}
          </h1>
          <span className="text-[10px] text-slate-450 font-semibold tracking-wider uppercase mt-1.5 block leading-none">
            {displaySubtitle}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <BotonTema />

        {!esAdministrador && campeonatoActivo && campeonatoActivo.rules_pdf && (
          <button
            onClick={manejarDescargarReglamento}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer transition-all shadow-xs"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            <span className="hidden sm:inline">Reglamento (PDF)</span>
          </button>
        )}

        {!esAdministrador && (
          <div className="flex items-center gap-2">
            {campeonatoActivo ? (
              <a
                href={`/publico?campeonato=${campeonatoActivo.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer transition-all shadow-xs"
              >
                <span className="material-symbols-outlined text-sm">visibility</span>
                <span className="hidden sm:inline">Vista Pública</span>
              </a>
            ) : (
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer transition-all shadow-xs"
              >
                <span className="material-symbols-outlined text-sm">visibility</span>
                <span className="hidden sm:inline">Portal Público</span>
              </a>
            )}

            {!panelCampeonatosAbierto && (
              campeonatoActivo ? (
                <button
                  onClick={() => setPanelCampeonatosAbierto(true)}
                  className="flex items-center gap-1.5 bg-[#800f2f] hover:bg-[#991238] text-white border border-[#800f2f] rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer transition-all shadow-xs active:scale-95"
                >
                  <span className="material-symbols-outlined text-sm">swap_horiz</span>
                  <span className="hidden sm:inline">Cambiar Torneo</span>
                </button>
              ) : (
                <button
                  onClick={() => setPanelCampeonatosAbierto(true)}
                  className="flex items-center gap-1.5 bg-indigo-650 hover:bg-indigo-600 text-white rounded-lg px-3.5 py-1.5 text-xs font-bold cursor-pointer transition-all shadow-xs"
                >
                  <span className="material-symbols-outlined text-sm">sports_soccer</span>
                  <span>Seleccionar Campeonato</span>
                </button>
              )
            )}
          </div>
        )}
      </div>
    </header>
  );
};
