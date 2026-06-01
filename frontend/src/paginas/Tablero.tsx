import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAutenticacion } from '../contexto/ContextoAutenticacion';

// Importación de recursos
import logoImg from '../assets/logo.svg';
import deportesFondo from '../assets/deportes_fondo.png';

export const Tablero: React.FC = () => {
  const { usuario, cerrarSesion, cargando, tienePermiso } = useAutenticacion();
  const navegar = useNavigate();
  const [coordenadasMouse, setCoordenadasMouse] = useState({ x: 0, y: 0 });

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
    }
  }, [usuario, cargando, navegar]);

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f6f7] text-slate-800">
        <div className="flex flex-col items-center gap-4">
          <div className="relative flex items-center justify-center">
            <div className="w-14 h-14 rounded-full border-4 border-slate-200 border-t-[#00cbb8] animate-spin" />
            <img src={logoImg} className="w-7 h-7 object-contain absolute" alt="Cargando..." />
          </div>
          <span className="text-[#001b3a] font-bold tracking-wider text-xs uppercase animate-pulse">Cargando Tablero...</span>
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
            <div className="w-12 h-12 rounded-xl bg-[#001b3a] p-1.5 flex items-center justify-center shadow-xs border border-slate-200">
              <img src={logoImg} className="w-full h-full object-contain" alt="Logo LigaCenter" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold tracking-tight text-slate-900 leading-none">LigaCenter</h1>
                <span className="px-1.5 py-0.5 rounded-sm bg-slate-100 text-slate-600 text-[9px] font-bold border border-slate-200 uppercase tracking-wider">v1.0</span>
              </div>
              <span className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase mt-1 block">Tablero de Control</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Info del Perfil */}
            <div className="hidden md:flex flex-col text-right justify-center">
              <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5 justify-end">
                {usuario.name}
                <span className="w-2 h-2 rounded-full bg-[#70e000] border border-white shadow-xs"></span>
              </span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                {usuario.roles?.[0]?.replace('_', ' ') || 'Usuario'}
              </span>
            </div>

            {/* Avatar */}
            <div className="w-9 h-9 rounded-full bg-slate-200 p-[1px] border border-slate-300">
              <div className="w-full h-full rounded-full bg-[#001b3a] flex items-center justify-center font-bold text-xs text-white select-none">
                {inicialUsuario}
              </div>
            </div>

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
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00cbb8] via-[#001b3a] to-[#70e000]"></div>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2">
                <h2 className="text-xl md:text-2.5xl font-black text-slate-900 tracking-tight leading-none">
                  ¡Bienvenido de nuevo, <span className="text-[#001b3a]">{usuario.name}</span>!
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Card: Información Personal */}
            <div className="bg-white border border-slate-200/85 rounded-2xl p-6 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all duration-200">
              <div>
                <h3 className="text-slate-800 font-bold text-sm uppercase tracking-wider mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <div className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center text-slate-700 border border-slate-200">
                    <span className="material-symbols-outlined text-sm">badge</span>
                  </div>
                  Perfil de Usuario
                </h3>
                
                <div className="space-y-3.5">
                  <div className="p-3.5 rounded-lg bg-slate-50/50 border border-slate-150">
                    <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider mb-0.5">Correo Electrónico</span>
                    <span className="text-slate-700 text-xs font-semibold break-all">{usuario.email}</span>
                  </div>
                  <div className="p-3.5 rounded-lg bg-slate-50/50 border border-slate-150">
                    <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider mb-0.5">DNI / Identificación</span>
                    <span className="text-slate-700 text-xs font-semibold">{usuario.dni || 'No registrado'}</span>
                  </div>
                  <div className="p-3.5 rounded-lg bg-slate-50/50 border border-slate-150">
                    <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider mb-0.5">Teléfono de Contacto</span>
                    <span className="text-slate-700 text-xs font-semibold">{usuario.phone || 'No registrado'}</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 pt-4 border-t border-slate-100 flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Estado de Cuenta</span>
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px] uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Activo
                </span>
              </div>
            </div>

            {/* Card: Acciones y Módulos según Permisos */}
            <div className="lg:col-span-2 bg-white border border-slate-200/85 rounded-2xl p-6 shadow-xs hover:border-slate-300 transition-all duration-200">
              <h3 className="text-slate-800 font-bold text-sm uppercase tracking-wider mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
                <div className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center text-slate-700 border border-slate-200">
                  <span className="material-symbols-outlined text-sm">sports_soccer</span>
                </div>
                Módulos Disponibles
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Módulo: Gestión de Usuarios (Solo Administrador) */}
                {tienePermiso('gestionar_usuarios') && (
                  <div className="p-5 rounded-xl bg-white border border-slate-200 hover:border-[#00cbb8]/60 hover:bg-[#00cbb8]/2 transition-all duration-200 group flex items-start gap-4 hover:shadow-xs">
                    <div className="w-10 h-10 rounded-lg bg-slate-50 text-slate-600 border border-slate-200 flex items-center justify-center group-hover:bg-[#00cbb8]/10 group-hover:text-[#00cbb8] group-hover:border-[#00cbb8]/20 transition-all shrink-0">
                      <span className="material-symbols-outlined text-lg">group</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-xs text-slate-900 group-hover:text-[#00cbb8] transition-colors uppercase tracking-wide">Gestión de Usuarios</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">Administra accesos, roles y activa o desactiva usuarios.</p>
                      <button className="mt-3.5 text-xs text-[#00cbb8] font-bold tracking-wider uppercase flex items-center gap-1 group-hover:gap-1.5 transition-all cursor-pointer">
                        <span>Acceder Módulo</span>
                        <span>→</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Módulo: Equipos y Jugadores (Organizador, Encargado, Publico) */}
                {tienePermiso('ver_equipos') && (
                  <div className="p-5 rounded-xl bg-white border border-slate-200 hover:border-indigo-400/60 hover:bg-indigo-50/2 transition-all duration-200 group flex items-start gap-4 hover:shadow-xs">
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

                {/* Módulo: Gestión de Planillas y Partidos (Mesa, Organizador) */}
                {tienePermiso('registrar_incidencias') && (
                  <div className="p-5 rounded-xl bg-white border border-slate-200 hover:border-amber-400/60 hover:bg-amber-50/2 transition-all duration-200 group flex items-start gap-4 hover:shadow-xs">
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
                {tienePermiso('ver_tablas') && (
                  <div className="p-5 rounded-xl bg-white border border-slate-200 hover:border-[#70e000]/60 hover:bg-[#70e000]/2 transition-all duration-200 group flex items-start gap-4 hover:shadow-xs">
                    <div className="w-10 h-10 rounded-lg bg-slate-50 text-slate-600 border border-slate-200 flex items-center justify-center group-hover:bg-[#70e000]/10 group-hover:text-[#70e000] group-hover:border-[#70e000]/20 transition-all shrink-0">
                      <span className="material-symbols-outlined text-lg">leaderboard</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-xs text-slate-900 group-hover:text-[#70e000] transition-colors uppercase tracking-wide">Posiciones y Estadísticas</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">Visualiza los resultados en vivo, goleadores y tablas oficiales.</p>
                      <button className="mt-3.5 text-xs text-[#70e000] font-bold tracking-wider uppercase flex items-center gap-1 group-hover:gap-1.5 transition-all cursor-pointer">
                        <span>Ver Posiciones</span>
                        <span>→</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>



        </main>

        {/* Pie de Página */}
        <footer className="mt-auto bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
          <p>&copy; 2026 LigaCenter. Desarrollado para la gestión de campeonatos. Arequipa, Perú.</p>
        </footer>
      </div>
    </div>
  );
};
