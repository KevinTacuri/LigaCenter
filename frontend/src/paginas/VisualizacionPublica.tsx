import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  serviciosResultados,
  serviciosParticipantes
} from '../servicios/api';
import type {
  Posicion,
  EstadisticaJugador,
  Sancion,
  Disciplina,
  Categoria
} from '../servicios/api';

type TabType = 'posiciones' | 'goleadores' | 'tarjetas' | 'sanciones';

export const VisualizacionPublica: React.FC = () => {
  const navegar = useNavigate();

  const [tabActiva, setTabActiva] = useState<TabType>('posiciones');
  const [cargando, setCargando] = useState(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  // Datos
  const [posiciones, setPosiciones] = useState<Posicion[]>([]);
  const [goleadores, setGoleadores] = useState<EstadisticaJugador[]>([]);
  const [tarjetas, setTarjetas] = useState<EstadisticaJugador[]>([]);
  const [sanciones, setSanciones] = useState<Sancion[]>([]);

  // Filtros de tabla
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [filtroDisc, setFiltroDisc] = useState('');
  const [filtroCat, setFiltroCat] = useState('');

  useEffect(() => {
    cargarFiltros();
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [tabActiva, filtroDisc, filtroCat]);

  const cargarFiltros = async () => {
    try {
      const resDisc = await serviciosParticipantes.obtenerDisciplinas();
      const resCat = await serviciosParticipantes.obtenerCategorias();
      if (resDisc.success) setDisciplinas(resDisc.data);
      if (resCat.success) setCategorias(resCat.data);
    } catch (err) {}
  };

  const cargarDatos = async () => {
    setCargando(true);
    setErrorLocal(null);
    try {
      if (tabActiva === 'posiciones') {
        const discId = filtroDisc ? parseInt(filtroDisc) : undefined;
        const catId = filtroCat ? parseInt(filtroCat) : undefined;
        const res = await serviciosResultados.obtenerPosiciones(discId, catId);
        if (res.success) setPosiciones(res.data);
      } else if (tabActiva === 'goleadores') {
        const res = await serviciosResultados.obtenerGoleadores();
        if (res.success) setGoleadores(res.data);
      } else if (tabActiva === 'tarjetas') {
        // Obtenemos amarillas y rojas. Consolidamos en tarjetas amarillas por defecto, o ambas
        const resAmarillas = await serviciosResultados.obtenerTarjetasAmarillas();
        if (resAmarillas.success) setTarjetas(resAmarillas.data);
      } else if (tabActiva === 'sanciones') {
        const res = await serviciosResultados.obtenerSanciones();
        if (res.success) setSanciones(res.data);
      }
    } catch (err) {
      setErrorLocal('Error al cargar datos estadísticos.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0b10] text-slate-100 font-sans flex flex-col">
      {/* Cabecera */}
      <header className="bg-[#11131c]/90 backdrop-blur-md border-b border-slate-900 px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navegar('/tablero')}
            className="w-10 h-10 rounded-lg flex items-center justify-center border border-slate-800 hover:bg-[#171a26] transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-slate-300">arrow_back</span>
          </button>
          <div>
            <h1 className="text-lg font-black text-white leading-none">Estadísticas y Posiciones</h1>
            <span className="text-[10px] text-slate-450 font-semibold tracking-wider uppercase mt-1 block">
              Consulta Pública de Resultados en Tiempo Real
            </span>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-[#11131c] border-b border-slate-900 px-6 py-2 flex flex-wrap gap-2">
        {(['posiciones', 'goleadores', 'tarjetas', 'sanciones'] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setTabActiva(tab)}
            className={`px-4 py-2 text-xs font-bold rounded-lg uppercase tracking-wide cursor-pointer transition-all ${
              tabActiva === tab ? 'bg-indigo-650 text-white' : 'text-slate-400 hover:bg-[#171a26] hover:text-white'
            }`}
          >
            {tab === 'posiciones' ? 'Tabla de Posiciones' : tab === 'goleadores' ? 'Goleadores' : tab === 'tarjetas' ? 'Tarjetas acumuladas' : 'Suspendidos / Sanciones'}
          </button>
        ))}
      </div>

      {/* Contenido Principal */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">

        {errorLocal && (
          <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-455 text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">error</span>
            <span>{errorLocal}</span>
          </div>
        )}

        {/* Filtros para la Tabla de Posiciones */}
        {tabActiva === 'posiciones' && (
          <div className="bg-[#11131c] border border-slate-900 p-4 rounded-2xl flex flex-wrap gap-4 shadow-xs">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-450 uppercase">Filtrar Disciplina</label>
              <select
                value={filtroDisc} onChange={(e) => {
                  setFiltroDisc(e.target.value);
                  setFiltroCat('');
                }}
                className="text-xs border border-slate-800 bg-[#171a26] text-white rounded-lg p-2 cursor-pointer outline-hidden"
              >
                <option value="">Todas las disciplinas</option>
                {disciplinas.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-450 uppercase">Filtrar Categoría</label>
              <select
                value={filtroCat} onChange={(e) => setFiltroCat(e.target.value)}
                className="text-xs border border-slate-800 bg-[#171a26] text-white rounded-lg p-2 cursor-pointer outline-hidden"
              >
                <option value="">Todas las categorías</option>
                {categorias
                  .filter((c) => !filtroDisc || c.discipline_id === parseInt(filtroDisc))
                  .map((c) => <option key={c.id} value={c.id}>{c.name}</option>)
                }
              </select>
            </div>
          </div>
        )}

        {/* Tabla principal */}
        <section className="bg-[#11131c] rounded-2xl border border-slate-900 shadow-xs overflow-hidden">
          
          {cargando ? (
            <div className="p-12 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 rounded-full border-4 border-slate-800 border-t-indigo-500 animate-spin" />
              <span className="text-xs text-slate-450 uppercase tracking-widest font-bold">Cargando datos oficiales...</span>
            </div>
          ) : (
            <>
              {tabActiva === 'posiciones' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#171a26] border-b border-slate-900 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                        <th className="p-3.5 pl-6 text-center w-12">Pos</th>
                        <th className="p-3.5">Equipo</th>
                        <th className="p-3.5 text-center">PJ</th>
                        <th className="p-3.5 text-center">PG</th>
                        <th className="p-3.5 text-center">PE</th>
                        <th className="p-3.5 text-center">PP</th>
                        <th className="p-3.5 text-center">GF</th>
                        <th className="p-3.5 text-center">GC</th>
                        <th className="p-3.5 text-center">DG</th>
                        <th className="p-3.5 text-center pr-6">Puntos</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900 text-sm">
                      {posiciones.map((pos, idx) => (
                        <tr key={pos.id} className="hover:bg-[#171a26]/40">
                          <td className="p-3.5 pl-6 text-center font-bold text-slate-400">{idx + 1}</td>
                          <td className="p-3.5 font-bold text-white">{pos.team?.name}</td>
                          <td className="p-3.5 text-center text-slate-300">{pos.matches_played}</td>
                          <td className="p-3.5 text-center text-emerald-450 font-semibold">{pos.matches_won}</td>
                          <td className="p-3.5 text-center text-slate-400">{pos.matches_drawn}</td>
                          <td className="p-3.5 text-center text-rose-500">{pos.matches_lost}</td>
                          <td className="p-3.5 text-center text-slate-300">{pos.goals_for}</td>
                          <td className="p-3.5 text-center text-slate-300">{pos.goals_against}</td>
                          <td className="p-3.5 text-center text-white font-bold">{pos.goal_difference > 0 ? `+${pos.goal_difference}` : pos.goal_difference}</td>
                          <td className="p-3.5 text-center font-extrabold text-indigo-400 text-base pr-6">{pos.total_points}</td>
                        </tr>
                      ))}
                      {posiciones.length === 0 && (
                        <tr>
                          <td colSpan={10} className="p-10 text-center text-slate-450 text-xs">No hay posiciones registradas para estos filtros.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {tabActiva === 'goleadores' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#171a26] border-b border-slate-900 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                        <th className="p-3.5 pl-6 text-center w-12">Pos</th>
                        <th className="p-3.5">Jugador</th>
                        <th className="p-3.5">Equipo</th>
                        <th className="p-3.5 text-center pr-6">Goles Registrados</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900 text-sm">
                      {goleadores.map((g, idx) => (
                        <tr key={g.id} className="hover:bg-[#171a26]/40">
                          <td className="p-3.5 pl-6 text-center font-bold text-slate-400">{idx + 1}</td>
                          <td className="p-3.5 font-bold text-white">{g.player?.name}</td>
                          <td className="p-3.5 text-slate-305">{g.player?.team?.name}</td>
                          <td className="p-3.5 text-center font-extrabold text-emerald-450 text-base pr-6">{g.goals}</td>
                        </tr>
                      ))}
                      {goleadores.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-10 text-center text-slate-450 text-xs">No hay estadísticas de goleadores registradas.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {tabActiva === 'tarjetas' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#171a26] border-b border-slate-900 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                        <th className="p-3.5 pl-6 text-center w-12">Pos</th>
                        <th className="p-3.5">Jugador</th>
                        <th className="p-3.5">Equipo</th>
                        <th className="p-3.5 text-center">Tarjetas Amarillas</th>
                        <th className="p-3.5 text-center pr-6">Tarjetas Rojas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900 text-sm">
                      {tarjetas.map((t, idx) => (
                        <tr key={t.id} className="hover:bg-[#171a26]/40">
                          <td className="p-3.5 pl-6 text-center font-bold text-slate-400">{idx + 1}</td>
                          <td className="p-3.5 font-bold text-white">{t.player?.name}</td>
                          <td className="p-3.5 text-slate-305">{t.player?.team?.name}</td>
                          <td className="p-3.5 text-center font-extrabold text-amber-450 text-base">{t.yellow_cards}</td>
                          <td className="p-3.5 text-center font-extrabold text-rose-500 text-base pr-6">{t.red_cards}</td>
                        </tr>
                      ))}
                      {tarjetas.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-10 text-center text-slate-450 text-xs">No hay estadísticas de tarjetas registradas.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {tabActiva === 'sanciones' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#171a26] border-b border-slate-900 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                        <th className="p-3.5 pl-6">Jugador</th>
                        <th className="p-3">Equipo</th>
                        <th className="p-3">Motivo / Causa de la Sanción</th>
                        <th className="p-3">Fecha Inicio</th>
                        <th className="p-3">Duración</th>
                        <th className="p-3 pr-6 text-right">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900 text-sm">
                      {sanciones.map((s) => (
                        <tr key={s.id} className="hover:bg-[#171a26]/40">
                          <td className="p-3.5 pl-6 font-bold text-white">{s.player?.name}</td>
                          <td className="p-3 text-slate-305">{s.player?.team?.name}</td>
                          <td className="p-3 text-slate-400 text-xs">{s.reason}</td>
                          <td className="p-3 text-slate-450 text-xs">{new Date(s.start_date).toLocaleDateString()}</td>
                          <td className="p-3 text-slate-300 font-semibold">{s.duration} {s.duration === 1 ? 'partido' : 'partidos'}</td>
                          <td className="p-3 pr-6 text-right">
                            <span className="bg-rose-500/10 border border-rose-500/20 text-rose-455 font-bold px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-wider">
                              {s.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {sanciones.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-10 text-center text-slate-450 text-xs">No hay sanciones activas en este momento.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

        </section>

      </main>
    </div>
  );
};
