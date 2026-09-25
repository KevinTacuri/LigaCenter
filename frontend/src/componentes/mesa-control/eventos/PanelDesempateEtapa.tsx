import React, {
  useEffect,
  useState,
} from 'react';

import {
  serviciosEventosCompetencia,
} from '../../../servicios/api';

import type {
  EtapaEvento,
  InfoDesempateEtapa,
} from '../../../types/CompetitionEvent';

interface Props {
  etapa: EtapaEvento;
}

const PanelDesempateEtapa:
  React.FC<Props> = ({
    etapa,
  }) => {
    const [
      info,
      setInfo,
    ] =
      useState<
        InfoDesempateEtapa | null
      >(null);

    const cargar = async () => {
      const res =
        await serviciosEventosCompetencia
          .obtenerDesempatesEtapa(
            etapa.id
          );

      if (res.success) {
        setInfo(
          res.data
        );
      }
    };

    useEffect(() => {
      cargar();
    }, [etapa.id]);

    if (
      !info?.required
    ) {
      return null;
    }

    return (
        <div className="max-w-4xl rounded-2xl border border-amber-500/15 bg-[#101219] overflow-hidden">

            {info.ties.map(
            (tie, tieIndex) => {
                const cantidad =
                tie.participants.length;

                const resultadoFormateado =
                Number(
                    tie.result_value
                ).toLocaleString(
                    undefined,
                    {
                    maximumFractionDigits:
                        4,
                    }
                );

                return (
                <div
                    key={tieIndex}
                    className={
                    tieIndex > 0
                        ? 'border-t border-slate-800'
                        : ''
                    }
                >
                    {/* CABECERA */}

                    <div className="p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">

                        <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-lg text-amber-400">
                            balance
                            </span>
                        </div>

                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-sm font-extrabold text-white">
                                Desempate pendiente
                            </h4>

                            <span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-[9px] font-black text-amber-400">
                                {cantidad}{' '}
                                empatados
                            </span>
                            </div>

                            <p className="text-[10px] text-slate-500 mt-1">
                            Define el orden de los participantes antes de cerrar la etapa.
                            </p>
                        </div>
                        </div>

                        {/* MARCA EMPATADA */}

                        <div className="flex items-center gap-2 bg-[#080a10] border border-slate-800 rounded-lg px-3 py-2 shrink-0">
                        <span className="text-[9px] uppercase font-bold text-slate-600">
                            Marca empatada
                        </span>

                        <span className="font-mono text-xs font-black text-amber-400">
                            {resultadoFormateado}
                        </span>
                        </div>
                    </div>
                    </div>

                    {/* PARTICIPANTES */}

                    <div className="px-4 pb-4 sm:px-5 sm:pb-5">
                    <div
                        className={`grid gap-3 ${
                        cantidad === 1
                            ? 'grid-cols-1'
                            : 'grid-cols-1 md:grid-cols-2'
                        }`}
                    >
                        {tie.participants.map(
                        (
                            participant,
                            index
                        ) => {
                            const resuelto =
                            participant
                                .tiebreak_order !==
                            null;

                            return (
                            <div
                                key={
                                participant
                                    .result_id
                                }
                                className={`rounded-xl border p-3 transition-colors ${
                                resuelto
                                    ? 'bg-emerald-500/[0.03] border-emerald-500/15'
                                    : 'bg-[#080a10] border-slate-800'
                                }`}
                            >
                                <div className="flex items-center gap-3">

                                {/* AVATAR NUMÉRICO */}

                                <div className="w-9 h-9 rounded-lg bg-[#151822] border border-slate-800 flex items-center justify-center shrink-0">
                                    <span className="text-xs font-black text-slate-400">
                                    {index + 1}
                                    </span>
                                </div>

                                {/* NOMBRE */}

                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-extrabold text-slate-200 truncate">
                                    {
                                        participant.name
                                    }
                                    </p>

                                    <div className="flex items-center gap-1.5 mt-1 text-[9px] text-slate-600">
                                    <span className="material-symbols-outlined text-[11px]">
                                        groups
                                    </span>

                                    <span className="truncate">
                                        {participant.group_name ??
                                        'Etapa'}
                                    </span>
                                    </div>
                                </div>

                                {/* ESTADO */}

                                {resuelto && (
                                    <span className="material-symbols-outlined text-base text-emerald-400">
                                    check_circle
                                    </span>
                                )}
                                </div>

                                {/* ORDEN */}

                                <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t border-slate-800/70">
                                <span className="text-[9px] uppercase font-bold tracking-wide text-slate-600">
                                    Orden de desempate
                                </span>
                                <div className="relative w-[88px]">
                                <select
                                    value={
                                    participant.tiebreak_order ?? ''
                                    }
                                    onChange={async (e) => {
                                    const valor =
                                        e.target.value !== ''
                                        ? Number(e.target.value)
                                        : null;

                                    await serviciosEventosCompetencia
                                        .actualizarDesempateResultado(
                                        participant.result_id,
                                        valor
                                        );

                                    await cargar();
                                    }}
                                    className="
                                    appearance-none
                                    w-full
                                    h-9
                                    bg-[#151822]
                                    border
                                    border-slate-700
                                    rounded-lg
                                    pl-3
                                    pr-8
                                    text-xs
                                    font-black
                                    text-white
                                    outline-none
                                    cursor-pointer
                                    focus:border-amber-500/60
                                    "
                                >
                                    <option value="">
                                    - 
                                    </option>

                                    {Array.from(
                                    { length: cantidad },
                                    (_, index) => index + 1
                                    ).map((orden) => (
                                    <option
                                        key={orden}
                                        value={orden}
                                    >
                                        {orden}.º
                                    </option>
                                    ))}
                                </select>

                                <span
                                    className="
                                    material-symbols-outlined
                                    pointer-events-none
                                    absolute
                                    right-2
                                    top-1/2
                                    -translate-y-1/2
                                    text-[16px]
                                    text-slate-400
                                    "
                                >
                                    expand_more
                                </span>
                                </div>
                                </div>
                            </div>
                            );
                        }
                        )}
                    </div>

                    {/* AYUDA */}

                    <div className="flex items-center gap-2 mt-3">
                        <span className="material-symbols-outlined text-xs text-slate-600">
                        info
                        </span>

                        <p className="text-[9px] text-slate-600">
                        El orden 1.º corresponde al ganador del desempate.
                        </p>
                    </div>
                    </div>
                </div>
                );
            }
            )}
        </div>
    );
};

export default PanelDesempateEtapa;