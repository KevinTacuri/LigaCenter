import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  useConfirm,
} from '@omit/react-confirm-dialog';

import {
  serviciosEventosCompetencia,
} from '../../../servicios/api';

import MesaGrupoEvento from './MesaGrupoEvento';

import type {
  EventoCompetencia,
  EtapaEvento,
  GrupoEtapaEvento,
  ResumenEtapaEvento,
} from '../../../types/CompetitionEvent';

interface GrupoControlSeleccionado {
  evento: EventoCompetencia;
  etapa: EtapaEvento;
  grupo: GrupoEtapaEvento;
}


const MesaEventos: React.FC = () => {

  const [ grupoControl, setGrupoControl, ] = useState<GrupoControlSeleccionado | null>(null);
  const confirm = useConfirm();
  const [
    resumenesEtapa,
    setResumenesEtapa,
  ] = useState<
    Record<
      number,
      ResumenEtapaEvento
    >
  >({});

  const finalizarEtapa = async (
    etapa: EtapaEvento
  ) => {
    if (!eventoSeleccionado) {
      return;
    }

    const esFinal = etapa.stage_type ==='final';

    const confirmado =
      await confirm({
        title: esFinal
          ? 'Finalizar competencia'
          : `Finalizar ${etapa.name}`,

        description: esFinal
          ? 'Se cerrará la etapa final y el evento quedará finalizado.'
          : 'Se calcularán los clasificados y serán promovidos automáticamente a la siguiente etapa.',

        confirmText: esFinal
          ? 'Finalizar competencia'
          : 'Finalizar etapa',

        cancelText:
          'Cancelar',

        confirmButton: {
          variant:
            'destructive',
        },
      });

    if (!confirmado) {
      return;
    }

    try {
      const res =
        await serviciosEventosCompetencia
          .finalizarEtapa(
            etapa.id
          );

      if (res.success) {
        /*
        * Recargar evento →
        * etapas →
        * grupos.
        */
        await seleccionarEvento(
          eventoSeleccionado
        );

        await cargarEventos();
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'No se pudo finalizar la etapa.'
      );
    }
  };

  const formatearResultado =
  (
    valor:
      | string
      | number
      | null
  ) => {
    if (
      valor === null ||
      valor === undefined
    ) {
      return '-';
    }

    const numero =
      Number(valor);

    if (
      eventoSeleccionado
        ?.event_type ===
      'carrera'
    ) {
      const minutos =
        Math.floor(
          numero / 60
        );

      const segundos =
        numero % 60;

      return `${minutos
        .toString()
        .padStart(
          2,
          '0'
        )}:${segundos
        .toFixed(2)
        .padStart(
          5,
          '0'
        )}`;
    }

    return numero.toLocaleString();
  };

  const [
    eventos,
    setEventos,
  ] = useState<EventoCompetencia[]>([]);

  const [
    eventoSeleccionado,
    setEventoSeleccionado,
  ] =
    useState<EventoCompetencia | null>(
      null
    );

  const [
    etapas,
    setEtapas,
  ] = useState<EtapaEvento[]>([]);

  const [
    gruposPorEtapa,
    setGruposPorEtapa,
  ] = useState<
    Record<number, GrupoEtapaEvento[]>
  >({});

  const [
    cargandoEventos,
    setCargandoEventos,
  ] = useState(false);

  const [
    cargandoEstructura,
    setCargandoEstructura,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<string | null>(null);

  /*
  |--------------------------------------------------------------------------
  | FILTROS
  |--------------------------------------------------------------------------
  */

  const [
    filtroTexto,
    setFiltroTexto,
  ] = useState('');

  const [
    filtroTipo,
    setFiltroTipo,
  ] = useState('todos');

  const [
    filtroEstado,
    setFiltroEstado,
  ] = useState('todos');

  /*
  |--------------------------------------------------------------------------
  | CARGAR EVENTOS
  |--------------------------------------------------------------------------
  */

  const cargarEventos = async () => {
    setCargandoEventos(true);
    setError(null);

    try {
      const res =
        await serviciosEventosCompetencia
          .obtenerEventos();

      if (res.success) {
        setEventos(res.data);
      }
    } catch (err) {
      console.error(
        'Error cargando eventos:',
        err
      );

      setError(
        'No se pudieron cargar los eventos.'
      );
    } finally {
      setCargandoEventos(false);
    }
  };

  useEffect(() => {
    cargarEventos();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | SELECCIONAR EVENTO
  |--------------------------------------------------------------------------
  */

  const seleccionarEvento = async (
    evento: EventoCompetencia
  ) => {
    setEventoSeleccionado(evento);

    setEtapas([]);
    setGruposPorEtapa({});

    setCargandoEstructura(true);
    setError(null);

    try {
      /*
      |--------------------------------------------------------------------------
      | ETAPAS
      |--------------------------------------------------------------------------
      */

      const resEtapas =
        await serviciosEventosCompetencia
          .obtenerEtapas(evento.id);

      if (!resEtapas.success) {
        return;
      }

      const etapasOrdenadas = [
        ...resEtapas.data,
      ].sort(
        (a, b) =>
          a.stage_number -
          b.stage_number
      );

      setEtapas(etapasOrdenadas);

      const etapasFinalizadas =
        etapasOrdenadas.filter(
          (etapa) =>
            etapa.status ===
            'finalizado'
        );

      const respuestasResumen =
        await Promise.all(
          etapasFinalizadas.map(
            async (etapa) => {
              try {
                const res =
                  await serviciosEventosCompetencia
                    .obtenerResumenEtapa(
                      etapa.id
                    );

                return {
                  etapaId:
                    etapa.id,

                  resumen:
                    res.success
                      ? res.data
                      : null,
                };
              } catch {
                return {
                  etapaId:
                    etapa.id,

                  resumen:
                    null,
                };
              }
            }
          )
        );

      const mapaResumenes: Record<
        number,
        ResumenEtapaEvento
      > = {};

      respuestasResumen.forEach(
        ({
          etapaId,
          resumen,
        }) => {
          if (resumen) {
            mapaResumenes[
              etapaId
            ] = resumen;
          }
        }
      );

      setResumenesEtapa(
        mapaResumenes
      );
      /*
      |--------------------------------------------------------------------------
      | GRUPOS DE CADA ETAPA
      |--------------------------------------------------------------------------
      */

      const respuestas =
        await Promise.all(
          etapasOrdenadas.map(
            async (etapa) => {
              const res =
                await serviciosEventosCompetencia
                  .obtenerGruposEtapa(
                    etapa.id
                  );

              return {
                etapaId: etapa.id,
                grupos: res.success
                  ? res.data
                  : [],
              };
            }
          )
        );

      const mapaGrupos: Record<
        number,
        GrupoEtapaEvento[]
      > = {};

      respuestas.forEach(
        ({
          etapaId,
          grupos,
        }) => {
          mapaGrupos[etapaId] = [
            ...grupos,
          ].sort(
            (a, b) =>
              a.group_number -
              b.group_number
          );
        }
      );

      setGruposPorEtapa(
        mapaGrupos
      );
    } catch (err) {
      console.error(
        'Error cargando estructura:',
        err
      );

      setError(
        'No se pudo cargar la estructura del evento.'
      );
    } finally {
      setCargandoEstructura(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | FILTRADO
  |--------------------------------------------------------------------------
  */

  const eventosFiltrados =
    useMemo(() => {
      return eventos.filter(
        (evento) => {
          if (
            filtroTexto.trim()
          ) {
            const texto =
              filtroTexto
                .toLowerCase();

            const nombre =
              evento.name
                ?.toLowerCase() ||
              '';

            if (
              !nombre.includes(
                texto
              )
            ) {
              return false;
            }
          }

          if (
            filtroTipo !==
              'todos' &&
            evento.event_type !==
              filtroTipo
          ) {
            return false;
          }

          if (
            filtroEstado !==
              'todos' &&
            evento.status !==
              filtroEstado
          ) {
            return false;
          }

          return true;
        }
      );
    }, [
      eventos,
      filtroTexto,
      filtroTipo,
      filtroEstado,
    ]);

  /*
  |--------------------------------------------------------------------------
  | HELPERS
  |--------------------------------------------------------------------------
  */

  const obtenerNombreTipo = (
    tipo: string
  ) => {
    switch (tipo) {
      case 'carrera':
        return 'Carrera';

      case 'salto':
        return 'Salto';

      case 'lanzamiento':
        return 'Lanzamiento';

      case 'puntaje':
        return 'Puntaje';

      default:
        return tipo;
    }
  };

  const obtenerAgregacion = (
    tipo: string
  ) => {
    switch (tipo) {
      case 'sum':
        return 'Suma';

      case 'best':
        return 'Mejor resultado';

      case 'average':
        return 'Promedio';

      default:
        return tipo;
    }
  };

  const obtenerClasificacion = (
    etapa: EtapaEvento
  ) => {
    if (
      etapa.stage_type ===
      'final'
    ) {
      return etapa.podium_places
        ? `${etapa.podium_places} puestos premiados`
        : 'Etapa final';
    }

    if (
      etapa
        .qualification_method ===
        'best_per_group'
    ) {
      return `${etapa.qualifiers_per_group ?? 0} por grupo`;
    }

    if (
      etapa
        .qualification_method ===
        'best_overall'
    ) {
      return `${etapa.qualifiers_count ?? 0} mejores`;
    }

    if (
      etapa
        .qualification_method ===
        'all'
    ) {
      return 'Clasifican todos';
    }

    return 'Sin clasificación';
  };

  /*
  |--------------------------------------------------------------------------
  | LISTADO EVENTOS
  |--------------------------------------------------------------------------
  */

  if (grupoControl) {
    return (
      <MesaGrupoEvento
        evento={grupoControl.evento}
        etapa={grupoControl.etapa}
        grupo={grupoControl.grupo}
        onVolver={async () => {
            setGrupoControl(null);
            if (eventoSeleccionado) {
              await seleccionarEvento(
                eventoSeleccionado
              );
            }
          }
        }
      />
    );
  }

  if (!eventoSeleccionado) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-extrabold text-white">
            Eventos Programados
          </h2>

          <p className="text-xs text-slate-400 font-medium mt-1">
            Seleccione un evento
            para abrir su estructura
            de competencia.
          </p>
        </div>

        {/* FILTROS */}

        <div className="bg-[#11131c] rounded-2xl border border-slate-900 p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-xs text-slate-500">
                search
              </span>

              <input
                type="text"
                value={filtroTexto}
                onChange={(e) =>
                  setFiltroTexto(
                    e.target.value
                  )
                }
                placeholder="Buscar evento..."
                className="w-full bg-[#171a26] border border-slate-850 text-xs text-white pl-9 pr-4 py-2 rounded-xl focus:border-indigo-650 focus:outline-hidden"
              />
            </div>

            <select
              value={filtroTipo}
              onChange={(e) =>
                setFiltroTipo(
                  e.target.value
                )
              }
              className="w-full bg-[#171a26] border border-slate-850 text-xs text-slate-300 px-3 py-2 rounded-xl focus:border-indigo-650 focus:outline-hidden cursor-pointer"
            >
              <option value="todos">
                Todos los tipos
              </option>

              <option value="carrera">
                Carrera
              </option>

              <option value="salto">
                Salto
              </option>

              <option value="lanzamiento">
                Lanzamiento
              </option>

              <option value="puntaje">
                Puntaje
              </option>
            </select>

            <select
              value={filtroEstado}
              onChange={(e) =>
                setFiltroEstado(
                  e.target.value
                )
              }
              className="w-full bg-[#171a26] border border-slate-850 text-xs text-slate-300 px-3 py-2 rounded-xl focus:border-indigo-650 focus:outline-hidden cursor-pointer"
            >
              <option value="todos">
                Todos los estados
              </option>

              <option value="programado">
                Programado
              </option>

              <option value="en_curso">
                En curso
              </option>

              <option value="finalizado">
                Finalizado
              </option>

              <option value="cancelado">
                Cancelado
              </option>
            </select>
          </div>
        </div>

        {/* ERROR */}

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
            {error}
          </div>
        )}

        {/* EVENTOS */}

        {cargandoEventos ? (
          <div className="py-20 text-center text-sm text-slate-400 font-bold animate-pulse">
            Cargando eventos...
          </div>
        ) : eventosFiltrados.length ===
          0 ? (
          <div className="bg-[#11131c] border border-slate-900 rounded-2xl p-12 text-center">
            <span className="material-symbols-outlined text-4xl text-slate-600">
              emoji_events
            </span>

            <p className="text-sm font-bold text-slate-300 mt-3">
              No hay eventos
            </p>

            <p className="text-xs text-slate-500 mt-1">
              No se encontraron
              eventos que coincidan
              con los filtros.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {eventosFiltrados.map(
              (evento) => (
                <button
                  type="button"
                  key={evento.id}
                  onClick={() =>
                    seleccionarEvento(
                      evento
                    )
                  }
                  className="bg-primary-container rounded-2xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer text-left border border-outline hover:border-primary/60 group"
                >
                  {/* CABECERA */}

                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <span className="text-[9px] uppercase tracking-wider font-bold text-on-surface-variant">
                        {obtenerNombreTipo(
                          evento.event_type
                        )}
                      </span>

                      <h3 className="font-extrabold text-sm text-on-surface mt-1 group-hover:text-primary transition-colors">
                        {evento.name}
                      </h3>
                    </div>

                    <span
                      className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase border ${
                        evento.status ===
                        'en_curso'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : evento.status ===
                              'finalizado'
                            ? 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                            : evento.status ===
                                'cancelado'
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}
                    >
                      {evento.status}
                    </span>
                  </div>

                  {/* INFO */}

                  <div className="mt-5 space-y-2 text-[10px] text-on-surface-variant">

                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">
                        person
                      </span>

                      <span>
                        {evento.participation_type ===
                        'team'
                          ? 'Por equipos'
                          : 'Individual'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">
                        calendar_today
                      </span>

                      <span>
                        {evento.date
                          ? new Date(
                              `${evento.date.substring(
                                0,
                                10
                              )}T00:00:00`
                            ).toLocaleDateString()
                          : 'Sin fecha'}
                      </span>
                    </div>

                    {evento.start_time && (
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">
                          schedule
                        </span>

                        <span>
                          {evento.start_time.substring(
                            0,
                            5
                          )}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-outline mt-4 pt-3 flex justify-end">
                    <span className="text-xs font-bold text-primary">
                      Abrir estructura →
                    </span>
                  </div>
                </button>
              )
            )}
          </div>
        )}
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | ESTRUCTURA DEL EVENTO
  |--------------------------------------------------------------------------
  */

  return (
    <div className="space-y-6">

      {/* VOLVER */}

      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => {
            setEventoSeleccionado(
              null
            );

            setEtapas([]);
            setGruposPorEtapa({});
          }}
          className="w-9 h-9 rounded-lg flex items-center justify-center border border-slate-800 hover:bg-[#171a26] text-slate-300 cursor-pointer"
        >
          <span className="material-symbols-outlined text-sm">
            arrow_back
          </span>
        </button>

        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-white">
              {
                eventoSeleccionado.name
              }
            </h2>

            <span className="text-[9px] uppercase font-bold px-2 py-1 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {obtenerNombreTipo(
                eventoSeleccionado.event_type
              )}
            </span>
          </div>

          <p className="text-xs text-slate-400 mt-1">
            Seleccione un grupo o
            serie para abrir su mesa
            de control.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
          {error}
        </div>
      )}

      {cargandoEstructura ? (
        <div className="py-20 text-center text-sm text-slate-400 font-bold animate-pulse">
          Cargando estructura de
          competencia...
        </div>
      ) : etapas.length === 0 ? (
        <div className="bg-[#11131c] border border-slate-900 rounded-2xl p-12 text-center">
          <span className="material-symbols-outlined text-4xl text-slate-600">
            account_tree
          </span>

          <p className="text-sm font-bold text-slate-300 mt-3">
            Sin etapas configuradas
          </p>

          <p className="text-xs text-slate-500 mt-1">
            Este evento todavía no
            tiene una estructura de
            competencia.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {etapas.map(
            (
              etapa,
              index
            ) => {
              const resumen = resumenesEtapa[etapa.id];
              const grupos =
                gruposPorEtapa[
                  etapa.id
                ] ?? [];

                const todosGruposFinalizados =
                  grupos.length > 0 &&
                  grupos.every(
                    (grupo) =>
                      grupo.status ===
                      'finalizado'
                  );

                const etapaFinalizada = etapa.status === 'finalizado';

              return (
                <div
                  key={etapa.id}
                  className="bg-[#11131c] rounded-2xl border border-slate-900 overflow-hidden"
                >
                  {/* ETAPA */}

                  <div className="p-5 border-b border-slate-900">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#800f2f]/20 text-[#c9244b] flex items-center justify-center font-black text-sm border border-[#800f2f]/20">
                          {
                            etapa.stage_number
                          }
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-extrabold text-sm text-white">
                              {
                                etapa.name
                              }
                            </h3>

                            {index ===
                              0 && (
                              <span className="text-[8px] uppercase font-bold text-slate-500">
                                Primera
                                etapa
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className="text-[9px] font-bold px-2 py-1 rounded-md bg-[#171a26] text-slate-400 border border-slate-800">
                              {
                                etapa.rounds_count
                              }{' '}
                              {etapa.rounds_count ===
                              1
                                ? 'ronda'
                                : 'rondas'}
                            </span>

                            <span className="text-[9px] font-bold px-2 py-1 rounded-md bg-[#171a26] text-slate-400 border border-slate-800">
                              {obtenerAgregacion(
                                etapa.result_aggregation
                              )}
                            </span>

                            <span className="text-[9px] font-bold px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              {obtenerClasificacion(
                                etapa
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      <span
                        className={`px-2 py-1 rounded-md text-[9px] uppercase font-bold border w-fit ${
                          etapa.status ===
                          'en_curso'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : etapa.status ===
                                'finalizado'
                              ? 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}
                      >
                        {etapa.status}
                      </span>
                    </div>
                  </div>

                  {/* GRUPOS */}

                  <div className="p-5">
                    {grupos.length ===
                    0 ? (
                      <div className="border border-dashed border-slate-800 rounded-xl py-8 text-center">
                        <p className="text-xs text-slate-500">
                          Esta etapa no
                          tiene grupos o
                          series
                          configurados.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {grupos.map(
                          (
                            grupo
                          ) => (
                            <div
                              key={
                                grupo.id
                              }
                              className="bg-[#07080c] border border-slate-900 rounded-xl p-4 hover:border-[#800f2f]/50 transition-colors"
                            >
                              <div className="flex justify-between gap-3">
                                <div>
                                  <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">
                                    {grupo.group_type ===
                                    'series'
                                      ? `Serie ${grupo.group_number}`
                                      : `Grupo ${grupo.group_number}`}
                                  </span>

                                  <h4 className="text-sm font-extrabold text-white mt-1">
                                    {
                                      grupo.name
                                    }
                                  </h4>
                                </div>

                                <span
                                  className={`w-2 h-2 mt-1 rounded-full ${
                                    grupo.status ===
                                    'en_curso'
                                      ? 'bg-emerald-500 animate-pulse'
                                      : grupo.status ===
                                          'finalizado'
                                        ? 'bg-slate-500'
                                        : 'bg-amber-500'
                                  }`}
                                />
                              </div>

                              <div className="mt-4 space-y-1.5 text-[10px] text-slate-500">
                                {grupo.date && (
                                  <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-xs">
                                      calendar_today
                                    </span>

                                    {
                                      grupo.date
                                    }
                                  </div>
                                )}

                                {grupo.start_time && (
                                  <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-xs">
                                      schedule
                                    </span>

                                    {grupo.start_time.substring(
                                      0,
                                      5
                                    )}
                                  </div>
                                )}

                                {grupo.venue?.name && (
                                  <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-xs">
                                      location_on
                                    </span>

                                    {
                                      grupo
                                        .venue
                                        .name
                                    }
                                  </div>
                                )}
                              </div>

                              <div className="border-t border-slate-900 mt-4 pt-3">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setGrupoControl({
                                      evento: eventoSeleccionado,
                                      etapa,
                                      grupo,
                                    });
                                  }}
                                  className="w-full bg-[#171a26] hover:bg-[#800f2f] border border-slate-800 hover:border-[#800f2f] text-slate-200 hover:text-white py-2 rounded-lg text-xs font-bold transition-all cursor-pointer"
                                >
                                  Abrir mesa
                                  →
                                </button>
                              </div>
                            </div>
                          )
                        )}

                      </div>
                    )}
                    {/* ETAPA TODAVÍA NO FINALIZADA */}
                    {!etapaFinalizada && (
                      <div className="mt-5 pt-4 border-t border-slate-900">

                        {todosGruposFinalizados ? (
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">

                            <div className="flex items-center gap-2 text-xs">
                              <span className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                <span className="material-symbols-outlined text-sm text-emerald-400">
                                  check_circle
                                </span>
                              </span>

                              <div>
                                <p className="font-bold text-slate-300">
                                  Todos los grupos están finalizados
                                </p>

                                <p className="text-[9px] text-slate-500 mt-0.5">
                                  La etapa está lista para cerrarse.
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                finalizarEtapa(
                                  etapa
                                )
                              }
                              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
                                etapa.stage_type ===
                                'final'
                                  ? 'bg-emerald-700 hover:bg-emerald-600 text-white'
                                  : 'bg-[#800f2f] hover:bg-[#a4133c] text-white'
                              }`}
                            >
                              <span className="material-symbols-outlined text-sm">
                                {etapa.stage_type ===
                                'final'
                                  ? 'emoji_events'
                                  : 'double_arrow'}
                              </span>

                              {etapa.stage_type ===
                              'final'
                                ? 'Finalizar competencia'
                                : 'Finalizar etapa'}
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-[10px] text-slate-600">
                            <span className="material-symbols-outlined text-sm">
                              info
                            </span>

                            Finalice todos los grupos para cerrar esta etapa.
                          </div>
                        )}

                      </div>
                    )}
                    {/* ETAPA YA FINALIZADA */}
                    {etapaFinalizada && (
                      <div className="mt-5 pt-4 border-t border-slate-900">
                        <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                          <span className="material-symbols-outlined text-sm">
                            verified
                          </span>
                          Etapa finalizada
                        </div>
                      </div>
                    )}

                    {etapa.status ==='finalizado' &&resumen?.type ==='qualified' && (
                      <div className="mt-5 pt-5 border-t border-slate-900">

                        <div className="flex items-center justify-between gap-3 mb-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-emerald-400 text-lg">
                                how_to_reg
                              </span>

                              <h4 className="text-xs font-black uppercase tracking-wider text-white">
                                Clasificados
                              </h4>
                            </div>

                            <p className="text-[9px] text-slate-500 mt-1">
                              Participantes promovidos
                              a la siguiente etapa.
                            </p>
                          </div>

                          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-black">
                            {
                              resumen
                                .participants
                                .length
                            }{' '}
                            clasificados
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2">
                          {resumen.participants.map(
                            (participante) => (
                              <div
                                key={
                                  participante
                                    .competition_event_participant_id
                                }
                                className="flex items-center gap-3 bg-[#07080c] border border-slate-900 rounded-xl p-3"
                              >
                                <div className="w-8 h-8 shrink-0 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                  <span className="material-symbols-outlined text-sm text-emerald-400">
                                    check
                                  </span>
                                </div>

                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-slate-200 truncate">
                                    {
                                      participante.name
                                    }
                                  </p>

                                  <p className="text-[9px] text-slate-600 mt-0.5 truncate">
                                    {participante.group_name ??
                                      'Etapa'}
                                    {participante.source_position
                                      ? ` · #${participante.source_position}`
                                      : ''}
                                  </p>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {etapa.status ==='finalizado' && resumen?.type === 'podium' && (
                      <div className="mt-5 pt-5 border-t border-slate-900">

                        <div className="flex items-center gap-2 mb-4">
                          <span className="material-symbols-outlined text-amber-400 text-lg">
                            emoji_events
                          </span>

                          <div>
                            <h4 className="text-xs font-black uppercase tracking-wider text-white">
                              Podio final
                            </h4>

                            <p className="text-[9px] text-slate-500 mt-1">
                              Resultados oficiales
                              de la competencia.
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {resumen.participants.map(
                            (
                              participante,
                              index
                            ) => {
                              const posicion =
                                participante.rank ??
                                index + 1;

                              return (
                                <div
                                  key={
                                    participante
                                      .competition_event_participant_id
                                  }
                                  className={`relative overflow-hidden rounded-2xl border p-4 ${
                                    posicion === 1
                                      ? 'bg-amber-500/10 border-amber-500/30'
                                      : posicion === 2
                                        ? 'bg-slate-400/10 border-slate-400/20'
                                        : 'bg-orange-700/10 border-orange-700/20'
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-3">

                                    <div className="flex items-center gap-3 min-w-0">
                                      <div
                                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${
                                          posicion === 1
                                            ? 'bg-amber-500/20 text-amber-400'
                                            : posicion === 2
                                              ? 'bg-slate-400/20 text-slate-300'
                                              : 'bg-orange-700/20 text-orange-400'
                                        }`}
                                      >
                                        {posicion}
                                      </div>

                                      <div className="min-w-0">
                                        <p className="text-sm font-extrabold text-white truncate">
                                          {
                                            participante.name
                                          }
                                        </p>

                                        <p className="text-[9px] text-slate-500 mt-0.5">
                                          {posicion === 1
                                            ? 'Campeón'
                                            : posicion === 2
                                              ? 'Segundo puesto'
                                              : 'Tercer puesto'}
                                        </p>
                                      </div>
                                    </div>

                                    <span className="font-mono text-sm font-black text-white">
                                      {formatearResultado(
                                        participante.result_value
                                      )}
                                    </span>
                                  </div>
                                </div>
                              );
                            }
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            }
          )}
        </div>
      )}
    </div>
  );
};

export default MesaEventos;