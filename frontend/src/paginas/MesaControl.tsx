import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAutenticacion } from '../contexto/ContextoAutenticacion';
import {
  serviciosFixture,
  serviciosResultados,
  serviciosParticipantes
} from '../servicios/api';
import type {
  Partido,
  ActaPartido,
  Incidencia,
  Jugador
} from '../servicios/api';

export const MesaControl: React.FC = () => {
  const { tienePermiso } = useAutenticacion();
  const navegar = useNavigate();

  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [partidoSeleccionado, setPartidoSeleccionado] = useState<Partido | null>(null);
  const [acta, setActa] = useState<ActaPartido | null>(null);
  const [incidencias, setIncidencias] = useState<Incidencia[]>([]);
  const [jugadoresLocal, setJugadoresLocal] = useState<Jugador[]>([]);
  const [jugadoresVisita, setJugadoresVisita] = useState<Jugador[]>([]);

  const [cargando, setCargando] = useState(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  // Campos de formulario del acta
  const [golesLocal, setGolesLocal] = useState('0');
  const [golesVisita, setGolesVisita] = useState('0');
  const [firmaArbitro, setFirmaArbitro] = useState('');
  const [firmaDelegado, setFirmaDelegado] = useState('');
  const [observaciones, setObservaciones] = useState('');

  // Formulario de nueva incidencia
  const [nuevaIncidencia, setNuevaIncidencia] = useState({
    team_id: '',
    player_id: '',
    incidence_type: 'goal',
    minute: '1',
    description: ''
  });

  useEffect(() => {
    if (!tienePermiso('registrar_incidencias')) {
      navegar('/tablero');
    } else {
      cargarPartidos();
    }
  }, []);

  const cargarPartidos = async () => {
    setCargando(true);
    try {
      const res = await serviciosFixture.obtenerPartidos();
      if (res.success) {
        setPartidos(res.data);
      }
    } catch (err) {
      setErrorLocal('Error al cargar partidos.');
    } finally {
      setCargando(false);
    }
  };

  const seleccionarPartido = async (partido: Partido) => {
    setErrorLocal(null);
    setMensajeExito(null);
    setPartidoSeleccionado(partido);
    setActa(null);
    setIncidencias([]);
    
    // Inicializar campos
    setGolesLocal('0');
    setGolesVisita('0');
    setFirmaArbitro('');
    setFirmaDelegado('');
    setObservaciones('');

    try {
      // Cargar jugadores de ambos equipos para asociarlos a incidencias
      const resJugadores = await serviciosParticipantes.obtenerJugadores();
      if (resJugadores.success) {
        setJugadoresLocal(resJugadores.data.filter((j) => j.team_id === partido.local_team_id));
        setJugadoresVisita(resJugadores.data.filter((j) => j.team_id === partido.visitor_team_id));
      }

      // Cargar acta si ya existe
      const resActa = await serviciosResultados.obtenerActaPorPartido(partido.id);
      if (resActa.success && resActa.data) {
        const a = resActa.data;
        setActa(a);
        setGolesLocal(a.local_score.toString());
        setGolesVisita(a.visitor_score.toString());
        setFirmaArbitro(a.referee_signature || '');
        setFirmaDelegado(a.delegate_signature || '');
        setObservaciones(a.observations || '');
      }
    } catch (err) {
      // Si da 404 es porque no existe acta, es normal.
    }

    // Cargar incidencias del partido
    if (partido.incidences) {
      setIncidencias(partido.incidences);
    }
  };

  const mostrarMensaje = (msg: string, esError: boolean = false) => {
    if (esError) {
      setErrorLocal(msg);
      setTimeout(() => setErrorLocal(null), 4000);
    } else {
      setMensajeExito(msg);
      setTimeout(() => setMensajeExito(null), 3000);
    }
  };

  const guardarProgresoActa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partidoSeleccionado) return;
    try {
      const res = await serviciosResultados.registrarActa({
        match_id: partidoSeleccionado.id,
        local_score: parseInt(golesLocal),
        visitor_score: parseInt(golesVisita),
        referee_signature: firmaArbitro || undefined,
        delegate_signature: firmaDelegado || undefined,
        observations: observaciones || undefined
      });
      if (res.success) {
        setActa(res.data);
        mostrarMensaje('Progreso de acta guardado exitosamente.');
      }
    } catch (err) {
      mostrarMensaje('Error al guardar acta de partido.', true);
    }
  };

  const bloquearActaFinal = async () => {
    if (!acta) {
      mostrarMensaje('Guarde el progreso del acta primero antes de bloquear.', true);
      return;
    }
    if (!window.confirm('¿Desea cerrar el acta? Esto es irreversible, recalculará la tabla y registrará las sanciones.')) return;
    try {
      const res = await serviciosResultados.bloquearActa(acta.id);
      if (res.success) {
        setActa(res.data);
        mostrarMensaje('Acta de partido bloqueada y finalizada. Tabla actualizada.');
        cargarPartidos();
        setPartidoSeleccionado(null);
      }
    } catch (err) {
      mostrarMensaje('Error al bloquear acta.', true);
    }
  };

  const guardarIncidencia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partidoSeleccionado || !nuevaIncidencia.team_id || !nuevaIncidencia.player_id) {
      mostrarMensaje('Complete los datos de la incidencia (Equipo y Jugador).', true);
      return;
    }
    try {
      const res = await serviciosResultados.registrarIncidencia({
        match_id: partidoSeleccionado.id,
        team_id: parseInt(nuevaIncidencia.team_id),
        player_id: parseInt(nuevaIncidencia.player_id),
        incidence_type: nuevaIncidencia.incidence_type,
        minute: parseInt(nuevaIncidencia.minute),
        description: nuevaIncidencia.description || undefined
      });
      if (res.success) {
        mostrarMensaje('Incidencia registrada.');
        setIncidencias((prev) => [...prev, res.data]);
        setNuevaIncidencia({
          team_id: '',
          player_id: '',
          incidence_type: 'goal',
          minute: '1',
          description: ''
        });
      }
    } catch (err) {
      mostrarMensaje('Error al registrar incidencia.', true);
    }
  };

  const eliminarIncidencia = async (id: number) => {
    if (!window.confirm('¿Desea quitar esta incidencia?')) return;
    try {
      const res = await serviciosResultados.eliminarIncidencia(id);
      if (res.success) {
        setIncidencias((prev) => prev.filter((i) => i.id !== id));
        mostrarMensaje('Incidencia eliminada.');
      }
    } catch (err) {
      mostrarMensaje('Error al quitar incidencia.', true);
    }
  };

  // Filtrar lista de jugadores según el equipo seleccionado en la nueva incidencia
  const jugadoresDisponiblesIncidencia =
    nuevaIncidencia.team_id === partidoSeleccionado?.local_team_id.toString()
      ? jugadoresLocal
      : nuevaIncidencia.team_id === partidoSeleccionado?.visitor_team_id.toString()
      ? jugadoresVisita
      : [];

  return (
    <div className="min-h-screen bg-[#f4f6f7] text-slate-800 font-sans flex flex-col">
      {/* Cabecera */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navegar('/tablero')}
            className="w-10 h-10 rounded-lg flex items-center justify-center border border-slate-200 hover:bg-slate-50 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-slate-700">arrow_back</span>
          </button>
          <div>
            <h1 className="text-lg font-black text-slate-900 leading-none">Mesa de Control</h1>
            <span className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase mt-1 block">
              Registro de Resultados y Planillaje Oficial
            </span>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        
        {/* Toasts */}
        {mensajeExito && (
          <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">check_circle</span>
            <span>{mensajeExito}</span>
          </div>
        )}

        {errorLocal && (
          <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">error</span>
            <span>{errorLocal}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Columna Izquierda: Partidos Disponibles */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs h-fit space-y-4">
            <h2 className="font-extrabold text-sm uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2">Partidos Programados</h2>
            
            {cargando ? (
              <div className="py-6 text-center text-xs text-slate-500 font-bold animate-pulse">Cargando partidos...</div>
            ) : (
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {partidos.map((part) => (
                  <button
                    key={part.id}
                    onClick={() => seleccionarPartido(part)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-2 hover:border-primary/55 ${
                      partidoSeleccionado?.id === part.id
                        ? 'border-primary bg-primary/2'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase">
                      <span>Fecha {part.round}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] ${
                        part.status === 'finalizado' ? 'bg-slate-100 text-slate-500 border border-slate-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>{part.status}</span>
                    </div>
                    <div className="font-extrabold text-xs text-slate-900">
                      {part.local_team?.name} vs {part.visitor_team?.name}
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium">
                      {part.match_date ? new Date(part.match_date).toLocaleDateString() : 'N/A'} - {part.match_time || 'N/A'} ({part.venue?.name || 'N/A'})
                    </div>
                  </button>
                ))}
                {partidos.length === 0 && (
                  <div className="text-center py-6 text-xs text-slate-500">No hay partidos registrados.</div>
                )}
              </div>
            )}
          </div>

          {/* Columnas Derecha: Planillaje e Incidencias */}
          <div className="lg:col-span-2 space-y-6">
            
            {partidoSeleccionado ? (
              <>
                {/* 1. Scoreboard y Datos de Acta */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
                  <div className="border-b border-slate-100 pb-2 flex justify-between items-center">
                    <h2 className="font-extrabold text-sm uppercase tracking-wider text-slate-900">Acta de Partido Oficial</h2>
                    {acta?.is_locked && (
                      <span className="bg-rose-50 border border-rose-200 text-rose-700 font-bold px-2 py-0.5 rounded text-[9px] uppercase tracking-wider">Acta Cerrada</span>
                    )}
                  </div>

                  <form onSubmit={guardarProgresoActa} className="space-y-4">
                    {/* Scoreboard */}
                    <div className="grid grid-cols-3 gap-4 bg-slate-50 border border-slate-150 p-6 rounded-2xl items-center text-center">
                      <div className="font-extrabold text-sm text-slate-950">{partidoSeleccionado.local_team?.name}</div>
                      <div className="flex items-center justify-center gap-3">
                        <input
                          type="number" min="0" required disabled={acta?.is_locked}
                          value={golesLocal} onChange={(e) => setGolesLocal(e.target.value)}
                          className="w-12 text-center text-xl font-bold border border-slate-200 bg-white rounded-lg p-2 outline-hidden disabled:opacity-50"
                        />
                        <span className="font-black text-slate-400">-</span>
                        <input
                          type="number" min="0" required disabled={acta?.is_locked}
                          value={golesVisita} onChange={(e) => setGolesVisita(e.target.value)}
                          className="w-12 text-center text-xl font-bold border border-slate-200 bg-white rounded-lg p-2 outline-hidden disabled:opacity-50"
                        />
                      </div>
                      <div className="font-extrabold text-sm text-slate-950">{partidoSeleccionado.visitor_team?.name}</div>
                    </div>

                    {/* Signatures and Observations */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 block">Firma Árbitro Principal</label>
                        <input
                          type="text" placeholder="Firma / Nombre" disabled={acta?.is_locked}
                          value={firmaArbitro} onChange={(e) => setFirmaArbitro(e.target.value)}
                          className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 block">Firma Delegado de Mesa</label>
                        <input
                          type="text" placeholder="Firma / Nombre" disabled={acta?.is_locked}
                          value={firmaDelegado} onChange={(e) => setFirmaDelegado(e.target.value)}
                          className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">Observaciones del Encuentro</label>
                      <textarea
                        placeholder="Ej: Retraso por clima, incidencias fuera del campo..." disabled={acta?.is_locked}
                        value={observaciones} onChange={(e) => setObservaciones(e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded-lg p-2 min-h-[60px]"
                      />
                    </div>

                    {!acta?.is_locked && (
                      <div className="flex gap-3 pt-2">
                        <button type="submit" className="flex-1 bg-slate-800 hover:bg-slate-950 text-white font-bold py-2.5 rounded-lg text-xs cursor-pointer transition-all">
                          Guardar Marcador y Firmas
                        </button>
                        <button
                          type="button" onClick={bloquearActaFinal}
                          className="flex-1 bg-primary hover:bg-primary-container text-white font-bold py-2.5 rounded-lg text-xs cursor-pointer transition-all"
                        >
                          Cerrar y Bloquear Acta
                        </button>
                      </div>
                    )}
                  </form>
                </div>

                {/* 2. Incidencias */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
                  <h2 className="font-extrabold text-sm uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2">Incidencias del Partido (Goles, Tarjetas)</h2>

                  {!acta?.is_locked && (
                    <form onSubmit={guardarIncidencia} className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end bg-slate-50 border border-slate-150 p-4 rounded-xl">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-600 block uppercase">Equipo</label>
                        <select
                          required value={nuevaIncidencia.team_id}
                          onChange={(e) => setNuevaIncidencia({ ...nuevaIncidencia, team_id: e.target.value, player_id: '' })}
                          className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2"
                        >
                          <option value="">Seleccione Equipo</option>
                          <option value={partidoSeleccionado.local_team_id}>{partidoSeleccionado.local_team?.name}</option>
                          <option value={partidoSeleccionado.visitor_team_id}>{partidoSeleccionado.visitor_team?.name}</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-600 block uppercase">Jugador</label>
                        <select
                          required value={nuevaIncidencia.player_id}
                          onChange={(e) => setNuevaIncidencia({ ...nuevaIncidencia, player_id: e.target.value })}
                          className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2"
                          disabled={!nuevaIncidencia.team_id}
                        >
                          <option value="">Seleccione Jugador</option>
                          {jugadoresDisponiblesIncidencia.map((j) => (
                            <option key={j.id} value={j.id}>{j.name} (N° {j.number || 'N/A'})</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-600 block uppercase">Incidencia</label>
                        <select
                          value={nuevaIncidencia.incidence_type}
                          onChange={(e) => setNuevaIncidencia({ ...nuevaIncidencia, incidence_type: e.target.value })}
                          className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2"
                        >
                          <option value="goal">Gol</option>
                          <option value="yellow_card">Tarjeta Amarilla</option>
                          <option value="red_card">Tarjeta Roja</option>
                          <option value="foul">Falta</option>
                          <option value="injury">Lesión</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-600 block uppercase">Minuto</label>
                        <input
                          type="number" min="1" max="150" required
                          value={nuevaIncidencia.minute}
                          onChange={(e) => setNuevaIncidencia({ ...nuevaIncidencia, minute: e.target.value })}
                          className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white"
                        />
                      </div>

                      <button type="submit" className="bg-secondary text-white font-bold py-2 rounded-lg text-xs hover:brightness-105 cursor-pointer">
                        Registrar
                      </button>
                    </form>
                  )}

                  {/* Listado de incidencias registradas */}
                  <div className="space-y-2">
                    <h3 className="font-bold text-xs text-slate-600 uppercase tracking-wide">Eventos Registrados</h3>
                    {incidencias.length === 0 ? (
                      <p className="text-xs text-slate-500 italic p-4 text-center">No hay incidencias registradas en este encuentro.</p>
                    ) : (
                      <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                        {incidencias.map((i) => (
                          <div key={i.id} className="p-3 text-xs flex justify-between items-center hover:bg-slate-50/50">
                            <div>
                              <span className="font-bold text-secondary mr-2">{i.minute}'</span>
                              <span className="font-semibold text-slate-900">{i.player?.name}</span>
                              <span className="text-slate-400 mx-2">|</span>
                              <span className={`inline-flex px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                                i.incidence_type === 'goal' ? 'bg-emerald-50 text-emerald-700' :
                                i.incidence_type === 'yellow_card' ? 'bg-amber-50 text-amber-700' :
                                i.incidence_type === 'red_card' ? 'bg-rose-50 text-rose-700' : 'bg-slate-50 text-slate-600'
                              }`}>{i.incidence_type}</span>
                            </div>
                            {!acta?.is_locked && (
                              <button onClick={() => eliminarIncidencia(i.id)} className="text-[10px] text-rose-600 font-bold hover:underline cursor-pointer">Quitar</button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              </>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 shadow-xs text-center text-slate-500 text-sm">
                Seleccione un partido de la lista de la izquierda para comenzar a planillar el encuentro.
              </div>
            )}

          </div>

        </div>

      </main>
    </div>
  );
};
