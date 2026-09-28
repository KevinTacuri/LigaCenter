// c:\proyecto-campeonato\frontend\src\componentes\BarraLateral.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAutenticacion } from '../contexto/ContextoAutenticacion';
import { useCampeonato } from '../contexto/ContextoCampeonato';
import { useConfirm } from '@omit/react-confirm-dialog';
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

const obtenerPastelColorSidebar = (nombre: string) => {
  if (!nombre) return { bg: 'bg-[#d0efe4] border border-[#aab6ca]', text: 'text-[#193b70]' };
  const hash = nombre.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
  const colores = [
    { bg: 'bg-[#d0efe4] border border-[#aab6ca]', text: 'text-[#193b70]' },
    { bg: 'bg-[#d0efe4] border border-[#41c2b5]/55', text: 'text-[#193b70]' },
    { bg: 'bg-[#b8e6ad] border border-[#8ed77b]', text: 'text-[#193b70]' },
    { bg: 'bg-[#edf6ff] border border-[#aab6ca]', text: 'text-[#193b70]' },
    { bg: 'bg-[#d0efe4] border border-[#41c2b5]/55', text: 'text-[#193b70]' },
    { bg: 'bg-[#b8e6ad] border border-[#aab6ca]', text: 'text-[#193b70]' },
  ];
  return colores[hash % colores.length];
};

const subMenus: Record<string, SubItemMenu[]> = {
  teams: [
    { id: 'categorias', titulo: 'Categorías', query: 'tab=categorias' },
    { id: 'equipos', titulo: 'Equipos', query: 'tab=equipos' },
    { id: 'jugadores', titulo: 'Jugadores', query: 'tab=jugadores' },
    // { id: 'registro-equipo', titulo: 'Inscripción Rápida', query: 'tab=registro-equipo' },
    { id: 'planilla-jugadores', titulo: 'Planilla Jugadores', query: 'tab=planilla-jugadores' },
  ],
  fixture: [
    { id: 'escenarios', titulo: 'Escenarios', query: 'tab=escenarios' },
    { id: 'generar', titulo: 'Generar Fixture', query: 'tab=generar' },
    { id: 'programar', titulo: 'Asignar Fechas', query: 'tab=programar' },
    { id: 'partidos', titulo: 'Partidos', query: 'tab=partidos' },
    { id: 'eventos', titulo: 'Eventos', query: 'tab=eventos' },
  ],
};

