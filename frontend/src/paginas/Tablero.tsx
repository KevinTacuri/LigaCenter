import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAutenticacion } from '../contexto/ContextoAutenticacion';
import { useCampeonato } from '../contexto/ContextoCampeonato';

// Importación de recursos
import logoImg from '../assets/logo.svg';
import deportesFondo from '../assets/deportes_fondo.png';

const PASOS_TORNEO = [
  { step: '1', title: 'Disciplinas y Categorías', desc: 'Registra deportes y define los rangos de edad y género de cada categoría.', icon: 'sports' },
  { step: '2', title: 'Registrar Instituciones', desc: 'Crea organizaciones participantes y asigna un delegado a cada una.', icon: 'corporate_fare' },
  { step: '3', title: 'Equipos y Jugadores', desc: 'Inscribe equipos por categoría y agrega jugadores con dorsal validado.', icon: 'groups' },
  { step: '4', title: 'Generar Fixture', desc: 'Genera el fixture Round Robin automático por disciplina y categoría.', icon: 'calendar_today' },
  { step: '5', title: 'Programar Fechas y Canchas', desc: 'Registra escenarios y asigna horarios a cada partido del fixture.', icon: 'schedule' },
  { step: '6', title: 'Mesa de Control (Planillas)', desc: 'Registra goles, tarjetas e incidencias durante los partidos en tiempo real.', icon: 'edit_note' },
  { step: '7', title: 'Resultados y Tabla de Posiciones', desc: 'Consulta posiciones, goleadores y sanciones actualizados al instante.', icon: 'leaderboard' },
];

