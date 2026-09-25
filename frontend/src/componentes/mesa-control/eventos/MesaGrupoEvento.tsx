import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  serviciosEventosCompetencia,
} from '../../../servicios/api';

import type {
  EventoCompetencia,
  EtapaEvento,
  GrupoEtapaEvento,
  ParticipanteEvento,
  ParticipanteGrupoEvento,
  ResultadoEvento,
} from '../../../types/CompetitionEvent';

interface Props {
  evento: EventoCompetencia;
  etapa: EtapaEvento;
  grupo: GrupoEtapaEvento;

  onVolver: () => void;
}

const MesaGrupoEvento: React.FC<Props> = ({
  evento,
  etapa,
  grupo,
  onVolver,
}) => {
  const [
    participantesGrupo,
    setParticipantesGrupo,
  ] = useState<
    ParticipanteGrupoEvento[]
  >([]);

  const [
    participantesEvento,
    setParticipantesEvento,
  ] = useState<
    ParticipanteEvento[]
  >([]);

  const [
    resultados,
    setResultados,
  ] = useState<
    ResultadoEvento[]
  >([]);

  const [
    cargando,
    setCargando,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState<string | null>(
    null
  );

  /*
  |--------------------------------------------------------------------------
  | CARGAR MESA
  |--------------------------------------------------------------------------
  */

  const cargarMesa = async () => {
    setCargando(true);
    setError(null);

    try {
      const [
        resGrupo,
        resParticipantes,
        resResultados,
      ] = await Promise.all([
        serviciosEventosCompetencia
          .obtenerParticipantesGrupo(
            grupo.id
          ),

        serviciosEventosCompetencia
          .obtenerParticipantes(
            evento.id
          ),

        serviciosEventosCompetencia
          .obtenerResultadosGrupo(
            grupo.id
          ),
      ]);

      if (resGrupo.success) {
        setParticipantesGrupo(
          resGrupo.data
        );
      }

      if (
        resParticipantes.success
      ) {
        setParticipantesEvento(
          resParticipantes.data
        );
      }

      if (
        resResultados.success
      ) {
        setResultados(
          resResultados.data
        );
      }
    } catch (err) {
      console.error(
        'Error cargando mesa:',
        err
      );

      setError(
        'No se pudo cargar la mesa de control.'
      );
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarMesa();
  }, [grupo.id]);

  /*
  |--------------------------------------------------------------------------
  | RONDAS
  |--------------------------------------------------------------------------
  */

  const rondas = useMemo(
    () =>
      Array.from(
        {
          length:
            etapa.rounds_count,
        },
        (_, index) =>
          index + 1
      ),
    [etapa.rounds_count]
  );

  /*
  |--------------------------------------------------------------------------
  | HELPERS
  |--------------------------------------------------------------------------
  */

  const obtenerParticipante = (
    asignacion: ParticipanteGrupoEvento
  ) => {
    return participantesEvento.find(
      (participante) =>
        participante.id ===
        asignacion
          .competition_event_participant_id
    );
  };

  const obtenerResultado = (
    asignacionId: number
  ) => {
    return resultados.find(
      (resultado) =>
        resultado
          .competition_event_group_participant_id ===
        asignacionId
    );
  };

  const obtenerIntento = (
    resultado:
      | ResultadoEvento
      | undefined,
    numeroRonda: number
  ) => {
    return resultado?.attempts?.find(
      (attempt) =>
        attempt.attempt_number ===
        numeroRonda
    );
  };

  const obtenerNombreParticipante = (
    participante:
      | ParticipanteEvento
      | undefined
  ) => {
    if (!participante) {
      return 'Participante';
    }

    if (
      participante
        .championship_player
    ) {
      return participante
        .championship_player.name;
    }

    if (
      participante
        .championship_team
    ) {
      return participante
        .championship_team.name;
    }

    return 'Participante';
  };

  /*
  |--------------------------------------------------------------------------
  | FORMATEAR RESULTADOS
  |--------------------------------------------------------------------------
  */

  const formatearTiempo = (
    valor:
      | string
      | number
      | null
      | undefined
  ) => {
    if (
      valor === null ||
      valor === undefined ||
      valor === ''
    ) {
      return '-';
    }

    const segundos =
      Number(valor);

    if (
      Number.isNaN(segundos)
    ) {
      return '-';
    }

    const minutos =
      Math.floor(
        segundos / 60
      );

    const resto =
      segundos % 60;

    return `${minutos
      .toString()
      .padStart(
        2,
        '0'
      )}:${resto
      .toFixed(2)
      .padStart(
        5,
        '0'
      )}`;
  };

  const formatearValor = (
    valor:
      | string
      | number
      | null
      | undefined
  ) => {
    if (
      valor === null ||
      valor === undefined
    ) {
      return '-';
    }

    if (
      evento.event_type ===
      'carrera'
    ) {
      return formatearTiempo(
        valor
      );
    }

    return Number(
      valor
    ).toLocaleString();
  };

  /*
  |--------------------------------------------------------------------------
  | ORDEN
  |--------------------------------------------------------------------------
  */

  const participantesOrdenados =
    useMemo(() => {
      return [
        ...participantesGrupo,
      ].sort(
        (a, b) =>
          (a.start_order ?? 999) -
          (b.start_order ?? 999)
      );
    }, [participantesGrupo]);

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  if (cargando) {
    return (
      <div className="py-20 text-center text-sm text-slate-400 font-bold animate-pulse">
        Cargando mesa de
        control...
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* CABECERA */}

      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={onVolver}
          className="w-9 h-9 rounded-lg flex items-center justify-center border border-slate-800 hover:bg-[#171a26] text-slate-300 cursor-pointer shrink-0"
        >
          <span className="material-symbols-outlined text-sm">
            arrow_back
          </span>
        </button>

        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-extrabold text-white">
              {evento.name}
            </h2>

            <span className="px-2 py-1 rounded-md text-[9px] uppercase font-bold bg-[#800f2f]/20 text-[#c9244b] border border-[#800f2f]/30">
              {etapa.name}
            </span>

            <span className="px-2 py-1 rounded-md text-[9px] uppercase font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {grupo.name}
            </span>
          </div>

          <p className="text-xs text-slate-400 mt-1">
            Registro y control de
            resultados
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ================================
            TABLA PRINCIPAL
        ================================= */}

        <div className="lg:col-span-2">
          <div className="bg-[#11131c] rounded-2xl border border-slate-900 overflow-hidden">

            <div className="p-5 border-b border-slate-900 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-white">
                  Planilla de
                  resultados
                </h3>

                <p className="text-[10px] text-slate-500 mt-1">
                  {
                    participantesGrupo.length
                  }{' '}
                  participantes
                </p>
              </div>

              <span
                className={`px-2.5 py-1 rounded-lg text-[9px] uppercase font-bold border ${
                  grupo.status ===
                  'en_curso'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : grupo.status ===
                        'finalizado'
                      ? 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}
              >
                {grupo.status}
              </span>
            </div>

            {participantesOrdenados.length ===
            0 ? (
              <div className="py-16 text-center text-xs text-slate-500">
                Este grupo no tiene
                participantes.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-[#07080c] border-b border-slate-900 text-slate-500 uppercase text-[9px]">

                      {evento.event_type ===
                        'carrera' && (
                        <th className="text-center p-3 w-16">
                          Carril
                        </th>
                      )}

                      <th className="text-left p-3">
                        Participante
                      </th>

                      {rondas.map(
                        (
                          ronda
                        ) => (
                          <th
                            key={
                              ronda
                            }
                            className="text-center p-3 min-w-[100px]"
                          >
                            {evento.event_type ===
                              'carrera' &&
                            etapa.rounds_count ===
                              1
                              ? 'Tiempo'
                              : `R${ronda}`}
                          </th>
                        )
                      )}

                      <th className="text-center p-3">
                        {evento.event_type ===
                        'carrera'
                          ? 'Mejor'
                          : 'Total'}
                      </th>

                      <th className="text-center p-3 w-16">
                        Pos.
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-900">
                    {participantesOrdenados.map(
                      (
                        asignacion
                      ) => {
                        const participante =
                          obtenerParticipante(
                            asignacion
                          );

                        const resultado =
                          obtenerResultado(
                            asignacion.id
                          );

                        return (
                          <tr
                            key={
                              asignacion.id
                            }
                            className="hover:bg-[#171a26]/40 transition-colors"
                          >
                            {evento.event_type ===
                              'carrera' && (
                              <td className="p-3 text-center">
                                <span className="inline-flex w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 items-center justify-center font-black">
                                  {asignacion.lane ??
                                    '-'}
                                </span>
                              </td>
                            )}

                            <td className="p-3">
                              <div className="font-bold text-slate-200">
                                {obtenerNombreParticipante(
                                  participante
                                )}
                              </div>

                              {asignacion.start_order && (
                                <div className="text-[9px] text-slate-600 mt-0.5">
                                  Orden #
                                  {
                                    asignacion.start_order
                                  }
                                </div>
                              )}
                            </td>

                            {rondas.map(
                              (
                                ronda
                              ) => {
                                const intento =
                                  obtenerIntento(
                                    resultado,
                                    ronda
                                  );

                                return (
                                  <td
                                    key={
                                      ronda
                                    }
                                    className="p-3 text-center"
                                  >
                                    <span className="font-mono font-bold text-slate-300">
                                      {formatearValor(
                                        intento?.value
                                      )}
                                    </span>
                                  </td>
                                );
                              }
                            )}

                            <td className="p-3 text-center">
                              <span className="font-black text-white">
                                {formatearValor(
                                  resultado?.result_value
                                )}
                              </span>
                            </td>

                            <td className="p-3 text-center">
                              {resultado?.position ? (
                                <span className="inline-flex w-7 h-7 rounded-full bg-[#800f2f]/20 text-[#c9244b] border border-[#800f2f]/30 items-center justify-center font-black">
                                  {
                                    resultado.position
                                  }
                                </span>
                              ) : (
                                <span className="text-slate-600">
                                  -
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ================================
            PANEL DERECHO
        ================================= */}

        <div className="space-y-6">

          <div className="bg-[#11131c] rounded-2xl border border-slate-900 p-5 space-y-4">
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-white border-b border-slate-900 pb-3">
              Control del grupo
            </h3>

            <div className="space-y-3 text-xs">

              <div className="flex justify-between gap-3">
                <span className="text-slate-500">
                  Etapa
                </span>

                <span className="font-bold text-slate-200">
                  {etapa.name}
                </span>
              </div>

              <div className="flex justify-between gap-3">
                <span className="text-slate-500">
                  Grupo / Serie
                </span>

                <span className="font-bold text-slate-200">
                  {grupo.name}
                </span>
              </div>

              <div className="flex justify-between gap-3">
                <span className="text-slate-500">
                  Rondas
                </span>

                <span className="font-bold text-slate-200">
                  {
                    etapa.rounds_count
                  }
                </span>
              </div>

              <div className="flex justify-between gap-3">
                <span className="text-slate-500">
                  Cálculo
                </span>

                <span className="font-bold text-slate-200">
                  {etapa.result_aggregation ===
                  'sum'
                    ? 'Suma'
                    : etapa.result_aggregation ===
                        'best'
                      ? 'Mejor resultado'
                      : 'Promedio'}
                </span>
              </div>

              <div className="flex justify-between gap-3">
                <span className="text-slate-500">
                  Participantes
                </span>

                <span className="font-bold text-slate-200">
                  {
                    participantesGrupo.length
                  }
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-900">
              {grupo.status ===
              'programado' ? (
                <button
                  type="button"
                  className="w-full bg-indigo-650 hover:bg-indigo-600 text-white py-2.5 rounded-xl text-xs font-black cursor-pointer transition-all"
                >
                  Iniciar grupo
                </button>
              ) : grupo.status ===
                'en_curso' ? (
                <button
                  type="button"
                  className="w-full bg-[#800f2f] hover:bg-[#a4133c] text-white py-2.5 rounded-xl text-xs font-black cursor-pointer transition-all"
                >
                  Finalizar grupo
                </button>
              ) : (
                <div className="text-center text-xs font-bold text-slate-500 py-2">
                  Grupo finalizado
                </div>
              )}
            </div>
          </div>

          {/* RANKING */}

          <div className="bg-[#11131c] rounded-2xl border border-slate-900 p-5">
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-white border-b border-slate-900 pb-3 mb-3">
              Ranking actual
            </h3>

            {resultados.filter(
              (r) =>
                r.position !==
                null
            ).length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-5">
                Aún no hay resultados
                registrados.
              </p>
            ) : (
              <div className="space-y-1">
                {[...resultados]
                  .filter(
                    (r) =>
                      r.position !==
                      null
                  )
                  .sort(
                    (a, b) =>
                      (a.position ??
                        999) -
                      (b.position ??
                        999)
                  )
                  .map(
                    (
                      resultado
                    ) => {
                      const asignacion =
                        participantesGrupo.find(
                          (p) =>
                            p.id ===
                            resultado
                              .competition_event_group_participant_id
                        );

                      const participante =
                        asignacion
                          ? obtenerParticipante(
                              asignacion
                            )
                          : undefined;

                      return (
                        <div
                          key={
                            resultado.id
                          }
                          className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg hover:bg-[#171a26]"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="w-6 h-6 rounded-full bg-[#07080c] border border-slate-800 flex items-center justify-center text-[9px] font-black text-slate-300 shrink-0">
                              {
                                resultado.position
                              }
                            </span>

                            <span className="text-xs font-bold text-slate-300 truncate">
                              {obtenerNombreParticipante(
                                participante
                              )}
                            </span>
                          </div>

                          <span className="font-mono text-[10px] font-bold text-slate-400">
                            {formatearValor(
                              resultado.result_value
                            )}
                          </span>
                        </div>
                      );
                    }
                  )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MesaGrupoEvento;