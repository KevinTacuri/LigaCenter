import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAutenticacion } from '../contexto/ContextoAutenticacion';

export const Tablero: React.FC = () => {
  const { usuario, cerrarSesion, cargando, tienePermiso } = useAutenticacion();
  const navegar = useNavigate();

  useEffect(() => {
    if (!cargando && !usuario) {
      navegar('/login');
    }
  }, [usuario, cargando, navegar]);

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#090d16] text-white">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-10 w-10 text-cyan-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-slate-400 font-medium">Cargando Tablero...</span>
        </div>
      </div>
    );
  }

  if (!usuario) return null;

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 font-sans flex flex-col">
      {/* Barra de Navegación Superior */}
      <header className="bg-slate-900/40 backdrop-blur-md border-b border-slate-800/80 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-primary to-primary-container flex items-center justify-center shadow-lg shadow-primary-container/10">
            <span className="text-white font-extrabold text-lg">LC</span>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">LigaCenter</h1>
            <span className="text-xs text-on-primary-container font-semibold tracking-wider uppercase">Tablero de Control</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Info del Perfil */}
          <div className="hidden md:flex flex-col text-right">
            <span className="text-sm font-semibold text-white">{usuario.name}</span>
            <span className="text-xs text-slate-400 capitalize">{usuario.roles?.[0]?.replace('_', ' ') || 'Usuario'}</span>
          </div>

          <button
            onClick={cerrarSesion}
            className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-rose-950/40 border border-slate-700/80 hover:border-rose-900/50 text-slate-300 hover:text-rose-400 rounded-xl px-4 py-2 text-sm transition-all cursor-pointer shadow-xs"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden sm:inline">Cerrar Sesión</span>
          </button>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        
        {/* Banner de Bienvenida */}
        <section className="relative rounded-2xl overflow-hidden bg-linear-to-r from-slate-900 via-primary-container/20 to-slate-900 border border-slate-800/80 p-8 shadow-xl">
          <div className="absolute right-0 top-0 w-96 h-96 bg-primary-container/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-2">
            ¡Bienvenido de nuevo, {usuario.name}!
          </h2>
          <p className="text-slate-400 text-sm md:text-base max-w-2xl">
            Desde aquí puedes gestionar los campeonatos, partidos, equipos y estadísticas según tu rol asignado en el sistema.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            {usuario.roles?.map((rol, i) => (
              <span key={i} className="px-3 py-1 rounded-full bg-primary-container/10 border border-primary-container/20 text-on-primary-container text-xs font-semibold uppercase tracking-wider">
                Rol: {rol.replace('_', ' ')}
              </span>
            ))}
          </div>
        </section>

        {/* Sección de Resumen y Accesos Directos */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Card: Información Personal */}
          <div className="bg-slate-900/30 backdrop-blur-lg border border-slate-800/80 rounded-2xl p-6 shadow-md flex flex-col justify-between">
            <div>
              <h3 className="text-slate-200 font-bold text-lg mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-on-primary-container" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Información de Perfil
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-slate-500 block text-xs uppercase font-semibold">Correo Electrónico</span>
                  <span className="text-slate-200">{usuario.email}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-xs uppercase font-semibold">DNI / Identificación</span>
                  <span className="text-slate-200">{usuario.dni || 'No registrado'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-xs uppercase font-semibold">Teléfono de Contacto</span>
                  <span className="text-slate-200">{usuario.phone || 'No registrado'}</span>
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-slate-800/80 flex justify-between items-center text-xs text-slate-400">
              <span>Estado de Cuenta:</span>
              <span className="flex items-center gap-1.5 font-bold text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                Activa
              </span>
            </div>
          </div>

          {/* Card: Acciones y Módulos según Permisos */}
          <div className="lg:col-span-2 bg-slate-900/30 backdrop-blur-lg border border-slate-800/80 rounded-2xl p-6 shadow-md">
            <h3 className="text-slate-200 font-bold text-lg mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-on-primary-container" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Módulos Disponibles
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Módulo: Gestión de Usuarios (Solo Administrador) */}
              {tienePermiso('gestionar_usuarios') && (
                <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-800 hover:border-primary-container/35 hover:bg-slate-800/50 transition-all group flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-container/15 text-on-primary-container flex items-center justify-center group-hover:scale-110 transition-all shrink-0">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">Gestión de Usuarios</h4>
                    <p className="text-xs text-slate-400 mt-1">Administra accesos, roles y activa o desactiva usuarios.</p>
                    <button className="mt-3 text-xs text-on-primary-container font-semibold flex items-center gap-1 group-hover:text-primary transition-all cursor-pointer">
                      Acceder Módulo →
                    </button>
                  </div>
                </div>
              )}

              {/* Módulo: Equipos y Jugadores (Organizador, Encargado, Publico) */}
              {tienePermiso('ver_equipos') && (
                <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-800 hover:border-indigo-500/30 hover:bg-slate-800/50 transition-all group flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-all shrink-0">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">Equipos y Jugadores</h4>
                    <p className="text-xs text-slate-400 mt-1">Consulta los planteles, crea nuevos equipos e inscribe jugadores.</p>
                    <button className="mt-3 text-xs text-indigo-400 font-semibold flex items-center gap-1 group-hover:text-indigo-300 transition-all cursor-pointer">
                      Ver Equipos →
                    </button>
                  </div>
                </div>
              )}

              {/* Módulo: Gestión de Planillas y Partidos (Mesa, Organizador) */}
              {tienePermiso('registrar_incidencias') && (
                <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-800 hover:border-amber-500/30 hover:bg-slate-800/50 transition-all group flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-all shrink-0">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">Planilla de Partidos</h4>
                    <p className="text-xs text-slate-400 mt-1">Registra goles, faltas, tarjetas e incidencias de los encuentros.</p>
                    <button className="mt-3 text-xs text-amber-400 font-semibold flex items-center gap-1 group-hover:text-amber-300 transition-all cursor-pointer">
                      Mesa de Control →
                    </button>
                  </div>
                </div>
              )}

              {/* Módulo: Tablas de Posición (Cualquiera) */}
              {tienePermiso('ver_tablas') && (
                <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-800 hover:border-emerald-500/30 hover:bg-slate-800/50 transition-all group flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-all shrink-0">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">Posiciones y Estadísticas</h4>
                    <p className="text-xs text-slate-400 mt-1">Visualiza los resultados en vivo, goleadores y tablas oficiales.</p>
                    <button className="mt-3 text-xs text-emerald-400 font-semibold flex items-center gap-1 group-hover:text-emerald-300 transition-all cursor-pointer">
                      Ver Posiciones →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Listado de Permisos Detallados para Transparencia en Desarrollo */}
        <section className="bg-slate-900/20 border border-slate-800/60 rounded-2xl p-6">
          <h3 className="text-slate-300 font-bold text-sm mb-4 uppercase tracking-wider">
            Tus Permisos Específicos (Spatie API)
          </h3>
          <div className="flex flex-wrap gap-2">
            {usuario.permissions && usuario.permissions.length > 0 ? (
              usuario.permissions.map((permiso, index) => (
                <span key={index} className="px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/60 text-slate-300 text-xs font-mono">
                  {permiso}
                </span>
              ))
            ) : (
              <span className="text-slate-500 text-sm">Sin permisos adicionales.</span>
            )}
          </div>
        </section>

      </main>

      {/* Pie de Página */}
      <footer className="mt-auto bg-slate-950 border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <p>&copy; 2026 LigaCenter. Desarrollado para la gestión de campeonatos. Arequipa, Perú.</p>
      </footer>
    </div>
  );
};
