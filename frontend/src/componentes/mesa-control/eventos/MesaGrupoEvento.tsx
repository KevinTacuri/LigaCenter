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

type EstadoOperativo =
  | 'compitiendo'
  | 'no_presento'
  | 'retirado'
  | 'descalificado';


const MesaGrupoEvento: React.FC<Props> = ({
  evento,
  etapa,
  grupo,
  onVolver,
}) => {

  const [ estadoGrupo, setEstadoGrupo ] = useState(grupo.status);
  const confirm = useConfirm();
  const [ carrilEditandoId,setCarrilEditandoId,] = useState<number | null>(null);
  const [ carrilEditando, setCarrilEditando, ] = useState('');

  useEffect(() => {
    setEstadoGrupo(grupo.status);
  }, [
    grupo.id,
    grupo.status,
  ]);



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

  const [
    guardandoCelda,
    setGuardandoCelda,
  ] = useState<string | null>(null);

  /*
  |--------------------------------------------------------------------------
  | CARGAR MESA
  |--------------------------------------------------------------------------
  */

  const recargarResultados = async () => {
    const res =
      await serviciosEventosCompetencia
        .obtenerResultadosGrupo(
          grupo.id
        );

    if (res.success) {
      setResultados(res.data);
    }
  };

  const convertirTiempoASegundos = (
    texto: string
  ): number | null => {
    const valor = texto.trim();

    if (!valor) {
      return null;
    }

    if (!valor.includes(':')) {
      const segundos = Number(valor);

      return Number.isNaN(segundos)
        ? null
        : segundos;
    }

    const partes = valor.split(':');

    if (partes.length !== 2) {
      return null;
    }

    const minutos = Number(
      partes[0]
    );

    const segundos = Number(
      partes[1]
    );

    if (
      Number.isNaN(minutos) ||
      Number.isNaN(segundos)
    ) {
      return null;
    }

    return (
      minutos * 60 +
      segundos
    );
  };

  const guardarResultadoRonda = async (
    asignacion: ParticipanteGrupoEvento,
    numeroRonda: number,
    valorTexto: string
  ) => {
    const clave =
      `${asignacion.id}-${numeroRonda}`;

    setGuardandoCelda(clave);
    setError(null);

    try {
      let resultado =
        obtenerResultado(
          asignacion.id
        );

      const intentoExistente =
        obtenerIntento(
          resultado,
          numeroRonda
        );

      /*
      |--------------------------------------------------------------------------
      | CONVERTIR VALOR
      |--------------------------------------------------------------------------
      */

      let valor: number | null;

      if (
        valorTexto.trim() === ''
      ) {
        valor = null;
      } else if (
        evento.event_type ===
        'carrera'
      ) {
        valor =
          convertirTiempoASegundos(
            valorTexto
          );

        if (valor === null) {
          setError(
            'Ingrese un tiempo válido. Ejemplo: 27.43 o 00:27.43.'
          );

          return;
        }
      } else {
        const numero =
          Number(valorTexto);

        if (
          Number.isNaN(numero)
        ) {
          setError(
            'Ingrese un valor numérico válido.'
          );

          return;
        }

        valor = numero;
      }

      /*
      |--------------------------------------------------------------------------
      | BORRAR INTENTO
      |--------------------------------------------------------------------------
      */

      if (
        valor === null &&
        intentoExistente
      ) {
        await serviciosEventosCompetencia
          .eliminarIntentoResultado(
            intentoExistente.id
          );

        await recargarResultados();

        return;
      }

      if (valor === null) {
        return;
      }

      /*
      |--------------------------------------------------------------------------
      | CREAR RESULTADO BASE
      |--------------------------------------------------------------------------
      */

      if (!resultado) {
        const resResultado =
          await serviciosEventosCompetencia
            .crearResultado({
              competition_event_group_participant_id:
                asignacion.id,

              result_unit:
                evento.event_type ===
                'carrera'
                  ? 'segundos'
                  : evento.event_type ===
                      'puntaje'
                    ? 'puntos'
                    : null,

              status:
                'registrado',
            });

        if (
          !resResultado.success
        ) {
          return;
        }

        resultado =
          resResultado.data;
      }

      /*
      |--------------------------------------------------------------------------
      | CREAR / ACTUALIZAR INTENTO
      |--------------------------------------------------------------------------
      */

      if (intentoExistente) {
        await serviciosEventosCompetencia
          .actualizarIntentoResultado(
            intentoExistente.id,
            {
              value: valor,
            }
          );
      } else {
        await serviciosEventosCompetencia
          .crearIntentoResultado(
            resultado.id,
            {
              attempt_number:
                numeroRonda,

              value: valor,

              competition_event_participant_member_id:
                null,
            }
          );
      }

      /*
      |--------------------------------------------------------------------------
      | RECARGAR TOTAL + POSICIONES
      |--------------------------------------------------------------------------
      */

      await recargarResultados();
    } catch (err: any) {
      console.error(
        'Error guardando resultado:',
        err
      );

      setError(
        err.response?.data?.message ||
          'No se pudo guardar el resultado.'
      );
    } finally {
      setGuardandoCelda(null);
    }
  };

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

  const obtenerEstadoOperativo = (
    asignacion:
      | ParticipanteGrupoEvento,
    resultado:
      | ResultadoEvento
      | undefined
  ) => {
    if (
      asignacion?.status ===
      'no_presento'
    ) {
      return 'no_presento';
    }

    if (
      asignacion?.status ===
      'retirado'
    ) {
      return 'retirado';
    }

    if (
      resultado?.status ===
      'anulado'
    ) {
      return 'descalificado';
    }

    return 'compitiendo';
  };

  const obtenerOCrearResultado = async ( asignacion: ParticipanteGrupoEvento ): Promise<ResultadoEvento | undefined> => {
    const existente =
      obtenerResultado(
        asignacion.id
      );

    if (existente) {
      return existente;
    }

    const res =
      await serviciosEventosCompetencia
        .crearResultado({
          competition_event_group_participant_id:
            asignacion.id,

          result_unit:
            evento.event_type ===
            'carrera'
              ? 'segundos'
              : evento.event_type ===
                  'puntaje'
                ? 'puntos'
                : null,

          status:
            'registrado',
        });

    return res.success
      ? res.data
      : undefined;
  };

  const cambiarEstadoOperativo = async (
      asignacion: ParticipanteGrupoEvento,
      nuevoEstado: EstadoOperativo
    ) => {
      setError(null);

      try {
        let resultado =
          obtenerResultado(
            asignacion.id
          );

        /*
        |--------------------------------------------------------------------------
        | COMPITIENDO
        |--------------------------------------------------------------------------
        */

        if (
          nuevoEstado ===
          'compitiendo'
        ) {
          await serviciosEventosCompetencia
            .actualizarEstadoParticipanteGrupo(
              asignacion.id,
              'activo'
            );

          if (
            resultado?.status ===
            'anulado'
          ) {
            await serviciosEventosCompetencia
              .actualizarResultado(
                resultado.id,
                {
                  status:
                    'registrado',
                }
              );
          }
        }

        /*
        |--------------------------------------------------------------------------
        | NO PRESENTÓ
        |--------------------------------------------------------------------------
        */

        if (
          nuevoEstado ===
          'no_presento'
        ) {
          await serviciosEventosCompetencia
            .actualizarEstadoParticipanteGrupo(
              asignacion.id,
              'no_presento'
            );

          resultado =
            await obtenerOCrearResultado(
              asignacion
            );

          if (
            resultado &&
            resultado.status !==
              'anulado'
          ) {
            await serviciosEventosCompetencia
              .actualizarResultado(
                resultado.id,
                {
                  status:
                    'anulado',
                }
              );
          }
        }

        /*
        |--------------------------------------------------------------------------
        | RETIRADO
        |--------------------------------------------------------------------------
        */

        if (
          nuevoEstado ===
          'retirado'
        ) {
          await serviciosEventosCompetencia
            .actualizarEstadoParticipanteGrupo(
              asignacion.id,
              'retirado'
            );

          resultado =
            await obtenerOCrearResultado(
              asignacion
            );

          if (
            resultado &&
            resultado.status !==
              'anulado'
          ) {
            await serviciosEventosCompetencia
              .actualizarResultado(
                resultado.id,
                {
                  status:
                    'anulado',
                }
              );
          }
        }

        /*
        |--------------------------------------------------------------------------
        | DESCALIFICADO
        |--------------------------------------------------------------------------
        */

        if (
          nuevoEstado ===
          'descalificado'
        ) {
          /*
          * La descalificación pertenece
          * al resultado de este grupo.
          */

          await serviciosEventosCompetencia
            .actualizarEstadoParticipanteGrupo(
              asignacion.id,
              'activo'
            );

          resultado =
            await obtenerOCrearResultado(
              asignacion
            );

          if (
            resultado &&
            resultado.status !==
              'anulado'
          ) {
            await serviciosEventosCompetencia
              .actualizarResultado(
                resultado.id,
                {
                  status:
                    'anulado',
                }
              );
          }
        }

        await cargarMesa();
      } catch (err: any) {
        setError(
          err.response?.data?.message ||
            'No se pudo cambiar el estado del participante.'
        );
      }
  };

  const guardarCarril = async (asignacion: ParticipanteGrupoEvento) => {
    const nuevoCarril =
      carrilEditando.trim() === ''
        ? null
        : Number(carrilEditando);

    if (
      nuevoCarril !== null &&
      (
        Number.isNaN(nuevoCarril) ||
        nuevoCarril < 1
      )
    ) {
      setError(
        'El carril debe ser un número mayor o igual a 1.'
      );

      return;
    }

    setError(null);

    try {
      const res =
        await serviciosEventosCompetencia
          .actualizarParticipanteGrupo(
            asignacion.id,
            {
              lane: nuevoCarril,
            }
          );

      if (res.success) {
        setParticipantesGrupo(
          (actuales) =>
            actuales.map(
              (participante) =>
                participante.id ===
                asignacion.id
                  ? {
                      ...participante,
                      lane:
                        res.data.lane,
                    }
                  : participante
            )
        );

        setCarrilEditandoId(null);
        setCarrilEditando('');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'No se pudo actualizar el carril.'
      );
    }
  };

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

  const cantidadCompletos =
    participantesGrupo.filter(
      (asignacion) => {
        const resultado =
          obtenerResultado(
            asignacion.id
          );

        /*
        * No presentó o retirado
        */

        if (asignacion?.status == 'no_presento' || asignacion?.status === 'retirado') {
          return true;
        }
        /*
        * Descalificado
        */
        if (
          resultado?.status ===
          'anulado'
        ) {
          return true;
        }

        if (!resultado) {
          return false;
        }

        return rondas.every(
          (numeroRonda) => {
            const intento =
              obtenerIntento(
                resultado,
                numeroRonda
              );

            return (
              intento &&
              intento.value !== null &&
              intento.value !== undefined
            );
          }
        );
      }
    ).length;

  const totalParticipantes =
    participantesGrupo.length;

  const porcentajeCompletado =
    totalParticipantes > 0
      ? Math.round(
          (
            cantidadCompletos /
            totalParticipantes
          ) * 100
        )
      : 0;

  const grupoCompleto =
    totalParticipantes > 0 &&
    cantidadCompletos ===
      totalParticipantes;
  
  const iniciarGrupo = async () => {
    setError(null);

    try {
      const res =
        await serviciosEventosCompetencia
          .iniciarGrupo(
            grupo.id
          );

      if (res.success) {
        setEstadoGrupo(
          'en_curso'
        );
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'No se pudo iniciar el grupo.'
      );
    }
  };

  const finalizarGrupo = async () => {
    if (!grupoCompleto) {
      setError(
        `Faltan resultados. Actualmente hay ${cantidadCompletos} de ${totalParticipantes} participantes completos.`
      );

      return;
    }

    const confirmado =
      await confirm({
        title:
          'Finalizar grupo',

        description:
          'Los resultados serán oficializados y ya no podrán modificarse.',

        confirmText:
          'Finalizar',

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

    setError(null);

    try {
      const res =
        await serviciosEventosCompetencia
          .finalizarGrupo(
            grupo.id
          );

      if (res.success) {
        setEstadoGrupo(
          'finalizado'
        );

        await recargarResultados();
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'No se pudo finalizar el grupo.'
      );
    }
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

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[10px] text-slate-500 font-medium">
              <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">
                  groups
                  </span>

                  {participantesGrupo.length} participantes
              </span>

              <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">
                  repeat
                  </span>

                  {etapa.rounds_count}{' '}
                  {etapa.rounds_count === 1
                  ? 'ronda'
                  : 'rondas'}
              </span>

              <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">
                  calculate
                  </span>

                  {etapa.result_aggregation === 'sum'
                  ? 'Suma'
                  : etapa.result_aggregation === 'best'
                      ? 'Mejor resultado'
                      : 'Promedio'}
              </span>
              </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
              <span
              className={`w-2.5 h-2.5 rounded-full ${
                  estadoGrupo === 'en_curso'
                  ? 'bg-emerald-500 animate-pulse'
                  : estadoGrupo === 'finalizado'
                      ? 'bg-slate-500'
                      : 'bg-amber-500'
              }`}
              />

              <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400">
              {estadoGrupo === 'en_curso'
                  ? 'En curso'
                  : estadoGrupo === 'finalizado'
                  ? 'Finalizado'
                  : 'Programado'}
              </span>
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
                  estadoGrupo ===
                  'en_curso'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : estadoGrupo ===
                          'finalizado'
                      ? 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}
              >
                  {estadoGrupo}
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

                      <th className="text-left p-3 min-w-[135px]">
                        Estado
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
                          const participante = obtenerParticipante(
                              asignacion
                          );

                          const resultado = obtenerResultado(
                              asignacion.id
                          );

                          const estadoOperativo = obtenerEstadoOperativo(
                            asignacion,
                            resultado
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
                                  {carrilEditandoId ===
                                  asignacion.id ? (
                                    <div className="flex items-center justify-center gap-1">
                                      <input
                                        type="number"
                                        min="1"
                                        autoFocus
                                        value={carrilEditando}
                                        onChange={(e) =>
                                          setCarrilEditando(
                                            e.target.value
                                          )
                                        }
                                        className="
                                          w-14 h-8 px-2
                                          rounded-lg
                                          bg-[#151822]
                                          border border-indigo-500/60
                                          text-center text-sm font-black text-white
                                          caret-indigo-400
                                          outline-none
                                          focus:ring-2 focus:ring-indigo-500/20
                                          focus:border-indigo-400

                                          [&::-webkit-inner-spin-button]:appearance-none
                                          [&::-webkit-outer-spin-button]:appearance-none
                                        "
                                      />

                                      <button
                                        type="button"
                                        onClick={() =>
                                          guardarCarril(
                                            asignacion
                                          )
                                        }
                                        className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 flex items-center justify-center cursor-pointer"
                                        title="Guardar carril"
                                      >
                                        <span className="material-symbols-outlined text-sm">
                                          check
                                        </span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          setCarrilEditandoId(
                                            null
                                          );

                                          setCarrilEditando('');
                                        }}
                                        className="w-7 h-7 rounded-lg bg-slate-500/10 border border-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
                                        title="Cancelar"
                                      >
                                        <span className="material-symbols-outlined text-sm">
                                          close
                                        </span>
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      disabled={
                                        estadoGrupo !==
                                        'programado'
                                      }
                                      onClick={() => {
                                        setCarrilEditandoId(
                                          asignacion.id
                                        );

                                        setCarrilEditando(
                                          asignacion.lane
                                            ?.toString() ??
                                            ''
                                        );
                                      }}
                                      className="
                                        inline-flex
                                        w-8 h-8
                                        rounded-lg
                                        bg-indigo-500/10
                                        border
                                        border-indigo-500/20
                                        text-indigo-400
                                        items-center
                                        justify-center
                                        font-black
                                        hover:bg-indigo-500/20
                                        hover:border-indigo-500/40
                                        disabled:hover:bg-indigo-500/10
                                        disabled:cursor-default
                                        cursor-pointer
                                        transition-color
                                      "
                                      title={
                                        estadoGrupo ===
                                        'finalizado'
                                          ? undefined
                                          : 'Editar carril'
                                      }
                                    >
                                      <span className="inline-flex w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 items-center justify-center font-black">
                                        {asignacion.lane ??
                                          '-'}
                                      </span>

                                    </button>
                                  )}
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

                              <td className="p-3">
                                <select
                                  value={
                                    estadoOperativo
                                  }
                                  disabled={
                                    estadoGrupo !==
                                    'en_curso'
                                  }
                                  onChange={(e) =>
                                    cambiarEstadoOperativo(
                                      asignacion,
                                      e.target
                                        .value as EstadoOperativo
                                    )
                                  }
                                  className={`w-full min-w-[125px] text-[10px] font-bold rounded-lg px-2 py-2 border outline-none cursor-pointer disabled:cursor-not-allowed ${
                                    estadoOperativo ===
                                    'compitiendo'
                                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                      : estadoOperativo ===
                                          'no_presento'
                                        ? 'bg-slate-500/10 border-slate-500/20 text-slate-400'
                                        : estadoOperativo ===
                                            'retirado'
                                          ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                          : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                                  }`}
                                >
                                  <option
                                    value="compitiendo"
                                    className="bg-[#11131c]"
                                  >
                                    Compitiendo
                                  </option>

                                  <option
                                    value="no_presento"
                                    className="bg-[#11131c]"
                                  >
                                    No se presentó
                                  </option>

                                  <option
                                    value="retirado"
                                    className="bg-[#11131c]"
                                  >
                                    Retirado
                                  </option>

                                  <option
                                    value="descalificado"
                                    className="bg-[#11131c]"
                                  >
                                    Descalificado
                                  </option>
                                </select>
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

                                  <input
                                    type={
                                      evento.event_type ===
                                      'carrera'
                                        ? 'text'
                                        : 'number'
                                    }

                                    step="any"

                                    defaultValue={
                                      intento?.value != null
                                        ? evento.event_type ===
                                          'carrera'
                                          ? formatearTiempo(
                                              intento.value
                                            )
                                          : Number(
                                              intento.value
                                            )
                                        : ''
                                    }

                                    placeholder={
                                      evento.event_type ===
                                      'carrera'
                                        ? '00:00.00'
                                        : '0'
                                    }

                                    disabled={
                                      estadoGrupo !==
                                        'en_curso' ||
                                      resultado?.status ===
                                        'oficializado' ||
                                      estadoOperativo !== 'compitiendo' ||
                                      guardandoCelda ===
                                        `${asignacion.id}-${ronda}`
                                    }

                                    onBlur={(e) =>
                                      guardarResultadoRonda(
                                        asignacion,
                                        ronda,
                                        e.target.value
                                      )
                                    }

                                    onKeyDown={(e) => {
                                      if (
                                        e.key === 'Enter'
                                      ) {
                                        e.preventDefault();

                                        e.currentTarget.blur();
                                      }
                                    }}

                                    className={`w-[95px] text-center font-mono font-bold rounded-lg px-2 py-2 outline-none border transition-all ${
                                      guardandoCelda ===
                                      `${asignacion.id}-${ronda}`
                                        ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
                                        : 'bg-[#07080c] border-slate-800 text-slate-200 focus:border-[#800f2f] focus:ring-1 focus:ring-[#800f2f]/30'
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                                    />

                                  </td>
                                  );
                              }
                              )}

                              <td className="p-3 text-center">
                                  <div className="inline-flex min-w-[72px] justify-center bg-primary/10 border border-primary/20 text-primary px-3 py-2 rounded-xl font-black">
                                    {
                                      estadoOperativo === 'compitiendo' ? formatearValor(resultado?.result_value) : '-'
                                    }
                                  </div>
                              </td>

                              <td className="p-3 text-center">
                              {estadoOperativo === 'compitiendo' && resultado?.position ? (
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
              <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                <h3 className="font-extrabold text-sm uppercase tracking-wider text-white">
                  Control del grupo
                </h3>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      estadoGrupo ===
                      'en_curso'
                        ? 'bg-emerald-500 animate-pulse'
                        : estadoGrupo ===
                            'finalizado'
                          ? 'bg-slate-500'
                          : 'bg-amber-500'
                    }`}
                  />

                  <span className="text-[9px] uppercase font-bold text-slate-500">
                    {estadoGrupo ===
                    'en_curso'
                      ? 'En curso'
                      : estadoGrupo ===
                          'finalizado'
                        ? 'Finalizado'
                        : 'Programado'}
                  </span>
                </div>
              </div>

              {/* PROGRESO */}

              <div className="bg-[#07080c] border border-slate-900 rounded-xl p-4">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500">
                      Resultados completos
                    </span>

                    <div className="mt-1">
                      <span className="text-2xl font-black text-white">
                        {cantidadCompletos}
                      </span>

                      <span className="text-sm font-bold text-slate-600">
                        {' / '}
                        {totalParticipantes}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-xs font-black ${
                      grupoCompleto
                        ? 'text-emerald-400'
                        : 'text-slate-400'
                    }`}
                  >
                    {porcentajeCompletado}%
                  </span>
                </div>

                <div className="h-2 bg-[#171a26] rounded-full overflow-hidden mt-3">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      grupoCompleto
                        ? 'bg-emerald-500'
                        : 'bg-[#800f2f]'
                    }`}
                    style={{
                      width:
                        `${porcentajeCompletado}%`,
                    }}
                  />
                </div>
              </div>

              {/* ACCIÓN */}

              <div className="pt-1">
                {estadoGrupo ===
                'programado' ? (
                  <button
                    type="button"
                    onClick={
                      iniciarGrupo
                    }
                    className="w-full flex items-center justify-center gap-2 bg-indigo-650 hover:bg-indigo-600 text-white py-2.5 rounded-xl text-xs font-black cursor-pointer transition-all"
                  >
                    <span className="material-symbols-outlined text-sm">
                      play_arrow
                    </span>

                    Iniciar grupo
                  </button>
                ) : estadoGrupo ===
                  'en_curso' ? (
                  <button
                    type="button"
                    onClick={
                      finalizarGrupo
                    }
                    disabled={
                      !grupoCompleto
                    }
                    className="w-full flex items-center justify-center gap-2 bg-[#800f2f] hover:bg-[#a4133c] disabled:bg-slate-800 disabled:text-slate-500 text-white py-2.5 rounded-xl text-xs font-black cursor-pointer disabled:cursor-not-allowed transition-all"
                  >
                    <span className="material-symbols-outlined text-sm">
                      lock
                    </span>

                    Finalizar grupo
                  </button>
                ) : (
                  <div className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                    <span className="material-symbols-outlined text-sm">
                      verified
                    </span>

                    Resultados oficializados
                  </div>
                )}
              </div>

              {estadoGrupo ===
                'en_curso' &&
                !grupoCompleto && (
                  <p className="text-[9px] leading-relaxed text-slate-500 text-center">
                    Complete los resultados de
                    todos los participantes para
                    habilitar el cierre.
                  </p>
                )}
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