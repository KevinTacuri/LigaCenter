import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAutenticacion } from '../contexto/ContextoAutenticacion';
import { useCampeonato } from '../contexto/ContextoCampeonato';
import { serviciosCampeonatos, type Campeonato } from '../servicios/api';
import logoImg from '../assets/logo.svg';

export const SeleccionCampeonato: React.FC = () => {
  const { usuario, cerrarSesion } = useAutenticacion();
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
    <div className="min-h-screen bg-[#f4f6f7] text-slate-800 font-sans flex flex-col justify-between">
      {/* Cabecera sutil */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-xs">
        <div className="flex items-center gap-2">
          <img src={logoImg} className="w-8 h-8 object-contain" alt="LigaCenter" />
          <h1 className="text-base font-black text-slate-900 tracking-tight">LigaCenter SaaS</h1>
        </div>
        <button
          onClick={cerrarSesion}
          className="text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg cursor-pointer transition-all"
        >
          Cerrar Sesión
        </button>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 max-w-4xl w-full mx-auto">
        <div className="text-center mb-8 space-y-2">
          <h2 className="text-2xl md:text-3xl font-black text-slate-950 tracking-tight">
            Hola, <span className="text-primary">{usuario?.name}</span>
          </h2>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            Por favor, selecciona un campeonato activo para ingresar a tu mesa de control, o crea uno nuevo para empezar a gestionar tus ligas.
          </p>
        </div>

        {errorLocal && (
          <div className="w-full max-w-lg mb-4 p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">error</span>
            <span>{errorLocal}</span>
          </div>
        )}

        {/* Creador Modal / Caja superior */}
        {mostrarCreador ? (
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 mb-6 animate-fadeIn">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-950">Nuevo Campeonato</h3>
              <button onClick={() => setMostrarCreador(false)} className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer">Cancelar</button>
            </div>
            <form onSubmit={manejarCrearCampeonato} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Nombre del Campeonato *</label>
                <input
                  type="text" required placeholder="Ej: Torneo Clausura Colegio de Ingenieros"
                  value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-hidden"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Formato / Tipo de Gestión *</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`p-4 rounded-xl border flex flex-col gap-1 cursor-pointer transition-all ${
                    nuevoTipo === 'basico' ? 'border-primary bg-primary/2' : 'border-slate-200 hover:bg-slate-50'
                  }`}>
                    <input
                      type="radio" name="tipo_camp" checked={nuevoTipo === 'basico'}
                      onChange={() => setNuevoTipo('basico')} className="sr-only"
                    />
                    <span className="text-xs font-extrabold text-slate-900 uppercase">Básico</span>
                    <span className="text-[10px] text-slate-500">Fixture rápido, resultados y marcadores sencillos.</span>
                  </label>
                  <label className={`p-4 rounded-xl border flex flex-col gap-1 cursor-pointer transition-all ${
                    nuevoTipo === 'completo' ? 'border-primary bg-primary/2' : 'border-slate-200 hover:bg-slate-50'
                  }`}>
                    <input
                      type="radio" name="tipo_camp" checked={nuevoTipo === 'completo'}
                      onChange={() => setNuevoTipo('completo')} className="sr-only"
                    />
                    <span className="text-xs font-extrabold text-slate-900 uppercase">Completo</span>
                    <span className="text-[10px] text-slate-500">Múltiples disciplinas, incidencias detalladas, sanciones y goleadores.</span>
                  </label>
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-primary hover:bg-primary-container text-white font-bold py-2.5 rounded-lg text-xs tracking-wider uppercase cursor-pointer transition-all"
              >
                Crear e Ingresar
              </button>
            </form>
          </div>
        ) : (
          <div className="w-full max-w-lg mb-6 flex justify-end">
            <button
              onClick={() => setMostrarCreador(true)}
              className="bg-primary hover:bg-primary-container text-white font-bold text-xs uppercase px-4 py-2.5 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
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
              <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-primary animate-spin" />
              <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">Cargando tus campeonatos...</span>
            </div>
          ) : campeonatos.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 shadow-xs">
              <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">sports_soccer</span>
              <p className="text-sm font-semibold">Aún no tienes campeonatos creados.</p>
              <p className="text-xs text-slate-400 mt-1">Haz clic en "Crear Nuevo Campeonato" para iniciar tu espacio de gestión.</p>
            </div>
          ) : (
            campeonatos.map((c) => (
              <div
                key={c.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-primary/50 transition-all flex justify-between items-center shadow-xs hover:shadow-sm"
              >
                <div className="space-y-1">
                  <h3 className="font-extrabold text-sm text-slate-900">{c.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-sm bg-slate-100 border border-slate-200 text-slate-600 text-[8px] font-bold uppercase tracking-wider">
                      Modo: {c.type === 'completo' ? 'Completo (Colegio de Ing.)' : 'Básico'}
                    </span>
                    <span className="px-2 py-0.5 rounded-sm bg-emerald-50 border border-emerald-200 text-emerald-700 text-[8px] font-bold uppercase tracking-wider">
                      {c.status}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleSeleccionar(c)}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-lg cursor-pointer transition-all shadow-xs"
                >
                  Ingresar
                </button>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Pie de página */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-[10px] text-slate-400">
        &copy; 2026 LigaCenter SaaS. Todos los derechos reservados.
      </footer>
    </div>
  );
};
