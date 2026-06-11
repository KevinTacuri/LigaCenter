import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAutenticacion } from '../contexto/ContextoAutenticacion';
import { useCampeonato } from '../contexto/ContextoCampeonato';
import { serviciosCampeonatos, type Campeonato } from '../servicios/api';
import logoImg from '../assets/logo.svg';

export const SeleccionCampeonato: React.FC = () => {
  const { usuario, cerrarSesion, tieneRol } = useAutenticacion();
  const { seleccionarCampeonato, campeonatoActivo } = useCampeonato();
  const navegar = useNavigate();

  const [campeonatos, setCampeonatos] = useState<Campeonato[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  // Formulario de creación
  const [mostrarCreador, setMostrarCreador] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoTipo, setNuevoTipo] = useState<'basico' | 'completo'>('basico');

  useEffect(() => {
    if (!usuario) {
      navegar('/login');
      return;
    }
    if (tieneRol('administrador')) {
      navegar('/tablero');
      return;
    }
    if (campeonatoActivo) {
      navegar('/tablero');
      return;
    }
    cargarCampeonatos();
  }, [usuario, campeonatoActivo]);

  const cargarCampeonatos = async () => {
    setCargando(true);
    setErrorLocal(null);
    try {
      const res = await serviciosCampeonatos.obtenerCampeonatos();
      if (res.success) {
        setCampeonatos(res.data);
      }
    } catch (err) {
      setErrorLocal('Error al obtener tus campeonatos.');
    } finally {
      setCargando(false);
    }
  };

  const handleSeleccionar = (camp: Campeonato) => {
    seleccionarCampeonato(camp);
    navegar('/tablero');
  };

  const manejarCrearCampeonato = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombre.trim()) return;
    setErrorLocal(null);
    try {
      const res = await serviciosCampeonatos.crearCampeonato({
        name: nuevoNombre,
        type: nuevoTipo
      });
      if (res.success) {
        setNuevoNombre('');
        setMostrarCreador(false);
        // Recargar lista y seleccionar el creado
        await cargarCampeonatos();
        handleSeleccionar(res.data);
      }
    } catch (err) {
      setErrorLocal('Error al registrar campeonato.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0b10] text-slate-100 font-sans flex flex-col justify-between">
      {/* Cabecera sutil */}
      <header className="bg-[#11131c] border-b border-slate-900 px-6 py-4 flex justify-between items-center shadow-xs">
        <div className="flex items-center gap-2">
          <img src={logoImg} className="w-8 h-8 object-contain" alt="LigaCenter" />
          <h1 className="text-base font-black text-white tracking-tight">LigaCenter SaaS</h1>
        </div>
        <button
          onClick={cerrarSesion}
          className="text-xs font-bold text-rose-400 hover:bg-rose-950/20 border border-rose-950/30 px-3 py-1.5 rounded-lg cursor-pointer transition-all"
        >
          Cerrar Sesión
        </button>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 max-w-4xl w-full mx-auto">
        <div className="text-center mb-8 space-y-2">
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            Hola, <span className="text-indigo-400">{usuario?.name}</span>
          </h2>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Por favor, selecciona un campeonato activo para ingresar a tu mesa de control, o crea uno nuevo para empezar a gestionar tus ligas.
          </p>
        </div>

        {errorLocal && (
          <div className="w-full max-w-lg mb-4 p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">error</span>
            <span>{errorLocal}</span>
          </div>
        )}

        {/* Creador Modal / Caja superior */}
        {mostrarCreador ? (
          <div className="w-full max-w-lg bg-[#11131c] border border-slate-900 rounded-2xl p-6 shadow-sm space-y-4 mb-6 animate-fadeIn">
            <div className="flex justify-between items-center border-b border-slate-900 pb-2">
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-white">Nuevo Campeonato</h3>
              <button onClick={() => setMostrarCreador(false)} className="text-xs text-slate-400 hover:text-white cursor-pointer">Cancelar</button>
            </div>
            <form onSubmit={manejarCrearCampeonato} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 block">Nombre del Campeonato *</label>
                <input
                  type="text" required placeholder="Ej: Torneo Clausura Colegio de Ingenieros"
                  value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)}
                  className="w-full text-sm border border-slate-800 bg-[#171a26] text-white rounded-lg p-2.5 outline-hidden"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 block">Formato / Tipo de Gestión *</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`p-4 rounded-xl border flex flex-col gap-1 cursor-pointer transition-all ${
                    nuevoTipo === 'basico' ? 'border-indigo-500 bg-indigo-500/5' : 'border-slate-800 hover:bg-[#171a26]'
                  }`}>
                    <input
                      type="radio" name="tipo_camp" checked={nuevoTipo === 'basico'}
                      onChange={() => setNuevoTipo('basico')} className="sr-only"
                    />
                    <span className="text-xs font-extrabold text-white uppercase">Básico</span>
                    <span className="text-[10px] text-slate-450">Fixture rápido, resultados y marcadores sencillos.</span>
                  </label>
                  <label className={`p-4 rounded-xl border flex flex-col gap-1 cursor-pointer transition-all ${
                    nuevoTipo === 'completo' ? 'border-indigo-500 bg-indigo-500/5' : 'border-slate-800 hover:bg-[#171a26]'
                  }`}>
                    <input
                      type="radio" name="tipo_camp" checked={nuevoTipo === 'completo'}
                      onChange={() => setNuevoTipo('completo')} className="sr-only"
                    />
                    <span className="text-xs font-extrabold text-white uppercase">Completo</span>
                    <span className="text-[10px] text-slate-455">Múltiples disciplinas, incidencias detalladas, sanciones y goleadores.</span>
                  </label>
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-lg text-xs tracking-wider uppercase cursor-pointer transition-all"
              >
                Crear e Ingresar
              </button>
            </form>
          </div>
        ) : (
          <div className="w-full max-w-lg mb-6 flex justify-end">
            <button
              onClick={() => setMostrarCreador(true)}
              className="bg-indigo-650 hover:bg-indigo-600 text-white font-bold text-xs uppercase px-4 py-2.5 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
            >
              <span className="material-symbols-outlined text-sm font-bold">add</span>
              Crear Nuevo Campeonato
            </button>
          </div>
        )}

        {/* Listado de campeonatos */}
        <div className="w-full max-w-lg grid grid-cols-1 gap-4">
          {cargando ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 rounded-full border-4 border-slate-800 border-t-indigo-500 animate-spin" />
              <span className="text-xs text-slate-450 font-bold uppercase tracking-widest">Cargando tus campeonatos...</span>
            </div>
          ) : campeonatos.length === 0 ? (
            <div className="bg-[#11131c] border border-slate-900 rounded-2xl p-12 text-center text-slate-400 shadow-xs">
              <span className="material-symbols-outlined text-4xl text-slate-600 mb-2">sports_soccer</span>
              <p className="text-sm font-semibold">Aún no tienes campeonatos creados.</p>
              <p className="text-xs text-slate-450 mt-1">Haz clic en "Crear Nuevo Campeonato" para iniciar tu espacio de gestión.</p>
            </div>
          ) : (
            campeonatos.map((c) => (
              <div
                key={c.id}
                className="bg-[#11131c] border border-slate-900 rounded-2xl p-5 hover:border-indigo-500/80 transition-all flex justify-between items-center shadow-xs hover:shadow-sm"
              >
                <div className="space-y-1">
                  <h3 className="font-extrabold text-sm text-white">{c.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-sm bg-[#171a26] border border-slate-800 text-slate-350 text-[8px] font-bold uppercase tracking-wider">
                      Modo: {c.type === 'completo' ? 'Completo (Colegio de Ing.)' : 'Básico'}
                    </span>
                    <span className="px-2 py-0.5 rounded-sm bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 text-[8px] font-bold uppercase tracking-wider">
                      {c.status}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleSeleccionar(c)}
                  className="bg-indigo-650 hover:bg-indigo-600 text-white font-bold text-xs px-4 py-2 rounded-lg cursor-pointer transition-all shadow-xs"
                >
                  Ingresar
                </button>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Pie de página */}
      <footer className="bg-[#11131c] border-t border-slate-900 py-4 text-center text-[10px] text-slate-450">
        &copy; 2026 LigaCenter SaaS. Todos los derechos reservados.
      </footer>
    </div>
  );
};