export const Tablero: React.FC = () => {
  const { usuario, cerrarSesion, cargando, tienePermiso, tieneRol } = useAutenticacion();
  const { campeonatoActivo, limpiarCampeonato } = useCampeonato();
  const navegar = useNavigate();
  const [coordenadasMouse, setCoordenadasMouse] = useState({ x: 0, y: 0 });
  const [mostrarGuia, setMostrarGuia] = useState(false);

  // Parallax interactivo sutil en el fondo
  useEffect(() => {
    const manejarMovimientoMouse = (e: MouseEvent) => {
      const x = (window.innerWidth - e.pageX * 2) / 150;
      const y = (window.innerHeight - e.pageY * 2) / 150;
      setCoordenadasMouse({ x, y });
    };

    window.addEventListener('mousemove', manejarMovimientoMouse);
    return () => {
      window.removeEventListener('mousemove', manejarMovimientoMouse);
    };
  }, []);

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

  // Letra inicial del nombre del usuario para el avatar
  const inicialUsuario = usuario.name ? usuario.name.charAt(0).toUpperCase() : 'U';

  return (
    <div className="min-h-screen bg-[#f4f6f7] text-slate-800 font-sans flex flex-col relative overflow-hidden">
      
      {/* Fondo Deportivo Ambiental sutil (Estilo Marca de Agua Profesional) */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none">
        <img
          src={deportesFondo}
          alt=""
          className="w-full h-full object-cover opacity-[0.015] mix-blend-multiply transition-transform duration-300 ease-out"
          style={{
            transform: `translate(${coordenadasMouse.x}px, ${coordenadasMouse.y}px) scale(1.02)`,
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen w-full">
        {/* Barra de Navegación Superior */}
        <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-6 py-4 flex items-center justify-between sticky top-0 z-30 transition-all">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 flex items-center justify-center">
              <img src={logoImg} className="w-full h-full object-contain" alt="Logo LigaCenter" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold tracking-tight text-slate-900 leading-none">LigaCenter</h1>
                <span className="px-1.5 py-0.5 rounded-sm bg-slate-100 text-slate-600 text-[9px] font-bold border border-slate-200 uppercase tracking-wider">v1.0</span>
              </div>
              <span className="text-[10px] text-primary font-bold uppercase mt-1 block tracking-wider truncate max-w-[200px] sm:max-w-md">
                🏆 {campeonatoActivo?.name || 'Tablero de Control'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Info y Avatar — navega a Configuración */}
            <button
              onClick={() => navegar('/tablero/configuracion')}
              className="flex items-center gap-2 border border-slate-200 hover:bg-slate-50 px-2 py-1 rounded-lg transition-all cursor-pointer group text-left bg-transparent shrink-0"
            >
              <div className="hidden md:flex flex-col text-right justify-center">
                <span className="text-xs font-extrabold text-slate-900 group-hover:text-primary transition-colors flex items-center gap-1.5 justify-end">
                  {usuario.name}
                  <span className="w-1.5 h-1.5 rounded-full bg-[#70e000] border border-white shadow-xs"></span>
                </span>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                  {usuario.roles?.[0]?.replace('_', ' ') || 'Usuario'}
                </span>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-200 p-[1px] border border-slate-300">
                <div className="w-full h-full rounded-full bg-primary flex items-center justify-center font-extrabold text-xs text-white select-none group-hover:bg-primary-container transition-colors">
                  {inicialUsuario}
                </div>
              </div>
            </button>

            {/* Botón Seleccionar / Cambiar Torneo (Solo si NO es administrador) */}
            {!tieneRol('administrador') && (
              campeonatoActivo ? (
                <button
                  onClick={limpiarCampeonato}
                  className="flex items-center justify-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 cursor-pointer shadow-xs active:scale-95 group"
                >
                  <span className="material-symbols-outlined text-sm">swap_horiz</span>
                  <span className="hidden sm:inline">Cambiar Torneo</span>
                </button>
              ) : (
                <button
                  onClick={() => navegar('/seleccion-campeonato')}
                  className="flex items-center justify-center gap-1.5 bg-primary hover:bg-primary-container text-white rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all duration-200 cursor-pointer shadow-xs active:scale-95 flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">sports_soccer</span>
                  <span>Seleccionar Campeonato</span>
                </button>
              )
            )}

            {/* Botón Cerrar Sesión */}
            <button
              onClick={cerrarSesion}
              className="flex items-center justify-center gap-1.5 bg-slate-50 hover:bg-rose-50 border border-slate-200 text-slate-600 hover:text-rose-600 hover:border-rose-200 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 cursor-pointer shadow-xs active:scale-95 group"
            >
              <span className="material-symbols-outlined text-sm transition-transform group-hover:translate-x-0.5">logout</span>
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </button>
          </div>
        </header>

        {/* Contenido Principal */}
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
          
          {/* Banner de Bienvenida Profesional Claro */}
          <section className="relative rounded-2xl bg-white border border-slate-200/80 p-8 shadow-xs overflow-hidden group">
            {/* Soft decorative line on top */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary-container to-secondary"></div>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2">
                <h2 className="text-xl md:text-2.5xl font-black text-slate-900 tracking-tight leading-none">
                  ¡Bienvenido de nuevo, <span className="text-primary">{usuario.name}</span>!
                </h2>
                <p className="text-slate-600 text-sm md:text-base max-w-2xl font-medium leading-relaxed">
                  Desde aquí puedes gestionar los campeonatos, partidos, equipos y estadísticas según tu rol asignado en el sistema LigaCenter.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 shrink-0">
                {usuario.roles?.map((rol, i) => (
                  <span 
                    key={i} 
                    className="px-3.5 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider"
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
            <div className="bg-white border border-slate-200/85 rounded-2xl p-6 shadow-xs hover:border-slate-300 transition-all duration-200">
              <h3 className="text-slate-800 font-bold text-sm uppercase tracking-wider mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
                <div className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center text-slate-700 border border-slate-200">
                  <span className="material-symbols-outlined text-sm">sports_soccer</span>
                </div>
                Módulos Disponibles
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Módulo: Gestión de Usuarios (Solo Administrador) */}
                {tienePermiso('gestionar_usuarios') && (
                  <div className="p-5 rounded-xl bg-white border border-slate-200 hover:border-primary/60 hover:bg-primary/2 transition-all duration-200 group flex items-start gap-4 hover:shadow-xs cursor-pointer" onClick={() => navegar('/tablero/usuarios')}>
                    <div className="w-10 h-10 rounded-lg bg-slate-50 text-slate-600 border border-slate-200 flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary group-hover:border-primary/20 transition-all shrink-0">
                      <span className="material-symbols-outlined text-lg">group</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-xs text-slate-900 group-hover:text-primary transition-colors uppercase tracking-wide">Gestión de Usuarios</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">Administra accesos, roles y activa o desactiva usuarios.</p>
                      <button className="mt-3.5 text-xs text-primary font-bold tracking-wider uppercase flex items-center gap-1 group-hover:gap-1.5 transition-all cursor-pointer">
                        <span>Acceder Módulo</span>
                        <span>→</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Módulo: Consola SaaS (Solo Super Administrador / App Owner) */}
                {tienePermiso('gestionar_usuarios') && (
                  <div className="p-5 rounded-xl bg-white border border-slate-200 hover:border-secondary/60 hover:bg-secondary/2 transition-all duration-200 group flex items-start gap-4 hover:shadow-xs cursor-pointer" onClick={() => navegar('/tablero/saas-admin')}>
                    <div className="w-10 h-10 rounded-lg bg-slate-50 text-slate-600 border border-slate-200 flex items-center justify-center group-hover:bg-secondary/10 group-hover:text-secondary group-hover:border-secondary/20 transition-all shrink-0">
                      <span className="material-symbols-outlined text-lg">admin_panel_settings</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-xs text-slate-900 group-hover:text-secondary transition-colors uppercase tracking-wide">Consola SaaS Administrador</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">Supervisa organizadores, estadísticas globales de torneos y licencias.</p>
                      <button className="mt-3.5 text-xs text-secondary font-bold tracking-wider uppercase flex items-center gap-1 group-hover:gap-1.5 transition-all cursor-pointer">
                        <span>Auditar SaaS</span>
                        <span>→</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Módulo: Equipos y Jugadores (Organizador, Encargado, Publico) */}
                {campeonatoActivo && tienePermiso('ver_equipos') && !tieneRol('administrador') && (
                  <div className="p-5 rounded-xl bg-white border border-slate-200 hover:border-indigo-400/60 hover:bg-indigo-50/2 transition-all duration-200 group flex items-start gap-4 hover:shadow-xs cursor-pointer" onClick={() => navegar('/tablero/participantes')}>
                    <div className="w-10 h-10 rounded-lg bg-slate-50 text-slate-600 border border-slate-200 flex items-center justify-center group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-200 transition-all shrink-0">
                      <span className="material-symbols-outlined text-lg">groups</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-xs text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-wide">Equipos y Jugadores</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">Consulta los planteles, crea nuevos equipos e inscribe jugadores.</p>
                      <button className="mt-3.5 text-xs text-indigo-600 font-bold tracking-wider uppercase flex items-center gap-1 group-hover:gap-1.5 transition-all cursor-pointer">
                        <span>Ver Equipos</span>
                        <span>→</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Módulo: Fixture y Escenarios (Organizador, Administrador) */}
                {campeonatoActivo && tienePermiso('ver_equipos') && !tieneRol('administrador') && (
                  <div className="p-5 rounded-xl bg-white border border-slate-200 hover:border-emerald-500/60 hover:bg-emerald-50/2 transition-all duration-200 group flex items-start gap-4 hover:shadow-xs cursor-pointer" onClick={() => navegar('/tablero/fixture')}>
                    <div className="w-10 h-10 rounded-lg bg-slate-50 text-slate-600 border border-slate-200 flex items-center justify-center group-hover:bg-emerald-50 group-hover:text-emerald-600 group-hover:border-emerald-200 transition-all shrink-0">
                      <span className="material-symbols-outlined text-lg">calendar_today</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-xs text-slate-900 group-hover:text-emerald-600 transition-colors uppercase tracking-wide">Fixture y Calendario</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">Genera emparejamientos y programa canchas y horarios oficiales.</p>
                      <button className="mt-3.5 text-xs text-emerald-600 font-bold tracking-wider uppercase flex items-center gap-1 group-hover:gap-1.5 transition-all cursor-pointer">
                        <span>Gestionar Fixture</span>
                        <span>→</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Módulo: Gestión de Planillas y Partidos (Mesa, Organizador) */}
                {campeonatoActivo && (tienePermiso('registrar_incidencias') || tieneRol('organizador')) && !tieneRol('administrador') && (
                  <div className="p-5 rounded-xl bg-white border border-slate-200 hover:border-amber-400/60 hover:bg-amber-50/2 transition-all duration-200 group flex items-start gap-4 hover:shadow-xs cursor-pointer" onClick={() => navegar('/tablero/mesa')}>
                    <div className="w-10 h-10 rounded-lg bg-slate-50 text-slate-600 border border-slate-200 flex items-center justify-center group-hover:bg-amber-50 group-hover:text-amber-600 group-hover:border-amber-200 transition-all shrink-0">
                      <span className="material-symbols-outlined text-lg">assignment</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-xs text-slate-900 group-hover:text-amber-600 transition-colors uppercase tracking-wide">Planilla de Partidos</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">Registra goles, faltas, tarjetas e incidencias de los encuentros.</p>
                      <button className="mt-3.5 text-xs text-amber-600 font-bold tracking-wider uppercase flex items-center gap-1 group-hover:gap-1.5 transition-all cursor-pointer">
                        <span>Mesa de Control</span>
                        <span>→</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Módulo: Tablas de Posición (Cualquiera) */}
                {campeonatoActivo && tienePermiso('ver_tablas') && !tieneRol('administrador') && (
                  <div className="p-5 rounded-xl bg-white border border-slate-200 hover:border-secondary/60 hover:bg-secondary/2 transition-all duration-200 group flex items-start gap-4 hover:shadow-xs cursor-pointer" onClick={() => navegar('/tablero/publico')}>
                    <div className="w-10 h-10 rounded-lg bg-slate-50 text-slate-600 border border-slate-200 flex items-center justify-center group-hover:bg-secondary/10 group-hover:text-secondary group-hover:border-secondary/20 transition-all shrink-0">
                      <span className="material-symbols-outlined text-lg">leaderboard</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-xs text-slate-900 group-hover:text-secondary transition-colors uppercase tracking-wide">Posiciones y Estadísticas</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">Visualiza los resultados en vivo, goleadores y tablas oficiales.</p>
                      <button className="mt-3.5 text-xs text-secondary font-bold tracking-wider uppercase flex items-center gap-1 group-hover:gap-1.5 transition-all cursor-pointer">
                        <span>Ver Posiciones</span>
                        <span>→</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Mensaje Informativo si no hay Campeonato seleccionado */}
                {!campeonatoActivo && !tieneRol('administrador') && (
                  <div className="md:col-span-2 p-8 rounded-2xl bg-amber-50/50 border border-amber-200/60 text-amber-900 flex flex-col items-center justify-center text-center gap-3">
                    <span className="material-symbols-outlined text-3xl text-amber-500">warning_amber</span>
                    <div>
                      <h4 className="font-extrabold text-sm uppercase tracking-wider text-amber-950">Sin Campeonato Seleccionado</h4>
                      <p className="text-xs text-amber-700 mt-1.5 max-w-md leading-relaxed font-medium">
                        Para poder gestionar equipos, jugadores, fixtures y actas de partidos, por favor selecciona un campeonato de trabajo.
                      </p>
                    </div>
                    <button
                      onClick={() => navegar('/seleccion-campeonato')}
                      className="mt-2 bg-amber-600 hover:bg-amber-750 text-white font-bold text-xs px-5 py-2.5 rounded-lg transition-all shadow-xs cursor-pointer active:scale-95 flex items-center gap-1.5"
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
              className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-primary text-white shadow-lg hover:bg-primary-container hover:scale-110 transition-all duration-200 flex items-center justify-center cursor-pointer"
            >
              <span className="material-symbols-outlined text-xl">help</span>
            </button>

            {/* Drawer lateral de Guía */}
            {mostrarGuia && (
              <div className="fixed inset-0 z-50 flex justify-end">
                {/* Backdrop */}
                <div
                  className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
                  onClick={() => setMostrarGuia(false)}
                />
                {/* Panel */}
                <div className="relative w-full max-w-sm bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-slideInRight">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-base">help</span>
                      <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide">Guía del Torneo</h3>
                    </div>
                    <button
                      onClick={() => setMostrarGuia(false)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-5 space-y-3">
                    <p className="text-[10px] text-slate-400 font-semibold leading-relaxed mb-4">
                      Sigue estos pasos en orden para configurar y gestionar tu campeonato:
                    </p>
                    {PASOS_TORNEO.map((s) => (
                      <div key={s.step} className="flex gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/60 transition-colors">
                        <div className="w-6 h-6 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                          {s.step}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-xs text-slate-400">{s.icon}</span>
                            {s.title}
                          </h4>
                          <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed font-medium">{s.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/50">
                    <p className="text-[10px] text-slate-400 font-semibold mb-2">¿Necesitas más ayuda?</p>
                    <a
                      href="/tablero/configuracion"
                      onClick={(e) => { e.preventDefault(); setMostrarGuia(false); navegar('/tablero/configuracion?tab=guia'); }}
                      className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
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
        <footer className="mt-auto bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
          <p>&copy; 2026 LigaCenter. Desarrollado para la gestión de campeonatos. Arequipa, Perú.</p>
        </footer>
      </div>
    </div>
  );
};
