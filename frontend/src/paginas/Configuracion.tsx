import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAutenticacion } from '../contexto/ContextoAutenticacion';
import { serviciosUsuarios } from '../servicios/api';
import logoImg from '../assets/logo.svg';

type TabConfigType = 'perfil' | 'guia';

const PASOS_TORNEO = [
  { step: '1', title: 'Disciplinas y Categorías', desc: 'Registra deportes (fútbol, vóley, básquet) y define los rangos de edad y género de cada categoría antes de inscribir equipos.', icon: 'sports', color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { step: '2', title: 'Registrar Instituciones', desc: 'Crea los clubes u organizaciones participantes y asigna un delegado responsable a cada una.', icon: 'corporate_fare', color: 'text-violet-600 bg-violet-50 border-violet-200' },
  { step: '3', title: 'Equipos y Jugadores', desc: 'Inscribe los equipos por categoría, vinculándolos a su organización, y agrega los jugadores con su dorsal y edad validada.', icon: 'groups', color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  { step: '4', title: 'Generar Fixture', desc: 'Genera el fixture automático Round Robin (todos contra todos) seleccionando la disciplina y categoría correspondiente.', icon: 'calendar_today', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { step: '5', title: 'Programar Fechas y Canchas', desc: 'Registra los escenarios disponibles (canchas, estadios), asigna horarios a cada fecha del fixture y programa los partidos.', icon: 'schedule', color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { step: '6', title: 'Mesa de Control (Planillas)', desc: 'Durante cada partido, registra goles, tarjetas, sustituciones e incidencias desde la mesa de control en tiempo real.', icon: 'edit_note', color: 'text-rose-600 bg-rose-50 border-rose-200' },
  { step: '7', title: 'Resultados y Tabla de Posiciones', desc: 'Consulta la tabla de posiciones actualizada al instante, los goleadores del campeonato y las sanciones acumuladas.', icon: 'leaderboard', color: 'text-primary bg-primary/5 border-primary/20' },
];

export const Configuracion: React.FC = () => {
  const { usuario, cargando, tieneRol, recargarUsuario } = useAutenticacion();
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

  return (
    <div className="min-h-screen bg-[#f4f6f7] font-sans flex flex-col">

      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-6 py-4 flex items-center gap-4 sticky top-0 z-30 shadow-xs">
        <button
          onClick={() => navegar('/tablero')}
          className="w-9 h-9 rounded-lg flex items-center justify-center border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-all cursor-pointer shrink-0"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
        </button>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 flex items-center justify-center">
            <img src={logoImg} className="w-full h-full object-contain" alt="Logo" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-slate-900 leading-none">Configuración</h1>
            <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase block mt-0.5">
              Perfil y preferencias de tu cuenta
            </span>
          </div>
        </div>

        {/* Avatar del usuario */}
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden md:flex flex-col text-right">
            <span className="text-xs font-extrabold text-slate-900">{usuario.name}</span>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
              {usuario.roles?.[0]?.replace('_', ' ') || 'Usuario'}
            </span>
          </div>
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center font-extrabold text-xs text-white select-none">
            {inicialUsuario}
          </div>
        </div>
      </header>

      {/* Contenido */}
      <main className="flex-1 p-6 max-w-4xl w-full mx-auto space-y-6">

        {/* Tabs */}
        <div className="bg-white border border-slate-200 rounded-2xl p-1.5 flex gap-1 shadow-xs w-fit">
          {[
            { id: 'perfil' as TabConfigType, label: 'Mi Perfil', icon: 'person' },
            { id: 'guia' as TabConfigType, label: 'Guía del Torneo', icon: 'help' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTabActiva(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                tabActiva === tab.id
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
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
            <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col items-center gap-4 shadow-xs text-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center">
                <span className="text-3xl font-black text-primary">{inicialUsuario}</span>
              </div>
              <div>
                <p className="font-extrabold text-slate-900 text-sm">{usuario.name}</p>
                <p className="text-xs text-slate-400 mt-0.5">{usuario.email}</p>
              </div>
              <div className="w-full pt-3 border-t border-slate-100 space-y-2 text-left">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-semibold">Rol</span>
                  <span className="font-bold text-slate-700 capitalize">{usuario.roles?.[0]?.replace('_', ' ') || '—'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-semibold">DNI</span>
                  <span className="font-bold text-slate-700">{usuario.dni || '—'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-semibold">Teléfono</span>
                  <span className="font-bold text-slate-700">{usuario.phone || '—'}</span>
                </div>
              </div>
            </div>

            {/* Formulario de edición */}
            <div className="md:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-sm font-extrabold text-slate-900">Editar Información Personal</h2>
                <p className="text-xs text-slate-400 mt-1">Los cambios se reflejan inmediatamente en el sistema.</p>
              </div>

              {exitoPerfil && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  {exitoPerfil}
                </div>
              )}
              {errorPerfil && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">error</span>
                  {errorPerfil}
                </div>
              )}

              <form onSubmit={guardarPerfil} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Nombre Completo *</label>
                  <input
                    type="text" required placeholder="Tu nombre completo"
                    value={datosPerfil.name}
                    onChange={(e) => setDatosPerfil({ ...datosPerfil, name: e.target.value })}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden focus:border-primary focus:ring-1 focus:ring-primary bg-white text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">DNI / Documento</label>
                    <input
                      type="text" placeholder="Ej: 12345678"
                      value={datosPerfil.dni}
                      onChange={(e) => setDatosPerfil({ ...datosPerfil, dni: e.target.value })}
                      className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden focus:border-primary bg-white text-slate-800"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">Teléfono</label>
                    <input
                      type="text" placeholder="Ej: 987654321"
                      value={datosPerfil.phone}
                      onChange={(e) => setDatosPerfil({ ...datosPerfil, phone: e.target.value })}
                      className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden focus:border-primary bg-white text-slate-800"
                    />
                  </div>
                </div>

                {/* Sección contraseña */}
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <div>
                    <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Cambiar Contraseña</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Deja en blanco si no deseas cambiarla.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 block">Nueva Contraseña</label>
                      <input
                        type="password" placeholder="Mínimo 8 caracteres"
                        value={datosPerfil.password}
                        onChange={(e) => setDatosPerfil({ ...datosPerfil, password: e.target.value })}
                        className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden focus:border-primary bg-white text-slate-800"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 block">Confirmar Contraseña</label>
                      <input
                        type="password" placeholder="Repite la contraseña"
                        value={datosPerfil.password_confirmation}
                        onChange={(e) => setDatosPerfil({ ...datosPerfil, password_confirmation: e.target.value })}
                        className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden focus:border-primary bg-white text-slate-800"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={guardandoPerfil}
                  className="w-full bg-primary hover:bg-primary-container text-white py-2.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
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
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
              <div className="border-b border-slate-100 pb-4 mb-6">
                <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-base">help</span>
                  Guía del Ciclo de Vida del Torneo
                </h2>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Sigue esta secuencia de pasos para configurar y gestionar tu campeonato correctamente de principio a fin.
                </p>
              </div>

              <div className="space-y-3">
                {PASOS_TORNEO.map((paso) => (
                  <div key={paso.step} className="flex gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                    <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${paso.color}`}>
                      <span className="material-symbols-outlined text-base">{paso.icon}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Paso {paso.step}</span>
                      </div>
                      <h3 className="text-sm font-extrabold text-slate-900 leading-none mb-1.5">{paso.title}</h3>
                      <p className="text-xs text-slate-500 leading-relaxed font-medium">{paso.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold">¿Tienes problemas? Escríbenos.</span>
                <a href="mailto:soporte@ligacenter.com" className="text-primary font-bold hover:underline">
                  soporte@ligacenter.com
                </a>
              </div>
            </div>
          </div>
        )}

      </main>

      <footer className="mt-auto bg-white border-t border-slate-200 py-5 text-center text-xs text-slate-400">
        © 2026 LigaCenter — Gestión de campeonatos deportivos, Arequipa, Perú.
      </footer>
    </div>
  );
};
