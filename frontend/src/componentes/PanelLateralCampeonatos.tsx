import React, { useEffect, useState } from 'react';
import { useAutenticacion } from '../contexto/ContextoAutenticacion';
import { useCampeonato } from '../contexto/ContextoCampeonato';
import { serviciosCampeonatos, type Campeonato } from '../servicios/api';
import { sileo } from 'sileo';

export const PanelLateralCampeonatos: React.FC = () => {
  const { usuario } = useAutenticacion();
  const { 
    campeonatoActivo, 
    seleccionarCampeonato, 
    panelCampeonatosAbierto, 
    setPanelCampeonatosAbierto 
  } = useCampeonato();

  const [campeonatos, setCampeonatos] = useState<Campeonato[]>([]);
  const [cargando, setCargando] = useState(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroAnio, setFiltroAnio] = useState<string>('');

  const [mostrarCreador, setMostrarCreador] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoTipo, setNuevoTipo] = useState<'basico' | 'completo'>('basico');
  const [nuevoReglamento, setNuevoReglamento] = useState<File | null>(null);
  const [creando, setCreando] = useState(false);
  const [nuevoEsPublico, setNuevoEsPublico] = useState(false);

  const currentYear = new Date().getFullYear();

  useEffect(() => {
    if (panelCampeonatosAbierto && usuario) {
      cargarCampeonatos();
      setMostrarCreador(false);
      setNuevoNombre('');
      setNuevoTipo('basico');
      setNuevoReglamento(null);
      setErrorLocal(null);
      setBusqueda('');
      setNuevoEsPublico(false);
      // Establecer año actual como predeterminado
      setFiltroAnio(currentYear.toString());
    }
  }, [panelCampeonatosAbierto, usuario]);

  useEffect(() => {
    if (panelCampeonatosAbierto) {
      document.body.classList.add('panel-campeonatos-abierto');
    } else {
      document.body.classList.remove('panel-campeonatos-abierto');
    }
    return () => {
      document.body.classList.remove('panel-campeonatos-abierto');
    };
  }, [panelCampeonatosAbierto]);

  const cargarCampeonatos = async () => {
    setCargando(true);
    setErrorLocal(null);
    try {
      const res = await serviciosCampeonatos.obtenerCampeonatos();
      if (res.success) {
        setCampeonatos(res.data);
      } else {
        setErrorLocal('Error al cargar campeonatos.');
      }
    } catch (err) {
      setErrorLocal('Error de conexión.');
    } finally {
      setCargando(false);
    }
  };

  const manejarCrearCampeonato = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombre.trim()) return;
    setCreando(true);
    setErrorLocal(null);
    try {
      const formData = new FormData();
      formData.append('name', nuevoNombre.trim());
      formData.append('type', nuevoTipo);
      formData.append('is_public', nuevoEsPublico ? '1' : '0');
      if (nuevoReglamento) {
        formData.append('rules_pdf', nuevoReglamento);
      }

      const res = await serviciosCampeonatos.crearCampeonato(formData);
      if (res.success) {
        setNuevoNombre('');
        setNuevoReglamento(null);
        setMostrarCreador(false);
        sileo.success({
          title: 'Campeonato Creado',
          description: 'El nuevo campeonato se ha registrado correctamente.'
        });
        await cargarCampeonatos();
        seleccionarCampeonato(res.data);
      } else {
        setErrorLocal(res.message || 'Error al registrar campeonato.');
      }
    } catch (err) {
      setErrorLocal('Error al registrar campeonato.');
    } finally {
      setCreando(false);
    }
  };

  const handleSeleccionar = (camp: Campeonato) => {
    seleccionarCampeonato(camp);
    sileo.success({
      title: 'Campeonato Seleccionado',
      description: `Ahora estás gestionando: ${camp.name}`
    });
    setPanelCampeonatosAbierto(false);
  };

  const extractYearFromDate = (dateStr: string | null | undefined): number | null => {
    if (!dateStr) return null;
    const year = new Date(dateStr).getFullYear();
    return isNaN(year) ? null : year;
  };

  const getAvailableYears = (): number[] => {
    const years = new Set<number>();
    // Siempre incluir el año actual
    years.add(currentYear);
    campeonatos.forEach(c => {
      const year = extractYearFromDate(c.start_date);
      if (year) {
        years.add(year);
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  };

  const filteredChampionships = campeonatos.filter(c => {
    const coincideNombre = c.name.toLowerCase().includes(busqueda.toLowerCase());
    const anioCampeonato = extractYearFromDate(c.start_date);
    const coincideAnio = filtroAnio === 'todos' || (anioCampeonato && anioCampeonato.toString() === filtroAnio);
    
    // LOG PARA DEPURACIÓN
    console.log('Campeonato:', c.name, 'start_date:', c.start_date, 'año extraído:', anioCampeonato, 'filtro:', filtroAnio, 'coincide:', coincideAnio);
    
    return coincideNombre && coincideAnio;
  });

  const availableYears = getAvailableYears();

  return (
    <>
      <div 
        className={`fixed inset-0 z-45 bg-[#07080c]/60 backdrop-blur-xs transition-opacity duration-300 pointer-events-none lg:hidden ${
          panelCampeonatosAbierto ? 'opacity-100 pointer-events-auto' : 'opacity-0'
        }`}
        onClick={() => setPanelCampeonatosAbierto(false)}
      />

      <aside 
        className={`fixed right-0 top-0 bottom-0 z-35 w-full lg:w-[384px] bg-[#0c0e16] border-l border-slate-800 shadow-2xl transition-transform duration-300 ease-out transform flex flex-col ${
          panelCampeonatosAbierto ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 h-16 border-b border-slate-800 shrink-0">
          <div>
            <h3 className="font-extrabold text-sm text-white uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-indigo-400 text-base">sports_soccer</span>
              Gestionar Campeonatos
            </h3>
            <p className="text-[11px] text-slate-500 font-semibold tracking-wide leading-none mt-1">
              Cambia el torneo actual o registra uno nuevo
            </p>
          </div>
          
          <button
            onClick={() => setPanelCampeonatosAbierto(false)}
            className="w-7 h-7 rounded-lg border border-slate-800 text-slate-400 hover:bg-[#171a26] hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {errorLocal && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-450 text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-sm shrink-0">error</span>
              <span className="font-semibold">{errorLocal}</span>
            </div>
          )}

          <div className="space-y-2">
            {!mostrarCreador ? (
              <button
                onClick={() => setMostrarCreador(true)}
                className="w-full py-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 hover:border-indigo-500/40 text-indigo-400 font-extrabold text-xs uppercase rounded-xl tracking-wider cursor-pointer flex items-center justify-center gap-1.5 transition-all"
              >
                <span className="material-symbols-outlined text-xs font-bold">add</span>
                Registrar Nuevo Campeonato
              </button>
            ) : (
              <form onSubmit={manejarCrearCampeonato} className="border border-indigo-500/25 bg-[#171a26]/40 p-4.5 rounded-2xl space-y-3.5 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                  <span className="text-xs font-black text-indigo-400 uppercase tracking-wider">Nuevo Campeonato</span>
                  <button 
                    type="button" 
                    onClick={() => setMostrarCreador(false)} 
                    className="text-xs font-black text-slate-500 hover:text-slate-350 uppercase tracking-wider cursor-pointer bg-transparent border-0"
                  >
                    Ocultar
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-350 block">Nombre del Campeonato *</label>
                  <input
                    type="text" required placeholder="Ej: Torneo Inter-Facultades 2026"
                    value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)}
                    className="w-full text-xs border border-slate-800 bg-[#11131c] text-white rounded-lg p-2.5 outline-none focus:border-indigo-500/50 transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-350 block">Formato *</label>
                  <div className="grid grid-cols-2 gap-2">
                    <label className={`p-2 rounded-lg border text-center cursor-pointer transition-all flex flex-col gap-0.5 ${
                      nuevoTipo === 'basico' ? 'border-indigo-500 bg-indigo-500/5' : 'border-slate-850 bg-[#11131c] hover:bg-[#1a1d2a]'
                    }`}>
                      <input
                        type="radio" name="lateral_tipo_camp" checked={nuevoTipo === 'basico'}
                        onChange={() => setNuevoTipo('basico')} className="sr-only"
                      />
                      <span className="text-xs font-extrabold text-white uppercase">Básico</span>
                      <span className="text-[10px] text-slate-500 leading-none">Fixture rápido</span>
                    </label>
                    <label className={`p-2 rounded-lg border text-center cursor-pointer transition-all flex flex-col gap-0.5 ${
                      nuevoTipo === 'completo' ? 'border-indigo-500 bg-indigo-500/5' : 'border-slate-855 bg-[#11131c] hover:bg-[#1a1d2a]'
                    }`}>
                      <input
                        type="radio" name="lateral_tipo_camp" checked={nuevoTipo === 'completo'}
                        onChange={() => setNuevoTipo('completo')} className="sr-only"
                      />
                      <span className="text-xs font-extrabold text-white uppercase">Completo</span>
                      <span className="text-[10px] text-slate-500 leading-none">Multi-disciplina</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-350 block">Reglamento (PDF - Opcional)</label>
                  <input
                    type="file" accept=".pdf"
                    onChange={(e) => setNuevoReglamento(e.target.files?.[0] || null)}
                    className="w-full text-xs text-slate-400 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-[10px] file:font-black file:bg-indigo-500/10 file:text-indigo-400 file:hover:bg-indigo-500/20 file:cursor-pointer outline-none bg-[#11131c] border border-slate-850 p-1.5 rounded-lg"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-350 block">Visibilidad</label>
                  <div className="grid grid-cols-2 gap-2">
                    <label className={`p-2 rounded-lg border text-center cursor-pointer transition-all flex flex-col gap-0.5 ${
                      !nuevoEsPublico ? 'border-indigo-500 bg-indigo-500/5' : 'border-slate-850 bg-[#11131c] hover:bg-[#1a1d2a]'
                    }`}>
                      <input
                        type="radio" name="lateral_visibilidad_camp" checked={!nuevoEsPublico}
                        onChange={() => setNuevoEsPublico(false)} className="sr-only"
                      />
                      <span className="text-xs font-extrabold text-white uppercase flex items-center justify-center gap-1">
                        <span className="material-symbols-outlined text-sm">lock</span>
                        Privado
                      </span>
                      <span className="text-[10px] text-slate-500 leading-none">Solo tú lo ves</span>
                    </label>
                    <label className={`p-2 rounded-lg border text-center cursor-pointer transition-all flex flex-col gap-0.5 ${
                      nuevoEsPublico ? 'border-indigo-500 bg-indigo-500/5' : 'border-slate-850 bg-[#11131c] hover:bg-[#1a1d2a]'
                    }`}>
                      <input
                        type="radio" name="lateral_visibilidad_camp" checked={nuevoEsPublico}
                        onChange={() => setNuevoEsPublico(true)} className="sr-only"
                      />
                      <span className="text-xs font-extrabold text-white uppercase flex items-center justify-center gap-1">
                        <span className="material-symbols-outlined text-sm">public</span>
                        Público
                      </span>
                      <span className="text-[10px] text-slate-500 leading-none">Visible sin login</span>
                    </label>
                  </div>
                </div>

                <button
                  type="submit" disabled={creando}
                  className="w-full py-2 bg-indigo-650 hover:bg-indigo-600 disabled:bg-indigo-800 text-white font-extrabold text-xs uppercase rounded-xl tracking-wider cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {creando ? 'Creando...' : 'Crear e Ingresar'}
                </button>
              </form>
            )}
          </div>

          <div className="space-y-3">
            <div className="relative">
              <input
                type="text" placeholder="Buscar campeonato..."
                value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                className="w-full bg-[#11131c] border border-slate-800 text-slate-200 text-xs rounded-xl !pl-12 pr-3 py-2.5 outline-none focus:border-indigo-500/50 transition-colors font-semibold"
              />
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm">search</span>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0">Temporada:</label>
              <div className="relative flex-1">
                <select
                  value={filtroAnio}
                  onChange={(e) => setFiltroAnio(e.target.value)}
                  className="w-full appearance-none bg-[#11131c] border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none focus:border-indigo-500/50 transition-colors font-semibold cursor-pointer"
                >
                  <option value="todos">Todos los años</option>
                  {availableYears.map(year => (
                    <option key={year} value={year.toString()}>{year}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 text-sm pointer-events-none">
                  expand_more
                </span>
              </div>
            </div>

            {filtroAnio !== 'todos' && (
              <button
                type="button"
                onClick={() => setFiltroAnio('todos')}
                className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 cursor-pointer"
              >
                Limpiar filtro
              </button>
            )}

            <div className="space-y-2">
              {cargando ? (
                <div className="py-8 flex flex-col items-center justify-center gap-2">
                  <div className="w-5 h-5 rounded-full border-2 border-slate-800 border-t-indigo-500 animate-spin" />
                  <span className="text-xs text-slate-500 font-extrabold uppercase tracking-widest">Cargando...</span>
                </div>
              ) : filteredChampionships.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs font-semibold italic">
                  No se encontraron campeonatos
                </div>
              ) : (
                filteredChampionships.map((c) => {
                  const esActivo = campeonatoActivo?.id === c.id;
                  const anio = extractYearFromDate(c.start_date);
                  return (
                    <div
                      key={c.id}
                      onClick={() => handleSeleccionar(c)}
                      className={`p-3.5 border rounded-xl transition-all flex items-center justify-between cursor-pointer select-none group ${
                        esActivo 
                          ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' 
                          : 'border-slate-850 bg-[#171a26]/40 hover:border-slate-700 hover:bg-[#1c1f2e]'
                      }`}
                    >
                      <div className="min-w-0 pr-3 space-y-1">
                        <h4 className={`font-extrabold text-xs group-hover:text-indigo-400 transition-colors truncate ${esActivo ? 'text-indigo-400' : 'text-white'}`}>
                          {c.name}
                        </h4>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-1.5 py-0.5 rounded-sm bg-[#11131c] border border-slate-850 text-slate-500 text-[10px] font-extrabold uppercase tracking-wide">
                            {c.type === 'completo' ? 'Completo' : 'Básico'}
                          </span>
                          <span className="px-1.5 py-0.5 rounded-sm bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 text-[10px] font-extrabold uppercase tracking-wide">
                            {c.status}
                          </span>
                          {anio && (
                            <span className="px-1.5 py-0.5 rounded-sm bg-slate-800/50 border border-slate-700 text-slate-400 text-[10px] font-extrabold">
                              {anio}
                            </span>
                          )}
                        </div>
                      </div>

                      {esActivo ? (
                        <span className="px-2.5 py-1 bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 font-extrabold text-[10px] uppercase rounded-lg tracking-wider shrink-0 select-none">
                          Activo
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSeleccionar(c);
                          }}
                          className="bg-[#171a26] hover:bg-indigo-650 border border-slate-800 text-slate-355 hover:text-white font-extrabold text-[10px] px-2.5 py-1 rounded-lg cursor-pointer transition-all uppercase shrink-0"
                        >
                          Seleccionar
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};