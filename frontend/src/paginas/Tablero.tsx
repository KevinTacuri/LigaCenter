import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAutenticacion } from '../contexto/ContextoAutenticacion';
import { useCampeonato } from '../contexto/ContextoCampeonato';
import { BarraLateral } from '../componentes/BarraLateral';
import { serviciosCampeonatos } from '../servicios/api';
import Swal from 'sweetalert2';

// Importación de recursos
import logoImg from '../assets/logo.svg';
import { BotonTema } from '../componentes/BotonTema';

const PASOS_TORNEO = [
  { step: '1', title: 'Disciplinas y Categorías', desc: 'Registra deportes, define categorías y configura el formato de competencia.', icon: 'sports' },
  { step: '2', title: 'Equipos y Jugadores', desc: 'Inscribe equipos por categoría y agrega jugadores con dorsal validado.', icon: 'groups' },
  { step: '3', title: 'Generar Fixture', desc: 'Genera el fixture Round Robin o eliminatoria automático por disciplina y categoría.', icon: 'calendar_today' },
  { step: '4', title: 'Programar Fechas y Canchas', desc: 'Registra escenarios y asigna horarios a cada partido del fixture.', icon: 'schedule' },
  { step: '5', title: 'Mesa de Control (Planillas)', desc: 'Registra goles, tarjetas e incidencias durante los partidos en tiempo real.', icon: 'edit_note' },
  { step: '6', title: 'Resultados y Tabla de Posiciones', desc: 'Consulta posiciones, rankings y sanciones actualizados al instante.', icon: 'leaderboard' },
];

