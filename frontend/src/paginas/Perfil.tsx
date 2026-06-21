import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAutenticacion } from '../contexto/ContextoAutenticacion';
import { serviciosUsuarios } from '../servicios/api';
import { BarraLateral } from '../componentes/BarraLateral';
import { CabeceraEstandar } from '../componentes/CabeceraEstandar';

type TabConfigType = 'perfil' | 'guia';

const PASOS_TORNEO = [
  { step: '1', title: 'Disciplinas y Categorías', desc: 'Registra deportes (fútbol, vóley, básquet), define los rangos de edad y género de cada categoría, y configura el formato de torneo.', icon: 'sports', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
  { step: '2', title: 'Equipos y Jugadores', desc: 'Inscribe los equipos por categoría y agrega los jugadores con su dorsal y edad validada.', icon: 'groups', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
  { step: '3', title: 'Generar Fixture', desc: 'Genera el fixture automático Round Robin o de eliminación seleccionando la disciplina y categoría correspondiente.', icon: 'calendar_today', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
  { step: '4', title: 'Programar Fechas y Canchas', desc: 'Registra los escenarios disponibles (canchas, estadios), asigna horarios a cada fecha del fixture y programa los partidos.', icon: 'schedule', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
  { step: '5', title: 'Mesa de Control (Planillas)', desc: 'Durante cada partido, registra goles, tarjetas, sustituciones e incidencias desde la mesa de control en tiempo real.', icon: 'edit_note', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
  { step: '6', title: 'Resultados y Tabla de Posiciones', desc: 'Consulta la tabla de posiciones actualizada al instante, los anotadores o rankings del campeonato y las sanciones.', icon: 'leaderboard', color: 'text-indigo-400 bg-indigo-500/15 border-indigo-500/30' },
];

// Helper para obtener colores pastel suaves
export const obtenerPastelColor = (nombre: string) => {
  if (!nombre) return { bg: 'bg-[#d0ebff] border-[#a5d8ff]', text: 'text-[#1c7ed6]' };
  const hash = nombre.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
  const colores = [
    { bg: 'bg-[#d0ebff] border-[#a5d8ff]', text: 'text-[#1c7ed6]' }, // Azul
    { bg: 'bg-[#e2f9e1] border-[#b2f2bb]', text: 'text-[#2b8a3e]' }, // Verde
    { bg: 'bg-[#ffe3e3] border-[#ffc9c9]', text: 'text-[#c92a2a]' }, // Rojo
    { bg: 'bg-[#f3e8ff] border-[#e8d2ff]', text: 'text-[#862e9c]' }, // Púrpura
    { bg: 'bg-[#fff9db] border-[#ffec99]', text: 'text-[#e67700]' }, // Amarillo
    { bg: 'bg-[#e3fafc] border-[#99e9f2]', text: 'text-[#0b7285]' }, // Cyan
    { bg: 'bg-[#fff0f6] border-[#fcc2d7]', text: 'text-[#c2255c]' }, // Rosa
  ];
  return colores[hash % colores.length];
};

export const Perfil: React.FC = () => {
  const { usuario, cargando, recargarUsuario } = useAutenticacion();
  const navegar = useNavigate();

  const [tabActiva, setTabActiva] = useState<TabConfigType>('perfil');

  // Estados del perfil
  const [datosPerfil, setDatosPerfil] = useState({ name: '', dni: '', phone: '', password: '', password_confirmation: '' });
  const [guardandoPerfil, setGuardandoPerfil] = useState(false);
  const [errorPerfil, setErrorPerfil] = useState<string | null>(null);
  const [exitoPerfil, setExitoPerfil] = useState<string | null>(null);

  useEffect(() => {
    if (!cargando && !usuario) {
      navegar('/login');
    }
  }, [usuario, cargando, navegar]);

  useEffect(() => {
    if (usuario) {
      setDatosPerfil({
        name: usuario.name || '',
        dni: usuario.dni || '',
        phone: usuario.phone || '',
        password: '',
        password_confirmation: ''
      });
    }
  }, [usuario]);

  const guardarPerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardandoPerfil(true);
    setErrorPerfil(null);
    setExitoPerfil(null);

    if (datosPerfil.password && datosPerfil.password !== datosPerfil.password_confirmation) {
      setErrorPerfil('Las contraseñas no coinciden.');
      setGuardandoPerfil(false);
      return;
    }

    try {
      const payload: any = {
        name: datosPerfil.name,
        dni: datosPerfil.dni || null,
        phone: datosPerfil.phone || null
      };
      if (datosPerfil.password) {
        payload.password = datosPerfil.password;
        payload.password_confirmation = datosPerfil.password_confirmation;
      }

      const res = await serviciosUsuarios.actualizarUsuario(usuario!.id, payload);
      if (res.success) {
        await recargarUsuario();
        setExitoPerfil('Perfil actualizado correctamente.');
        setDatosPerfil(prev => ({ ...prev, password: '', password_confirmation: '' }));
      }
    } catch (err: any) {
      setErrorPerfil(err.response?.data?.message || 'Error al actualizar el perfil.');
    } finally {
      setGuardandoPerfil(false);
    }
  };

  if (cargando || !usuario) return null;

  const inicialUsuario = usuario.name ? usuario.name.charAt(0).toUpperCase() : 'U';
  const colorAvatar = obtenerPastelColor(usuario.name || '');

  return (
    <div className="min-h-screen bg-[#0a0b10] text-slate-100 font-sans relative overflow-hidden">
      <BarraLateral rol={usuario.roles?.[0] || 'usuario_publico'} />
      <div className="lg:ml-64 flex flex-col min-h-screen relative z-10">

      <CabeceraEstandar titulo="Mi Perfil" subtitulo="Administración de cuenta y guía técnica" />

      {/* Contenido */}
      <main className="flex-1 p-6 max-w-4xl w-full mx-auto space-y-6">

        {/* Tabs */}
        <div className="bg-[#11131c] border border-slate-900 rounded-2xl p-1.5 flex gap-1 shadow-xs w-fit">
          {[
            { id: 'perfil' as TabConfigType, label: 'Mi Perfil', icon: 'person' },
            { id: 'guia' as TabConfigType, label: 'Guía del Torneo', icon: 'help' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTabActiva(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                tabActiva === tab.id
                  ? 'bg-indigo-650 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-[#171a26]'
              }`}
            >
              <span className="material-symbols-outlined text-sm">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Panel: Mi Perfil */}
        {tabActiva === 'perfil' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Card de identidad */}
            <div className="bg-[#11131c] border border-slate-900 rounded-2xl p-6 flex flex-col items-center gap-4 shadow-xs text-center">
              <div className={`w-20 h-20 rounded-full border-2 flex items-center justify-center ${colorAvatar.bg}`}>
                <span className={`text-3xl font-black ${colorAvatar.text}`}>{inicialUsuario}</span>
              </div>
              <div>
                <p className="font-extrabold text-white text-sm">{usuario.name}</p>
                <p className="text-xs text-slate-455 mt-0.5">{usuario.email}</p>
              </div>
              <div className="w-full pt-3 border-t border-slate-900 space-y-2 text-left">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-455 font-semibold">Rol</span>
                  <span className="font-bold text-slate-300 capitalize">{usuario.roles?.[0]?.replace('_', ' ') || '—'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-455 font-semibold">DNI</span>
                  <span className="font-bold text-slate-300">{usuario.dni || '—'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-455 font-semibold">Teléfono</span>
                  <span className="font-bold text-slate-300">{usuario.phone || '—'}</span>
                </div>
              </div>
            </div>

            {/* Formulario de edición */}
            <div className="md:col-span-2 bg-[#11131c] border border-slate-900 rounded-2xl p-6 shadow-xs space-y-5">
              <div className="border-b border-slate-900 pb-4">
                <h2 className="text-sm font-extrabold text-white">Editar Información Personal</h2>
                <p className="text-xs text-slate-455 mt-1">Los cambios se reflejan inmediatamente en el sistema.</p>
              </div>

              {exitoPerfil && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 text-xs font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  {exitoPerfil}
                </div>
              )}
              {errorPerfil && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-455 text-xs font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">error</span>
                  {errorPerfil}
                </div>
              )}

              <form onSubmit={guardarPerfil} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">Nombre Completo *</label>
                  <input
                    type="text" required placeholder="Tu nombre completo"
                    value={datosPerfil.name}
                    onChange={(e) => setDatosPerfil({ ...datosPerfil, name: e.target.value })}
                    className="w-full text-sm border border-slate-800 rounded-lg p-2.5 outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-[#171a26] text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 block">DNI / Documento</label>
                    <input
                      type="text" placeholder="Ej: 12345678"
                      value={datosPerfil.dni}
                      onChange={(e) => setDatosPerfil({ ...datosPerfil, dni: e.target.value })}
                      className="w-full text-sm border border-slate-800 rounded-lg p-2.5 outline-hidden focus:border-indigo-500 bg-[#171a26] text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 block">Teléfono</label>
                    <input
                      type="text" placeholder="Ej: 987654321"
                      value={datosPerfil.phone}
                      onChange={(e) => setDatosPerfil({ ...datosPerfil, phone: e.target.value })}
                      className="w-full text-sm border border-slate-800 rounded-lg p-2.5 outline-hidden focus:border-indigo-500 bg-[#171a26] text-white"
                    />
                  </div>
                </div>

                {/* Sección contraseña */}
                <div className="pt-4 border-t border-slate-900 space-y-3">
                  <div>
                    <h3 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">Cambiar Contraseña</h3>
                    <p className="text-[10px] text-slate-455 mt-0.5">Deja en blanco si no deseas cambiarla.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300 block">Nueva Contraseña</label>
                      <input
                        type="password" placeholder="Mínimo 8 caracteres"
                        value={datosPerfil.password}
                        onChange={(e) => setDatosPerfil({ ...datosPerfil, password: e.target.value })}
                        className="w-full text-sm border border-slate-800 rounded-lg p-2.5 outline-hidden focus:border-indigo-500 bg-[#171a26] text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300 block">Confirmar Contraseña</label>
                      <input
                        type="password" placeholder="Repite la contraseña"
                        value={datosPerfil.password_confirmation}
                        onChange={(e) => setDatosPerfil({ ...datosPerfil, password_confirmation: e.target.value })}
                        className="w-full text-sm border border-slate-800 rounded-lg p-2.5 outline-hidden focus:border-indigo-500 bg-[#171a26] text-white"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={guardandoPerfil}
                  className="w-full bg-indigo-650 hover:bg-indigo-600 text-white py-2.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {guardandoPerfil ? (
                    <>
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">save</span>
                      <span>Guardar Cambios</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Panel: Guía del Torneo */}
        {tabActiva === 'guia' && (
          <div className="space-y-4">
            <div className="bg-[#11131c] border border-slate-900 rounded-2xl p-6 shadow-xs">
              <div className="border-b border-slate-900 pb-4 mb-6">
                <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-indigo-400 text-base">help</span>
                  Guía del Ciclo de Vida del Torneo
                </h2>
                <p className="text-xs text-slate-450 mt-1 leading-relaxed">
                  Sigue esta secuencia de pasos para configurar y gestionar tu campeonato correctamente de principio a fin.
                </p>
              </div>

              <div className="space-y-3">
                {PASOS_TORNEO.map((paso) => (
                  <div key={paso.step} className="flex gap-4 p-4 rounded-xl border border-slate-850 bg-[#171a26] hover:bg-[#1c1f2e] transition-colors">
                    <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${paso.color}`}>
                      <span className="material-symbols-outlined text-base">{paso.icon}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black text-slate-505 uppercase tracking-widest">Paso {paso.step}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-extrabold text-white leading-none mb-1.5">{paso.title}</h3>
                      </div>
                      <p className="text-xs text-slate-450 leading-relaxed font-medium">{paso.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-900 flex items-center justify-between text-xs text-slate-450">
                <span className="font-semibold">¿Tienes problemas? Escríbenos.</span>
                <a href="mailto:soporte@ligacenter.com" className="text-indigo-400 font-bold hover:underline">
                  soporte@ligacenter.com
                </a>
              </div>
            </div>
          </div>
        )}

      </main>

      <footer className="mt-auto bg-[#11131c] border-t border-slate-900 py-5 text-center text-xs text-slate-450">
        © 2026 LigaCenter — Gestión de campeonatos deportivos, Arequipa, Perú.
      </footer>
      </div>
    </div>
  );
};
