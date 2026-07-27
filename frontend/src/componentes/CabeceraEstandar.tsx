import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAutenticacion } from '../contexto/ContextoAutenticacion';
import { useCampeonato } from '../contexto/ContextoCampeonato';
import { serviciosCampeonatos } from '../servicios/api';
import { BotonTema } from './BotonTema';
import { sileo } from 'sileo';
import logoImg from '../assets/logo.svg';

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
  const { usuario, tieneRol, cerrarSesion } = useAutenticacion();
  const { campeonatoActivo, panelCampeonatosAbierto, setPanelCampeonatosAbierto } = useCampeonato();
  const navigate = useNavigate();

  const membresiaActiva = campeonatoActivo && usuario?.championship_memberships?.find(
    (m: any) => m.championship_id === campeonatoActivo.id
  );
  const esOrganizador = tieneRol('organizador') || tieneRol('administrador') || membresiaActiva?.role === 'organizer';
  const esDelegadoPuro = ((membresiaActiva && membresiaActiva.role === 'team_delegate') || tieneRol('delegado') || tieneRol('delegado_equipo')) && !esOrganizador;

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
    <header className="bg-primary-container/90 backdrop-blur-md border-b border-outline px-6 h-16 sticky top-0 z-30 shadow-xs flex items-center justify-between shrink-0 text-on-surface">
      <div className="flex items-center gap-3">
        {leftElement}

        {/* Logo Oficial LigaCenter (Navegación al Inicio) */}
        <button
          type="button"
          onClick={() => navigate('/tablero')}
          className="flex items-center gap-2 hover:opacity-85 transition-opacity cursor-pointer group shrink-0"
          title="Ir al Inicio / Dashboard"
        >
          <img src={logoImg} className="w-8 h-8 object-contain group-hover:scale-105 transition-transform" alt="Logo LigaCenter" />
          <span className="font-black text-base text-on-surface tracking-tight hidden sm:inline">
            Liga<span className="text-primary">Center</span>
          </span>
        </button>

        <div className="h-6 w-px bg-outline mx-1 hidden sm:block"></div>

        <div>
          <h1 className="text-sm font-black text-on-surface leading-none tracking-tight">
            {displayTitle}
          </h1>
          <span className="text-[10px] text-on-surface-variant font-semibold tracking-wider uppercase mt-1 block leading-none">
            {displaySubtitle}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Etiquetas para Delegado en Barra Superior */}
        {esDelegadoPuro && (
          <div className="hidden md:flex items-center gap-2 mr-1">
            <button
              type="button"
              onClick={() => navigate('/tablero/participantes?tab=planilla-jugadores')}
              className="flex items-center gap-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-xl px-3 py-1.5 text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-2xs"
            >
              <span className="material-symbols-outlined text-sm">person_add</span>
              <span>Registrar Jugadores</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/tablero/fixture?tab=partidos')}
              className="flex items-center gap-1.5 bg-surface hover:bg-surface-bright text-on-surface border border-outline rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              <span className="material-symbols-outlined text-sm text-primary">calendar_month</span>
              <span>Partidos</span>
            </button>
          </div>
        )}

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
                className="flex items-center gap-1.5 bg-surface hover:bg-surface-bright text-on-surface border border-outline rounded-lg px-3 py-1.5 text-xs font-extrabold cursor-pointer transition-all shadow-xs"
              >
                <span className="material-symbols-outlined text-sm text-primary">visibility</span>
                <span className="hidden sm:inline">Vista Pública</span>
              </a>
            ) : (
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 bg-surface hover:bg-surface-bright text-on-surface border border-outline rounded-lg px-3 py-1.5 text-xs font-extrabold cursor-pointer transition-all shadow-xs"
              >
                <span className="material-symbols-outlined text-sm text-primary">visibility</span>
                <span className="hidden sm:inline">Portal Público</span>
              </a>
            )}

            {!panelCampeonatosAbierto && (
              campeonatoActivo ? (
                <button
                  onClick={() => setPanelCampeonatosAbierto(true)}
                  className="flex items-center gap-1.5 bg-primary hover:opacity-90 text-white border border-primary rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer transition-all shadow-xs active:scale-95"
                >
                  <span className="material-symbols-outlined text-sm">swap_horiz</span>
                  <span className="hidden sm:inline">Cambiar Torneo</span>
                </button>
              ) : (
                <button
                  onClick={() => setPanelCampeonatosAbierto(true)}
                  className="flex items-center gap-1.5 bg-primary hover:opacity-90 text-white rounded-lg px-3.5 py-1.5 text-xs font-bold cursor-pointer transition-all shadow-xs"
                >
                  <span className="material-symbols-outlined text-sm">sports_soccer</span>
                  <span>Seleccionar Campeonato</span>
                </button>
              )
            )}
          </div>
        )}

        {/* Botón Cerrar Sesión (Logout) */}
        {usuario && (
          <button
            type="button"
            onClick={async () => {
              try {
                await cerrarSesion();
              } catch {
                // Ignore error on redirect
              }
              navigate('/login');
            }}
            className="flex items-center gap-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer shadow-2xs shrink-0"
            title="Cerrar Sesión"
          >
            <span className="material-symbols-outlined text-sm">logout</span>
            <span className="hidden sm:inline">Salir</span>
          </button>
        )}
      </div>
    </header>
  );
};
