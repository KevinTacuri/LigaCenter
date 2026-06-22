import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAutenticacion } from '../contexto/ContextoAutenticacion';
import { useCampeonato } from '../contexto/ContextoCampeonato';
import logoImg from '../assets/logo.svg';

interface ItemMenu {
  id: string;
  titulo: string;
  icono: string;
  ruta: string;
  visible: boolean;
}

interface SubItemMenu {
  id: string;
  titulo: string;
  query: string;
}

interface Props {
  rol: string;
}

// Helper para obtener colores pastel suaves
const obtenerPastelColorSidebar = (nombre: string) => {
  if (!nombre) return { bg: 'bg-[#d0ebff]/20 border-[#a5d8ff]/30', text: 'text-[#a5d8ff]' };
  const hash = nombre.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
  const colores = [
    { bg: 'bg-[#d0ebff]/20 border-[#a5d8ff]/30', text: 'text-[#a5d8ff]' }, // Azul
    { bg: 'bg-[#e2f9e1]/20 border-[#b2f2bb]/30', text: 'text-[#b2f2bb]' }, // Verde
    { bg: 'bg-[#ffe3e3]/20 border-[#ffc9c9]/30', text: 'text-[#ffc9c9]' }, // Rojo
    { bg: 'bg-[#f3e8ff]/20 border-[#e8d2ff]/30', text: 'text-[#e8d2ff]' }, // Púrpura
    { bg: 'bg-[#fff9db]/20 border-[#ffec99]/30', text: 'text-[#ffec99]' }, // Amarillo
    { bg: 'bg-[#e3fafc]/20 border-[#99e9f2]/30', text: 'text-[#99e9f2]' }, // Cyan
    { bg: 'bg-[#fff0f6]/20 border-[#fcc2d7]/30', text: 'text-[#fcc2d7]' }, // Rosa
  ];
  return colores[hash % colores.length];
};

const subMenus: Record<string, SubItemMenu[]> = {
  teams: [
    { id: 'disciplinas', titulo: 'Disciplinas', query: 'tab=disciplinas' },
    { id: 'categorias', titulo: 'Categorías', query: 'tab=categorias' },
    { id: 'equipos', titulo: 'Equipos', query: 'tab=equipos' },
    { id: 'jugadores', titulo: 'Jugadores', query: 'tab=jugadores' },
    { id: 'registro-equipo', titulo: 'Inscripción Rápida', query: 'tab=registro-equipo' },
    { id: 'planilla-jugadores', titulo: 'Planilla Jugadores', query: 'tab=planilla-jugadores' },
  ],
  fixture: [
    { id: 'escenarios', titulo: 'Escenarios', query: 'tab=escenarios' },
    { id: 'generar', titulo: 'Generar Fixture', query: 'tab=generar' },
    { id: 'programar', titulo: 'Asignar Fechas', query: 'tab=programar' },
    { id: 'partidos', titulo: 'Calendario y Horarios', query: 'tab=partidos' },
  ],
  posiciones: [
    { id: 'posiciones', titulo: 'Tabla Posiciones', query: 'tab=posiciones' },
    { id: 'partidos', titulo: 'Calendario Partidos', query: 'tab=partidos' },
    { id: 'sanciones', titulo: 'Sanciones', query: 'tab=sanciones' },
  ],
};