export const BarraLateral: React.FC<Props> = ({ rol }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { usuario, cerrarSesion } = useAutenticacion();
  const { campeonatoActivo } = useCampeonato();
  const confirm = useConfirm();
  const [colapsado, setColapsado] = useState(false);

  const membresiaActiva = campeonatoActivo && usuario?.championship_memberships?.find(
    (m) => m.championship_id === campeonatoActivo.id
  );
  const rolCampeonato = membresiaActiva ? membresiaActiva.role : null;

  const esOrganizador = !!(rol === 'organizador' || rol === 'administrador' || rolCampeonato === 'organizer' || usuario?.roles?.includes('organizador') || usuario?.roles?.includes('administrador'));
  const esDelegadoPuro = !!(rolCampeonato === 'team_delegate' || usuario?.roles?.includes('delegado') || usuario?.roles?.includes('delegado_equipo')) && !esOrganizador;

  const manejarCerrarSesion = async () => {
    const isConfirmed = await confirm({
      title: '¿Cerrar Sesión?',
      description: '¿Estás seguro de que deseas salir de tu cuenta? Tendrás que iniciar sesión nuevamente para acceder.',
      confirmText: 'Cerrar Sesión',
      cancelText: 'Cancelar'
    });
    if (isConfirmed) {
      await cerrarSesion();
    }
  };

  const getSubMenus = (itemId: string): SubItemMenu[] => {
    if (itemId === 'posiciones') return [];
    const items = subMenus[itemId] || [];
    if (esDelegadoPuro) {
      if (itemId === 'teams') {
        return items.filter(sub => sub.id === 'planilla-jugadores' || sub.id === 'equipos' || sub.id === 'jugadores');
      }
      if (itemId === 'fixture') {
        return items.filter(sub => sub.id === 'partidos');
      }
    }
    return items;
  };

  const [seccionTorneoAbierta, setSeccionTorneoAbierta] = useState(true);
  const [seccionAdminAbierta, setSeccionAdminAbierta] = useState(true);
  const [seccionAjustesAbierta, setSeccionAjustesAbierta] = useState(true);

  const [submenusDesplegados, setSubmenusDesplegados] = useState<Record<string, boolean>>({});
  const [submenusModificadosPorUsuario, setSubmenusModificadosPorUsuario] = useState<Record<string, boolean>>({});

  const toggleSubmenu = (itemId: string) => {
    setSubmenusModificadosPorUsuario((prev) => ({ ...prev, [itemId]: true }));
    setSubmenusDesplegados((prev) => ({
      ...prev,
      [itemId]: !(prev[itemId] ?? false),
    }));
  };

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
      visible: !!campeonatoActivo
    },
    {
      id: 'delegados',
      titulo: 'Encargados de Mesa',
      icono: 'badge',
      ruta: '/tablero/delegados',
      visible: !!(campeonatoActivo && esOrganizador)
    },
    {
      id: 'fixture',
      titulo: 'Fixture y Calendario',
      icono: 'calendar_today',
      ruta: '/tablero/fixture',
      visible: !!campeonatoActivo
    },
    {
      id: 'mesa',
      titulo: 'Mesa de Control',
      icono: 'edit_note',
      ruta: '/tablero/mesa',
      visible: !!(campeonatoActivo && (esOrganizador || rolCampeonato === 'score_table' || rolCampeonato === 'referee'))
    },
    {
      id: 'posiciones',
      titulo: 'Posiciones y Estadísticas',
      icono: 'leaderboard',
      ruta: '/tablero/estadisticas',
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
      visible: !!(campeonatoActivo && esOrganizador)
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

    itemsTorneo.forEach((item) => {
      if (isActive(item.ruta) && !submenusModificadosPorUsuario[item.id]) {
        setSubmenusDesplegados((prev) => ({ ...prev, [item.id]: true }));
      }
    });
  }, [location.pathname]);

  useEffect(() => {
    if (esDelegadoPuro) {
      document.documentElement.style.setProperty('--sidebar-width', '0px');
    } else {
      document.documentElement.style.setProperty(
        '--sidebar-width',
        colapsado ? '5rem' : '16rem'
      );
    }
  }, [colapsado, esDelegadoPuro]);

  if (esDelegadoPuro) {
    return null;
  }

  const visibleTorneo = itemsTorneo.filter(item => item.visible);
  const visibleAdmin = itemsAdmin.filter(item => item.visible);
  const visibleAjustes = itemsAjustes.filter(item => item.visible);

  const inicialUsuario = usuario?.name ? usuario.name.charAt(0).toUpperCase() : 'U';
  const colorAvatar = obtenerPastelColorSidebar(usuario?.name || '');

  const renderItemMenu = (item: ItemMenu) => {
    const active = isActive(item.ruta);
    const subItems = getSubMenus(item.id);
    const tieneSubItems = subItems && subItems.length > 0;
    const estaDesplegado = submenusDesplegados[item.id] ?? active;

    const manejarClic = () => {
      if (tieneSubItems) {
        toggleSubmenu(item.id);
      } else {
        navigate(item.ruta);
      }
    };

    return (
      <div key={item.id} className="space-y-0.5">
        <button
          type="button"
          onClick={manejarClic}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer ${
            active
              ? 'bg-[#7ddc65]/50 text-[#193b70] font-bold border border-[#9bb0c7] shadow-sm'
              : 'text-[var(--on-surface)] hover:bg-[#7ddc65]/50 hover:text-[#193b70]'
          } ${colapsado ? 'justify-center' : ''}`}
          title={colapsado ? item.titulo : ''}
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-xl text-[var(--on-surface)]">{item.icono}</span>
            {!colapsado && <span className="text-sm font-medium text-[var(--on-surface)]">{item.titulo}</span>}
          </div>
          {!colapsado && tieneSubItems && (
            <span className={`material-symbols-outlined text-sm text-on-surface-variant transition-transform duration-300 ${estaDesplegado ? 'rotate-180' : ''}`}>
              expand_more
            </span>
          )}
        </button>

        {!colapsado && tieneSubItems && (
          <div
            className={`grid transition-all duration-300 ease-in-out border-l border-outline ml-5 mt-1 pl-3 pr-1 ${
              estaDesplegado
                ? 'grid-rows-[1fr] opacity-100 py-1'
                : 'grid-rows-[0fr] opacity-0 py-0 overflow-hidden pointer-events-none'
            }`}
          >
            <div className="overflow-hidden space-y-1">
              {subItems.map((sub) => {
                const subActive = isSubActive(item, sub);
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => navigate(`${item.ruta}?${sub.query}`)}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all block cursor-pointer ${
                      subActive
                        ? 'text-[#193b70] bg-[#7ddc65]/50 font-black border-l-2 border-[#41c2b5]'
                        : 'text-[var(--on-surface)] hover:text-[var(--on-surface)] hover:bg-[#7ddc65]/50'
                    }`}
                  >
                    {sub.titulo}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderMobileItem = (item: ItemMenu) => {
    const active = isActive(item.ruta);
    const subItems = getSubMenus(item.id);
    const tieneSubItems = subItems && subItems.length > 0;
    const estaDesplegado = submenusDesplegados[item.id] ?? active;

    const manejarClicMobile = () => {
      if (tieneSubItems) {
        toggleSubmenu(item.id);
      } else {
        navigate(item.ruta);
        setColapsado(false);
      }
    };

    return (
      <div key={item.id} className="space-y-0.5">
        <button
          type="button"
          onClick={manejarClicMobile}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
            active ? 'bg-[#7ddc65]/50 text-[#193b70] font-bold border border-[#9bb0c7]' : 'text-[var(--on-surface)] hover:bg-[#7ddc65]/50 hover:text-[#193b70]'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-xl text-[var(--on-surface)]">{item.icono}</span>
            <span className="text-sm font-medium text-[var(--on-surface)]">{item.titulo}</span>
          </div>
          {tieneSubItems && (
            <span className={`material-symbols-outlined text-sm transition-transform duration-300 ${estaDesplegado ? 'rotate-180' : ''}`}>
              expand_more
            </span>
          )}
        </button>

        {tieneSubItems && (
          <div
            className={`grid transition-all duration-300 ease-in-out border-l border-outline ml-5 mt-1 pl-3 pr-1 ${
              estaDesplegado
                ? 'grid-rows-[1fr] opacity-100 py-1'
                : 'grid-rows-[0fr] opacity-0 py-0 overflow-hidden pointer-events-none'
            }`}
          >
            <div className="overflow-hidden space-y-1">
              {subItems.map((sub) => {
                const subActive = isSubActive(item, sub);
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => {
                      navigate(`${item.ruta}?${sub.query}`);
                      setColapsado(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all block cursor-pointer ${
                      subActive
                        ? 'text-[#193b70] bg-[#7ddc65]/50 font-black border-l-2 border-[#41c2b5]'
                        : 'text-[var(--on-surface)] hover:text-[var(--on-surface)] hover:bg-[#7ddc65]/50'
                    }`}
                  >
                    {sub.titulo}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <aside
        className={`hidden lg:flex flex-col bg-[var(--sidebar-bg)] border-r border-[var(--outline)] transition-all duration-300 ease-in-out text-[var(--on-surface)] ${
          colapsado ? 'w-20' : 'w-64'
        } fixed left-0 top-0 h-full z-40 shadow-2xl`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-outline">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <img src={logoImg} className="w-8 h-8 object-contain shrink-0" alt="LigaCenter" />
            {!colapsado && (
              <span className="font-black text-on-surface text-sm uppercase font-sans tracking-tight truncate">
                LigaCenter
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setColapsado(!colapsado)}
            className="w-8 h-8 rounded-xl bg-surface hover:bg-surface-bright border border-outline flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-all cursor-pointer shadow-2xs hover:scale-105"
            title={colapsado ? 'Expandir barra lateral' : 'Contraer barra lateral'}
          >
            <span className="material-symbols-outlined text-lg transition-transform duration-300">
              {colapsado ? 'side_navigation' : 'view_sidebar'}
            </span>
          </button>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-4 overflow-y-auto">
          {visibleTorneo.length > 0 && (
            <div className="space-y-1">
              {!colapsado ? (
                <button
                  type="button"
                  onClick={() => setSeccionTorneoAbierta(!seccionTorneoAbierta)}
                  aria-expanded={seccionTorneoAbierta}
                  aria-controls="menu-torneo"
                  className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-black text-on-surface-variant hover:text-on-surface uppercase tracking-widest transition-colors cursor-pointer"
                >
                  <span>Torneo Activo</span>
                  <span className={`material-symbols-outlined text-xs transition-transform duration-300 ${seccionTorneoAbierta ? 'rotate-180' : ''}`}>
                    expand_more
                  </span>
                </button>
              ) : (
                <div className="border-b border-outline my-2" />
              )}
              {(seccionTorneoAbierta || colapsado) && (
                <div id="menu-torneo" className="space-y-1">
                  {visibleTorneo.map(renderItemMenu)}
                </div>
              )}
            </div>
          )}

          {visibleAdmin.length > 0 && (
            <div className="space-y-1">
              {!colapsado ? (
                <button
                  type="button"
                  onClick={() => setSeccionAdminAbierta(!seccionAdminAbierta)}
                  aria-expanded={seccionAdminAbierta}
                  aria-controls="menu-admin"
                  className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-black text-on-surface-variant hover:text-on-surface uppercase tracking-widest transition-colors cursor-pointer"
                >
                  <span>Administración</span>
                  <span className={`material-symbols-outlined text-xs transition-transform duration-300 ${seccionAdminAbierta ? 'rotate-180' : ''}`}>
                    expand_more
                  </span>
                </button>
              ) : (
                <div className="border-b border-outline my-2" />
              )}
              {(seccionAdminAbierta || colapsado) && (
                <div id="menu-admin" className="space-y-1">
                  {visibleAdmin.map(renderItemMenu)}
                </div>
              )}
            </div>
          )}

          {visibleAjustes.length > 0 && (
            <div className="space-y-1">
              {!colapsado ? (
                <button
                  type="button"
                  onClick={() => setSeccionAjustesAbierta(!seccionAjustesAbierta)}
                  aria-expanded={seccionAjustesAbierta}
                  aria-controls="menu-ajustes"
                  className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-black text-on-surface-variant hover:text-on-surface uppercase tracking-widest transition-colors cursor-pointer"
                >
                  <span>Ajustes</span>
                  <span className={`material-symbols-outlined text-xs transition-transform duration-300 ${seccionAjustesAbierta ? 'rotate-180' : ''}`}>
                    expand_more
                  </span>
                </button>
              ) : (
                <div className="border-b border-outline my-2" />
              )}
              {(seccionAjustesAbierta || colapsado) && (
                <div id="menu-ajustes" className="space-y-1">
                  {visibleAjustes.map(renderItemMenu)}
                </div>
              )}
            </div>
          )}
        </nav>

        <div className="border-t border-outline bg-surface-dim p-3.5 space-y-2">
          <div className={`flex items-center gap-3 ${colapsado ? 'justify-center' : 'justify-start'}`}>
            <div className={`w-9 h-9 rounded-full border flex items-center justify-center font-black text-xs shrink-0 select-none ${colorAvatar.bg} ${colorAvatar.text}`} title={usuario?.name}>
              {inicialUsuario}
            </div>
            {!colapsado && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-on-surface truncate leading-none">{usuario?.name}</p>
                <p className="text-[9px] text-on-surface-variant font-bold uppercase truncate mt-1 leading-none">
                  {rolCampeonato === 'team_delegate' ? 'Delegado de Equipo' : rol.replace('_', ' ')}
                </p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={manejarCerrarSesion}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 text-on-surface-variant hover:bg-surface-bright hover:text-on-surface cursor-pointer ${colapsado ? 'justify-center' : 'justify-start'}`}
            title={colapsado ? 'Cerrar Sesión' : ''}
          >
            <span className="material-symbols-outlined text-lg text-rose-500">logout</span>
            {!colapsado && <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          type="button"
          onClick={() => setColapsado(!colapsado)}
          className="bg-primary-container border border-outline p-2 rounded-xl shadow-lg text-on-surface cursor-pointer"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
      </div>

      {colapsado && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-xs" onClick={() => setColapsado(false)} />
      )}

      <div
        className={`lg:hidden fixed top-0 left-0 h-full w-64 bg-[var(--sidebar-bg)] border-r border-[var(--outline)] z-50 transform transition-transform duration-300 ease-in-out text-[var(--on-surface)] ${
          colapsado ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col justify-between`}
      >
        <div>
          <div className="flex items-center justify-between h-16 px-4 border-b border-outline">
            <div className="flex items-center gap-2">
              <img src={logoImg} className="w-8 h-8 object-contain" alt="LigaCenter" />
              <span className="font-black text-on-surface text-sm uppercase">LigaCenter</span>
            </div>
            <button type="button" onClick={() => setColapsado(false)} className="text-on-surface-variant">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <nav className="py-6 px-3 space-y-4 max-h-[70vh] overflow-y-auto">
            {visibleTorneo.length > 0 && (
              <div className="space-y-1">
                <p className="px-3 py-1.5 text-[9px] font-black text-on-surface-variant uppercase tracking-widest">Torneo Activo</p>
                {visibleTorneo.map(renderMobileItem)}
              </div>
            )}

            {visibleAdmin.length > 0 && (
              <div className="space-y-1">
                <p className="px-3 py-1.5 text-[9px] font-black text-on-surface-variant uppercase tracking-widest">Administración</p>
                {visibleAdmin.map(renderMobileItem)}
              </div>
            )}

            {visibleAjustes.length > 0 && (
              <div className="space-y-1">
                <p className="px-3 py-1.5 text-[9px] font-black text-on-surface-variant uppercase tracking-widest">Ajustes</p>
                {visibleAjustes.map(renderMobileItem)}
              </div>
            )}
          </nav>
        </div>

        <div className="border-t border-outline bg-surface-dim p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-full border flex items-center justify-center font-black text-xs shrink-0 select-none ${colorAvatar.bg} ${colorAvatar.text}`}>
              {inicialUsuario}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-on-surface truncate leading-none">{usuario?.name}</p>
              <p className="text-[9px] text-on-surface-variant font-bold uppercase truncate mt-1 leading-none">
                {rolCampeonato === 'team_delegate' ? 'Delegado de Equipo' : rol.replace('_', ' ')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={async () => {
              setColapsado(false);
              await manejarCerrarSesion();
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-surface border border-outline rounded-xl text-rose-600 dark:text-rose-400 hover:bg-surface-bright text-xs font-extrabold uppercase tracking-wider cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">logout</span>
            Cerrar Sesión
          </button>
        </div>
      </div>
    </>
  );
};