export const Tablero: React.FC = () => {
  const { usuario, cargando, tienePermiso, tieneRol } = useAutenticacion();
  const { campeonatoActivo, limpiarCampeonato } = useCampeonato();
  const navegar = useNavigate();
  const [mostrarGuia, setMostrarGuia] = useState(false);

  const manejarDescargarReglamento = async (id: number, nombreTorneo: string) => {
    try {
      const blob = await serviciosCampeonatos.descargarReglamento(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Reglamento-${nombreTorneo.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      Swal.fire({
        title: 'Error',
        text: 'No se pudo descargar el reglamento del torneo.',
        icon: 'error',
        confirmButtonColor: '#4f46e5'
      });
    }
  };

  useEffect(() => {
    if (!cargando && !usuario) {
      navegar('/login');
    } else if (!cargando && usuario && !campeonatoActivo && !usuario.roles?.includes('administrador')) {
      navegar('/seleccion-campeonato');
    }
  }, [usuario, cargando, navegar, campeonatoActivo]);

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f6f7] text-slate-800">
        <div className="flex flex-col items-center gap-4">
          <div className="relative flex items-center justify-center">
            <div className="w-14 h-14 rounded-full border-4 border-slate-200 border-t-primary animate-spin" />
            <img src={logoImg} className="w-7 h-7 object-contain absolute" alt="Cargando..." />
          </div>
          <span className="text-primary font-bold tracking-wider text-xs uppercase animate-pulse">Cargando Tablero...</span>
        </div>
      </div>
    );
  }

  if (!usuario) return null;


  return (
    <div className="min-h-screen bg-[#0a0b10] text-slate-100 font-sans relative overflow-hidden">

      {/* Barra lateral integrada */}
      <BarraLateral rol={usuario.roles?.[0] || 'usuario_publico'} />

      {/* Contenido principal con margen izquierdo en desktop */}
      <div className="lg:ml-64 flex flex-col min-h-screen relative z-10">
        {/* Header simplificado (sin logout, sin logo repetido) */}
        <header className="bg-[#11131c]/90 backdrop-blur-md border-b border-slate-900 px-6 py-4 sticky top-0 z-30">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-white tracking-tight">
                {campeonatoActivo?.name || 'Tablero de Control'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {usuario.name} • {usuario.roles?.[0]?.replace('_', ' ') || 'Usuario'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <BotonTema />
              {!tieneRol('administrador') && campeonatoActivo && campeonatoActivo.rules_pdf && (
                <button
                  onClick={() => manejarDescargarReglamento(campeonatoActivo.id, campeonatoActivo.name)}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer transition-all"
                >
                  <span className="material-symbols-outlined text-sm">download</span>
                  <span className="hidden sm:inline">Reglamento (PDF)</span>
                </button>
              )}
              {!tieneRol('administrador') && (
                campeonatoActivo ? (
                  <button
                    onClick={limpiarCampeonato}
                    className="flex items-center gap-1.5 bg-[#171a26] hover:bg-[#1c1f2e] border border-slate-800 text-slate-350 rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer transition-all"
                  >
                    <span className="material-symbols-outlined text-sm">swap_horiz</span>
                    <span className="hidden sm:inline">Cambiar Torneo</span>
                  </button>
                ) : (
                  <button
                    onClick={() => navegar('/seleccion-campeonato')}
                    className="flex items-center gap-1.5 bg-indigo-650 hover:bg-indigo-600 text-white rounded-lg px-3.5 py-1.5 text-xs font-bold cursor-pointer transition-all"
                  >
                    <span className="material-symbols-outlined text-sm">sports_soccer</span>
                    <span>Seleccionar Campeonato</span>
                  </button>
                )
              )}
            </div>
          </div>
        </header>

        {/* Contenido Principal */}
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
          
          {/* Banner de Bienvenida Profesional Claro */}
          <section className="relative rounded-2xl bg-[#11131c] border border-slate-900 p-8 shadow-xs overflow-hidden group">
            {/* Soft decorative line on top */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#800f2f] via-indigo-650 to-indigo-500"></div>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2">
                <h2 className="text-xl md:text-2.5xl font-black text-white tracking-tight leading-none">
                  ¡Bienvenido de nuevo, <span className="text-indigo-400">{usuario.name}</span>!
                </h2>
                <p className="text-slate-300 text-sm md:text-base max-w-2xl font-medium leading-relaxed">
                  Desde aquí puedes gestionar los campeonatos, partidos, equipos y estadísticas según tu rol asignado en el sistema LigaCenter.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 shrink-0">
                {usuario.roles?.map((rol, i) => (
                  <span 
                    key={i} 
                    className="px-3.5 py-1.5 rounded-lg bg-[#171a26] border border-slate-850 text-slate-350 text-xs font-bold uppercase tracking-wider"
                  >
                    Rol: {rol.replace('_', ' ')}
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* Sección de Resumen y Accesos Directos */}
          <div className="grid grid-cols-1 gap-6">

            {/* Card: Acciones y Módulos según Permisos */}
            <div className="bg-[#11131c] border border-slate-900 rounded-2xl p-6 shadow-xs hover:border-[#800f2f]/60 transition-all duration-200">
              <h3 className="text-slate-200 font-bold text-sm uppercase tracking-wider mb-6 flex items-center gap-2 border-b border-slate-905 pb-3">
                <div className="w-7 h-7 rounded bg-[#171a26] flex items-center justify-center text-slate-300 border border-slate-850">
                  <span className="material-symbols-outlined text-sm">sports_soccer</span>
                </div>
                Módulos Disponibles
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Módulo: Gestión de Usuarios (Solo Administrador) */}
                {tienePermiso('gestionar_usuarios') && (
                  <div className="p-6 rounded-2xl bg-[#171a26] border border-slate-900/60 hover:border-indigo-500/40 hover:bg-indigo-950/10 hover:shadow-xs transition-all duration-300 group flex items-start gap-5 cursor-pointer" onClick={() => navegar('/tablero/usuarios')}>
                    <div className="w-14 h-14 rounded-xl bg-[#11131c] text-slate-400 border border-slate-800 flex items-center justify-center group-hover:bg-indigo-500/10 group-hover:text-indigo-400 group-hover:border-indigo-500/30 transition-all duration-300 shrink-0">
                      <span className="material-symbols-outlined text-[28px]">group</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-extrabold text-sm text-white group-hover:text-indigo-400 transition-colors uppercase tracking-wide">Gestión de Usuarios</h4>
                      <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">Administra accesos, roles y activa o desactiva usuarios.</p>
                      <button className="mt-4 text-xs text-slate-400 group-hover:text-indigo-400 font-bold tracking-wider uppercase flex items-center gap-1.5 transition-all cursor-pointer">
                        <span>Acceder Módulo</span>
                        <span>→</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Módulo: Consola SaaS (Solo Super Administrador / App Owner) */}
                {tienePermiso('gestionar_usuarios') && (
                  <div className="p-6 rounded-2xl bg-[#171a26] border border-slate-900/60 hover:border-indigo-500/40 hover:bg-indigo-950/10 hover:shadow-xs transition-all duration-300 group flex items-start gap-5 cursor-pointer" onClick={() => navegar('/tablero/saas-admin')}>
                    <div className="w-14 h-14 rounded-xl bg-[#11131c] text-slate-400 border border-slate-800 flex items-center justify-center group-hover:bg-indigo-500/10 group-hover:text-indigo-400 group-hover:border-indigo-500/30 transition-all duration-300 shrink-0">
                      <span className="material-symbols-outlined text-[28px]">admin_panel_settings</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-extrabold text-sm text-white group-hover:text-indigo-400 transition-colors uppercase tracking-wide">Consola SaaS Administrador</h4>
                      <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">Supervisa organizadores, estadísticas globales de torneos y licencias.</p>
                      <button className="mt-4 text-xs text-slate-400 group-hover:text-indigo-400 font-bold tracking-wider uppercase flex items-center gap-1.5 transition-all cursor-pointer">
                        <span>Auditar SaaS</span>
                        <span>→</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Módulo: Equipos y Jugadores (Organizador, Encargado, Publico) */}
                {campeonatoActivo && tienePermiso('ver_equipos') && !tieneRol('administrador') && (
                  <div className="p-6 rounded-2xl bg-[#171a26] border border-slate-900/60 hover:border-indigo-500/40 hover:bg-indigo-950/10 hover:shadow-xs transition-all duration-300 group flex items-start gap-5 cursor-pointer" onClick={() => navegar('/tablero/participantes')}>
                    <div className="w-14 h-14 rounded-xl bg-[#11131c] text-slate-400 border border-slate-800 flex items-center justify-center group-hover:bg-indigo-500/10 group-hover:text-indigo-400 group-hover:border-indigo-500/30 transition-all duration-300 shrink-0">
                      <span className="material-symbols-outlined text-[28px]">groups</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-extrabold text-sm text-white group-hover:text-indigo-400 transition-colors uppercase tracking-wide">Equipos y Jugadores</h4>
                      <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">Consulta los planteles, crea nuevos equipos e inscribe jugadores.</p>
                      <button className="mt-4 text-xs text-slate-400 group-hover:text-indigo-400 font-bold tracking-wider uppercase flex items-center gap-1.5 transition-all cursor-pointer">
                        <span>Ver Equipos</span>
                        <span>→</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Módulo: Fixture y Escenarios (Organizador, Administrador) */}
                {campeonatoActivo && tienePermiso('ver_equipos') && !tieneRol('administrador') && (
                  <div className="p-6 rounded-2xl bg-[#171a26] border border-slate-900/60 hover:border-indigo-500/40 hover:bg-indigo-950/10 hover:shadow-xs transition-all duration-300 group flex items-start gap-5 cursor-pointer" onClick={() => navegar('/tablero/fixture')}>
                    <div className="w-14 h-14 rounded-xl bg-[#11131c] text-slate-400 border border-slate-800 flex items-center justify-center group-hover:bg-indigo-500/10 group-hover:text-indigo-400 group-hover:border-indigo-500/30 transition-all duration-300 shrink-0">
                      <span className="material-symbols-outlined text-[28px]">calendar_today</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-extrabold text-sm text-white group-hover:text-indigo-400 transition-colors uppercase tracking-wide">Fixture y Calendario</h4>
                      <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">Genera emparejamientos y programa canchas y horarios oficiales.</p>
                      <button className="mt-4 text-xs text-slate-400 group-hover:text-indigo-400 font-bold tracking-wider uppercase flex items-center gap-1.5 transition-all cursor-pointer">
                        <span>Gestionar Fixture</span>
                        <span>→</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Módulo: Gestión de Planillas y Partidos (Mesa, Organizador) */}
                {campeonatoActivo && (tienePermiso('registrar_incidencias') || tieneRol('organizador')) && !tieneRol('administrador') && (
                  <div className="p-6 rounded-2xl bg-[#171a26] border border-slate-900/60 hover:border-indigo-500/40 hover:bg-indigo-950/10 hover:shadow-xs transition-all duration-300 group flex items-start gap-5 cursor-pointer" onClick={() => navegar('/tablero/mesa')}>
                    <div className="w-14 h-14 rounded-xl bg-[#11131c] text-slate-400 border border-slate-800 flex items-center justify-center group-hover:bg-indigo-500/10 group-hover:text-indigo-400 group-hover:border-indigo-500/30 transition-all duration-300 shrink-0">
                      <span className="material-symbols-outlined text-[28px]">assignment</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-extrabold text-sm text-white group-hover:text-indigo-400 transition-colors uppercase tracking-wide">Planilla de Partidos</h4>
                      <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">Registra goles, faltas, tarjetas e incidencias de los encuentros.</p>
                      <button className="mt-4 text-xs text-slate-400 group-hover:text-indigo-400 font-bold tracking-wider uppercase flex items-center gap-1.5 transition-all cursor-pointer">
                        <span>Mesa de Control</span>
                        <span>→</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Módulo: Tablas de Posición (Cualquiera) */}
                {campeonatoActivo && tienePermiso('ver_tablas') && !tieneRol('administrador') && (
                  <div className="p-6 rounded-2xl bg-[#171a26] border border-slate-900/60 hover:border-indigo-500/40 hover:bg-indigo-950/10 hover:shadow-xs transition-all duration-300 group flex items-start gap-5 cursor-pointer" onClick={() => navegar('/tablero/publico')}>
                    <div className="w-14 h-14 rounded-xl bg-[#11131c] text-slate-400 border border-slate-800 flex items-center justify-center group-hover:bg-indigo-500/10 group-hover:text-indigo-400 group-hover:border-indigo-500/30 transition-all duration-300 shrink-0">
                      <span className="material-symbols-outlined text-[28px]">leaderboard</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-extrabold text-sm text-white group-hover:text-indigo-400 transition-colors uppercase tracking-wide">Posiciones y Estadísticas</h4>
                      <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">Visualiza los resultados en vivo, anotadores y tablas oficiales.</p>
                      <button className="mt-4 text-xs text-slate-400 group-hover:text-indigo-400 font-bold tracking-wider uppercase flex items-center gap-1.5 transition-all cursor-pointer">
                        <span>Ver Posiciones</span>
                        <span>→</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Mensaje Informativo si no hay Campeonato seleccionado */}
                {!campeonatoActivo && !tieneRol('administrador') && (
                  <div className="md:col-span-2 p-8 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-amber-200 flex flex-col items-center justify-center text-center gap-3">
                    <span className="material-symbols-outlined text-3xl text-amber-500">warning_amber</span>
                    <div>
                      <h4 className="font-extrabold text-sm uppercase tracking-wider text-amber-300">Sin Campeonato Seleccionado</h4>
                      <p className="text-xs text-amber-400 mt-1.5 max-w-md leading-relaxed font-medium">
                        Para poder gestionar equipos, jugadores, fixtures y actas de partidos, por favor selecciona un campeonato de trabajo.
                      </p>
                    </div>
                    <button
                      onClick={() => navegar('/seleccion-campeonato')}
                      className="mt-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-5 py-2.5 rounded-lg transition-all shadow-xs cursor-pointer active:scale-95 flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-sm font-bold">sports_soccer</span>
                      <span>Seleccionar / Crear Campeonato</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* Botón flotante de Ayuda / Guía ? */}
        {!tieneRol('administrador') && (
          <>
            <button
              onClick={() => setMostrarGuia(true)}
              title="Guía del torneo"
              className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-indigo-650 text-white shadow-lg hover:bg-indigo-600 hover:scale-110 transition-all duration-200 flex items-center justify-center cursor-pointer"
            >
              <span className="material-symbols-outlined text-xl">help</span>
            </button>

            {/* Drawer lateral de Guía */}
            {mostrarGuia && (
              <div className="fixed inset-0 z-50 flex justify-end">
                {/* Backdrop */}
                <div
                  className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs"
                  onClick={() => setMostrarGuia(false)}
                />
                {/* Panel */}
                <div className="relative w-full max-w-sm bg-[#11131c] h-full shadow-2xl flex flex-col overflow-hidden border-l border-slate-900 animate-slideInRight">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-slate-900">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-indigo-400 text-base">help</span>
                      <h3 className="font-extrabold text-sm text-white uppercase tracking-wide">Guía del Torneo</h3>
                    </div>
                    <button
                      onClick={() => setMostrarGuia(false)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center border border-slate-800 text-slate-400 hover:bg-[#171a26] hover:text-white transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-5 space-y-3">
                    <p className="text-[10px] text-slate-450 font-semibold leading-relaxed mb-4">
                      Sigue estos pasos en orden para configurar y gestionar tu campeonato:
                    </p>
                    {PASOS_TORNEO.map((s) => (
                      <div key={s.step} className="flex gap-3 p-3 rounded-xl bg-[#171a26] border border-slate-850 hover:bg-[#1c1f2e] transition-colors">
                        <div className="w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                          {s.step}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-xs text-slate-400">{s.icon}</span>
                            {s.title}
                          </h4>
                          <p className="text-[10px] text-slate-450 mt-0.5 leading-relaxed font-medium">{s.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="px-5 py-4 border-t border-slate-900 bg-[#171a26]/40">
                    <p className="text-[10px] text-slate-400 font-semibold mb-2">¿Necesitas más ayuda?</p>
                    <a
                      href="/tablero/configuracion"
                      onClick={(e) => { e.preventDefault(); setMostrarGuia(false); navegar('/tablero/configuracion?tab=guia'); }}
                      className="text-xs text-indigo-400 font-bold hover:underline flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-xs">open_in_new</span>
                      Ver guía completa en Configuración
                    </a>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Pie de Página */}
        <footer className="mt-auto bg-[#11131c] border-t border-slate-900 py-6 text-center text-xs text-slate-400">
          <p>&copy; 2026 LigaCenter. Desarrollado para la gestión de campeonatos. Arequipa, Perú.</p>
        </footer>
      </div>
    </div>
  );
};
