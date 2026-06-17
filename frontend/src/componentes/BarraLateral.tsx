import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAutenticacion } from '../contexto/ContextoAutenticacion';
import { useCampeonato } from '../contexto/ContextoCampeonato';
import logoImg from '../assets/logo.svg';

interface ItemMenu {
  id: string;
  titulo: string;
  icono: string;
  ruta: string;
  visible: boolean;  // se calcula al construir el menú según rol
  accion?: () => void;
}

interface Props {
  rol: string; // 'usuario_publico' | 'administrador' | 'organizador' | 'encargado_mesa'
}

export const BarraLateral: React.FC<Props> = ({ rol }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cerrarSesion, tienePermiso } = useAutenticacion();
  const { campeonatoActivo } = useCampeonato();
  const [colapsado, setColapsado] = useState(false);

  // --- Definición de ítems por rol ---
  const getItemsPorRol = (): ItemMenu[] => {
    // Items comunes a todos los roles que ven la barra
    const itemsBasicos: ItemMenu[] = [
      {
        id: 'dashboard',
        titulo: 'Dashboard',
        icono: 'dashboard',
        ruta: '/tablero',
        visible: true,
      },
      {
        id: 'config',
        titulo: 'Configuración',
        icono: 'settings',
        ruta: '/tablero/configuracion',
        visible: true,
      },
      {
        id: 'signout',
        titulo: 'Cerrar Sesión',
        icono: 'logout',
        ruta: '#',
        visible: true,
        accion: () => cerrarSesion(),
      },
    ];

    // Items específicos por rol
    switch (rol) {
      case 'administrador':
        return [
          ...itemsBasicos,
          {
            id: 'organisations',
            titulo: 'Organizaciones SaaS',
            icono: 'corporate_fare',
            ruta: '/tablero/saas-admin',
            visible: true,
          },
          {
            id: 'usuarios',
            titulo: 'Gestión de Usuarios',
            icono: 'group',
            ruta: '/tablero/usuarios',
            visible: true,
          },
          {
            id: 'audit',
            titulo: 'Auditoría',
            icono: 'history',
            ruta: '/tablero/usuarios', // o una ruta específica de auditoría
            visible: true,
          },
          {
            id: 'teams',
            titulo: 'Equipos y Jugadores',
            icono: 'groups',
            ruta: '/tablero/participantes',
            visible: !!campeonatoActivo,
          },
          {
            id: 'fixture',
            titulo: 'Fixture y Calendario',
            icono: 'calendar_today',
            ruta: '/tablero/fixture',
            visible: !!campeonatoActivo,
          },
          {
            id: 'mesa',
            titulo: 'Mesa de Control',
            icono: 'edit_note',
            ruta: '/tablero/mesa',
            visible: !!campeonatoActivo,
          },
          {
            id: 'posiciones',
            titulo: 'Posiciones',
            icono: 'leaderboard',
            ruta: '/tablero/publico',
            visible: !!campeonatoActivo,
          },
        ];

      case 'organizador':
        return [
          ...itemsBasicos,
          {
            id: 'teams',
            titulo: 'Equipos y Jugadores',
            icono: 'groups',
            ruta: '/tablero/participantes',
            visible: !!campeonatoActivo,
          },
          {
            id: 'fixture',
            titulo: 'Fixture y Calendario',
            icono: 'calendar_today',
            ruta: '/tablero/fixture',
            visible: !!campeonatoActivo,
          },
          {
            id: 'mesa',
            titulo: 'Mesa de Control',
            icono: 'edit_note',
            ruta: '/tablero/mesa',
            visible: !!campeonatoActivo,
          },
          {
            id: 'posiciones',
            titulo: 'Posiciones',
            icono: 'leaderboard',
            ruta: '/tablero/publico',
            visible: !!campeonatoActivo,
          },
        ];

      case 'encargado_mesa':
        return [
          ...itemsBasicos,
          {
            id: 'mesa',
            titulo: 'Mesa de Control',
            icono: 'edit_note',
            ruta: '/tablero/mesa',
            visible: !!campeonatoActivo,
          },
          {
            id: 'posiciones',
            titulo: 'Posiciones',
            icono: 'leaderboard',
            ruta: '/tablero/publico',
            visible: !!campeonatoActivo,
          },
        ];

      case 'usuario_publico':
      default:
        return [
          ...itemsBasicos,
          {
            id: 'teams',
            titulo: 'Equipos y Jugadores',
            icono: 'groups',
            ruta: '/tablero/participantes',
            visible: !!campeonatoActivo,
          },
          {
            id: 'fixture',
            titulo: 'Fixture y Calendario',
            icono: 'calendar_today',
            ruta: '/tablero/fixture',
            visible: !!campeonatoActivo,
          },
          {
            id: 'posiciones',
            titulo: 'Posiciones',
            icono: 'leaderboard',
            ruta: '/tablero/publico',
            visible: !!campeonatoActivo,
          },
          {
            id: 'support',
            titulo: 'Soporte',
            icono: 'help',
            ruta: '/tablero/configuracion?tab=guia',
            visible: true,
            accion: () => navigate('/tablero/configuracion?tab=guia'),
          },
        ];
    }
  };

  const items = getItemsPorRol().filter(item => item.visible);
  const isActive = (ruta: string) => {
    if (ruta === '#') return false;
    const pathBase = ruta.split('?')[0];
    return location.pathname === pathBase;
  };

  return (
    <>
      {/* Desktop */}
      <aside
        className={`hidden lg:flex flex-col bg-[#0c0e16] border-r border-slate-800 transition-all duration-300 ease-in-out ${
          colapsado ? 'w-20' : 'w-64'
        } fixed left-0 top-0 h-full z-40 shadow-2xl`}
      >
        <div className={`flex items-center h-16 px-4 border-b border-slate-800 ${colapsado ? 'justify-center' : 'justify-between'}`}>
          <div className="flex items-center gap-2 overflow-hidden">
            <img src={logoImg} className="w-8 h-8 object-contain" alt="LigaCenter" />
            {!colapsado && <span className="font-black text-white text-sm uppercase">LigaCenter</span>}
          </div>
          <button onClick={() => setColapsado(!colapsado)} className="text-slate-400 hover:text-white">
            <span className="material-symbols-outlined text-xl">
              {colapsado ? 'chevron_right' : 'chevron_left'}
            </span>
          </button>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => item.accion ? item.accion() : navigate(item.ruta)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                isActive(item.ruta)
                  ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                  : 'text-slate-400 hover:bg-[#1a1d2a] hover:text-slate-200'
              } ${colapsado ? 'justify-center' : 'justify-start'}`}
              title={colapsado ? item.titulo : ''}
            >
              <span className="material-symbols-outlined text-xl">{item.icono}</span>
              {!colapsado && <span className="text-sm font-medium">{item.titulo}</span>}
            </button>
          ))}
        </nav>

        {!colapsado && (
          <div className="p-4 border-t border-slate-800 text-[10px] text-slate-500 text-center">
            v1.0 • {new Date().getFullYear()}
          </div>
        )}
      </aside>

      {/* Móvil (off-canvas) */}
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
        }`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800">
          <img src={logoImg} className="w-8 h-8 object-contain" alt="LigaCenter" />
          <button onClick={() => setColapsado(false)} className="text-slate-400">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <nav className="py-6 px-3 space-y-1.5">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                item.accion ? item.accion() : navigate(item.ruta);
                setColapsado(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl ${
                isActive(item.ruta)
                  ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                  : 'text-slate-400 hover:bg-[#1a1d2a] hover:text-slate-200'
              }`}
            >
              <span className="material-symbols-outlined text-xl">{item.icono}</span>
              <span className="text-sm font-medium">{item.titulo}</span>
            </button>
          ))}
        </nav>
      </div>
    </>
  );
};