export const BarraLateral: React.FC<Props> = ({ rol }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { usuario, cerrarSesion } = useAutenticacion();
  const { campeonatoActivo } = useCampeonato();
  const [colapsado, setColapsado] = useState(false);

  // Estados de secciones colapsables (Acordeones)
  const [seccionTorneoAbierta, setSeccionTorneoAbierta] = useState(true);
  const [seccionAdminAbierta, setSeccionAdminAbierta] = useState(true);
  const [seccionAjustesAbierta, setSeccionAjustesAbierta] = useState(true);

  // --- Agrupación de ítems ---
  const itemsTorneo: ItemMenu[] = [
    {
      id: 'dashboard',
      titulo: 'Dashboard',
      icono: 'dashboard',
      ruta: '/tablero',
      visible: true
    },
    {
      id: 'teams',
      titulo: 'Equipos y Jugadores',
      icono: 'groups',
      ruta: '/tablero/participantes',
      visible: !!campeonatoActivo && (rol === 'administrador' || rol === 'organizador' || rol === 'usuario_publico')
    },
    {
      id: 'fixture',
      titulo: 'Fixture y Calendario',
      icono: 'calendar_today',
      ruta: '/tablero/fixture',
      visible: !!campeonatoActivo && (rol === 'administrador' || rol === 'organizador' || rol === 'usuario_publico')
    },
    {
      id: 'mesa',
      titulo: 'Mesa de Control',
      icono: 'edit_note',
      ruta: '/tablero/mesa',
      visible: !!campeonatoActivo && (rol === 'administrador' || rol === 'organizador' || rol === 'encargado_mesa')
    },
    {
      id: 'posiciones',
      titulo: 'Posiciones y Estadísticas',
      icono: 'leaderboard',
      ruta: '/tablero/publico',
      visible: !!campeonatoActivo
    }
  ];

  const itemsAdmin: ItemMenu[] = [
    {
      id: 'organisations',
      titulo: 'Organizaciones SaaS',
      icono: 'corporate_fare',
      ruta: '/tablero/saas-admin',
      visible: rol === 'administrador'
    },
    {
      id: 'usuarios',
      titulo: 'Gestión de Usuarios',
      icono: 'group',
      ruta: '/tablero/usuarios',
      visible: rol === 'administrador'
    }
  ];

  const itemsAjustes: ItemMenu[] = [
    {
      id: 'perfil',
      titulo: 'Mi Perfil',
      icono: 'person',
      ruta: '/tablero/perfil',
      visible: true
    },
    {
      id: 'config',
      titulo: 'Configurar Campeonato',
      icono: 'settings',
      ruta: '/tablero/configuracion',
      visible: !!campeonatoActivo && (rol === 'administrador' || rol === 'organizador')
    }
  ];

  const isActive = (ruta: string) => {
    const pathBase = ruta.split('?')[0];
    return location.pathname === pathBase;
  };

  const isSubActive = (item: ItemMenu, sub: SubItemMenu) => {
    if (!isActive(item.ruta)) return false;
    const currentQuery = location.search.replace('?', '');
    if (!currentQuery) {
      // Cambiamos la pestaña por defecto "Disciplinas" por ahora para simplificar, pero se puede reactivar fácilmente si se necesita
      // if (item.id === 'teams' && sub.id === 'disciplinas') return true; 
      if (item.id === 'teams' && sub.id === 'categorias') return true;
      if (item.id === 'fixture' && sub.id === 'escenarios') return true;
      if (item.id === 'posiciones' && sub.id === 'posiciones') return true;
      return false;
    }
    return currentQuery === sub.query;
  };

  useEffect(() => {
    if (itemsTorneo.some(item => item.visible && isActive(item.ruta))) setSeccionTorneoAbierta(true);
    if (itemsAdmin.some(item => item.visible && isActive(item.ruta))) setSeccionAdminAbierta(true);
    if (itemsAjustes.some(item => item.visible && isActive(item.ruta))) setSeccionAjustesAbierta(true);
  }, [location.pathname]);

  const visibleTorneo = itemsTorneo.filter(item => item.visible);
  const visibleAdmin = itemsAdmin.filter(item => item.visible);
  const visibleAjustes = itemsAjustes.filter(item => item.visible);

  const inicialUsuario = usuario?.name ? usuario.name.charAt(0).toUpperCase() : 'U';
  const colorAvatar = obtenerPastelColorSidebar(usuario?.name || '');

  // Renderizador genérico de ítem de menú (Desktop)
  const renderItemMenu = (item: ItemMenu) => {
    const active = isActive(item.ruta);
    const subItems = subMenus[item.id];

    return (
      <div key={item.id} className="space-y-0.5">
        <button
          onClick={() => navigate(item.ruta)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
            active
              ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
              : 'text-slate-400 hover:bg-[#1a1d2a] hover:text-slate-200'
          } ${colapsado ? 'justify-center' : 'justify-start'}`}
          title={colapsado ? item.titulo : ''}
        >
          <span className="material-symbols-outlined text-xl">{item.icono}</span>
          {!colapsado && <span className="text-sm font-medium">{item.titulo}</span>}
        </button>

        {/* Sub-menú en Desktop */}
        {!colapsado && active && subItems && (
          <div className="pl-8 pr-2 py-1 space-y-1 border-l border-slate-800 ml-5 mt-1 animate-fadeIn">
            {subItems.map((sub) => {
              const subActive = isSubActive(item, sub);
              return (
                <button
                  key={sub.id}
                  onClick={() => navigate(`${item.ruta}?${sub.query}`)}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all block cursor-pointer ${
                    subActive
                      ? 'text-indigo-400 bg-indigo-500/5 font-black'
                      : 'text-slate-500 hover:text-slate-350 hover:bg-[#151722]'
                  }`}
                >
                  {sub.titulo}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // Renderizador genérico de ítem de menú (Móvil)
  const renderMobileItem = (item: ItemMenu) => {
    const active = isActive(item.ruta);
    const subItems = subMenus[item.id];

    return (
      <div key={item.id} className="space-y-0.5">
        <button
          onClick={() => {
            navigate(item.ruta);
            if (!subItems) setColapsado(false);
          }}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl ${
            active ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400'
          }`}
        >
          <span className="material-symbols-outlined text-xl">{item.icono}</span>
          <span className="text-sm font-medium">{item.titulo}</span>
        </button>

        {/* Sub-menú en Móvil */}
        {active && subItems && (
          <div className="pl-8 pr-2 py-1 space-y-1 border-l border-slate-800 ml-5 mt-1">
            {subItems.map((sub) => {
              const subActive = isSubActive(item, sub);
              return (
                <button
                  key={sub.id}
                  onClick={() => {
                    navigate(`${item.ruta}?${sub.query}`);
                    setColapsado(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all block ${
                    subActive
                      ? 'text-indigo-400 bg-indigo-500/5 font-black'
                      : 'text-slate-500 hover:text-slate-350'
                  }`}
                >
                  {sub.titulo}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Sidebar Desktop */}
      <aside
        className={`hidden lg:flex flex-col bg-[#0c0e16] border-r border-slate-800 transition-all duration-300 ease-in-out ${
          colapsado ? 'w-20' : 'w-64'
        } fixed left-0 top-0 h-full z-40 shadow-2xl`}
      >
        {/* Cabecera Sidebar */}
        <div className={`flex items-center h-16 px-4 border-b border-slate-800 justify-center`}>
          <div className="flex items-center gap-2 overflow-hidden">
            <img src={logoImg} className="w-8 h-8 object-contain" alt="LigaCenter" />
            {!colapsado && <span className="font-black text-white text-sm uppercase font-sans tracking-tight">LigaCenter</span>}
          </div>
        </div>

        {/* Listado de Navegación con Acordeones */}
        <nav className="flex-1 py-6 px-3 space-y-4 overflow-y-auto">
          {/* SECCIÓN 1: Torneo Activo */}
          {visibleTorneo.length > 0 && (
            <div className="space-y-1">
              {!colapsado ? (
                <button
                  onClick={() => setSeccionTorneoAbierta(!seccionTorneoAbierta)}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-slate-350 cursor-pointer"
                >
                  <span>Torneo Activo</span>
                  <span className="material-symbols-outlined text-xs">
                    {seccionTorneoAbierta ? 'expand_less' : 'expand_more'}
                  </span>
                </button>
              ) : (
                <div className="border-b border-slate-850 my-2" />
              )}
              {(seccionTorneoAbierta || colapsado) && (
                <div className="space-y-1">
                  {visibleTorneo.map(renderItemMenu)}
                </div>
              )}
            </div>
          )}

          {/* SECCIÓN 2: Administración */}
          {visibleAdmin.length > 0 && (
            <div className="space-y-1">
              {!colapsado ? (
                <button
                  onClick={() => setSeccionAdminAbierta(!seccionAdminAbierta)}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-slate-350 cursor-pointer"
                >
                  <span>Administración</span>
                  <span className="material-symbols-outlined text-xs">
                    {seccionAdminAbierta ? 'expand_less' : 'expand_more'}
                  </span>
                </button>
              ) : (
                <div className="border-b border-slate-850 my-2" />
              )}
              {(seccionAdminAbierta || colapsado) && (
                <div className="space-y-1">
                  {visibleAdmin.map(renderItemMenu)}
                </div>
              )}
            </div>
          )}

          {/* SECCIÓN 3: Ajustes */}
          {visibleAjustes.length > 0 && (
            <div className="space-y-1">
              {!colapsado ? (
                <button
                  onClick={() => setSeccionAjustesAbierta(!seccionAjustesAbierta)}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-slate-350 cursor-pointer"
                >
                  <span>Ajustes</span>
                  <span className="material-symbols-outlined text-xs">
                    {seccionAjustesAbierta ? 'expand_less' : 'expand_more'}
                  </span>
                </button>
              ) : (
                <div className="border-b border-slate-850 my-2" />
              )}
              {(seccionAjustesAbierta || colapsado) && (
                <div className="space-y-1">
                  {visibleAjustes.map(renderItemMenu)}
                </div>
              )}
            </div>
          )}
        </nav>

        {/* Sección Usuario y Avatar Pastel */}
        <div className="border-t border-slate-800 bg-[#090a10]">
          {/* Ficha de identidad */}
          <div className={`p-3.5 flex items-center gap-3 ${colapsado ? 'justify-center' : 'justify-start'}`}>
            <div className={`w-9 h-9 rounded-full border flex items-center justify-center font-black text-xs shrink-0 select-none ${colorAvatar.bg} ${colorAvatar.text}`} title={usuario?.name}>
              {inicialUsuario}
            </div>
            {!colapsado && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate leading-none">{usuario?.name}</p>
                <p className="text-[9px] text-slate-500 font-bold uppercase truncate mt-1 leading-none">{rol.replace('_', ' ')}</p>
              </div>
            )}
          </div>


          {/* Botón Contraer/Expandir (Estilo GitLab) */}
          <div className="px-3">
            <button
              onClick={() => setColapsado(!colapsado)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-slate-400 hover:bg-[#1a1d2a] hover:text-slate-200 cursor-pointer ${colapsado ? 'justify-center' : 'justify-start'}`}
              title={colapsado ? 'Expandir barra lateral' : ''}
            >
              <span className="material-symbols-outlined text-xl text-slate-400">
                {colapsado ? 'keyboard_double_arrow_right' : 'keyboard_double_arrow_left'}
              </span>
              {!colapsado && <span className="text-xs font-bold uppercase tracking-wider">Contraer barra</span>}
            </button>
          </div>

          {/* Botón Logout al fondo */}
          <div className="px-3 pb-3">
            <button
              onClick={cerrarSesion}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-slate-400 hover:bg-[#1a1d2a] hover:text-slate-200 cursor-pointer ${colapsado ? 'justify-center' : 'justify-start'}`}
              title={colapsado ? 'Cerrar Sesión' : ''}
            >
              <span className="material-symbols-outlined text-xl text-slate-400">logout</span>
              {!colapsado && <span className="text-xs font-bold uppercase tracking-wider">Cerrar Sesión</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Sidebar Móvil (Off-canvas) */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button onClick={() => setColapsado(!colapsado)} className="bg-[#11131c] border border-slate-800 p-2 rounded-xl shadow-lg text-white">
          <span className="material-symbols-outlined">menu</span>
        </button>
      </div>

      {colapsado && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setColapsado(false)} />
      )}

      <div
        className={`lg:hidden fixed top-0 left-0 h-full w-64 bg-[#0c0e16] border-r border-slate-800 z-50 transform transition-transform duration-300 ease-in-out ${
          colapsado ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col justify-between`}
      >
        <div>
          <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800">
            <img src={logoImg} className="w-8 h-8 object-contain" alt="LigaCenter" />
            <button onClick={() => setColapsado(false)} className="text-slate-400">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <nav className="py-6 px-3 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Torneo Activo Móvil */}
            {visibleTorneo.length > 0 && (
              <div className="space-y-1">
                <p className="px-3 py-1.5 text-[9px] font-black text-slate-500 uppercase tracking-widest">Torneo Activo</p>
                {visibleTorneo.map(renderMobileItem)}
              </div>
            )}

            {/* Admin Móvil */}
            {visibleAdmin.length > 0 && (
              <div className="space-y-1">
                <p className="px-3 py-1.5 text-[9px] font-black text-slate-500 uppercase tracking-widest">Administración</p>
                {visibleAdmin.map(renderMobileItem)}
              </div>
            )}

            {/* Ajustes Móvil */}
            {visibleAjustes.length > 0 && (
              <div className="space-y-1">
                <p className="px-3 py-1.5 text-[9px] font-black text-slate-500 uppercase tracking-widest">Ajustes</p>
                {visibleAjustes.map(renderMobileItem)}
              </div>
            )}
          </nav>
        </div>

        {/* Footer Móvil */}
        <div className="border-t border-slate-800 bg-[#090a10]">
          <div className="p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-full border flex items-center justify-center font-black text-xs shrink-0 select-none ${colorAvatar.bg} ${colorAvatar.text}`}>
              {inicialUsuario}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate leading-none">{usuario?.name}</p>
              <p className="text-[9px] text-slate-500 font-bold uppercase truncate mt-1 leading-none">{rol.replace('_', ' ')}</p>
            </div>
          </div>

          <div className="px-4 pb-4">
            <button
              onClick={() => { cerrarSesion(); setColapsado(false); }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-[#1a1d2a] border border-slate-800 rounded-xl text-slate-400 hover:text-slate-200 text-xs font-extrabold uppercase tracking-wider"
            >
              <span className="material-symbols-outlined text-sm text-slate-400">logout</span>
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </>
  );
};