import { useEffect, useState } from 'react';
import {
  publicApi,
  type PublicCompetitionResult,
  type PublicEventGroup,
} from '../../../servicios/apiPublic';

import { ResultadoCarrera } from './resultados/ResultadoCarrera';
import { ResultadoIntentos } from './resultados/ResultadoIntentos';
import { ResultadoPuntaje } from './resultados/ResultadoPuntaje';
import { suscribirLiveCompetencia } from '../../../servicios/echo';
import { useParams } from 'react-router-dom';

interface Props {
  group: PublicEventGroup;
  eventType: string;
  embedded?: boolean;
  qualificationMethod?: string | null;
  qualifiersPerGroup?: number | null;
}

export const ResultadosGrupoPublico = ({ group, eventType, embedded = false, qualificationMethod, qualifiersPerGroup}: Props) => {
  const [results, setResults] = useState<PublicCompetitionResult[]>([]);
  const [loading, setLoading] = useState(true);
  const { id } = useParams();
  const eventId = Number(id)
  const [actualizados, setActualizados] = useState<number[]>([]);

  useEffect(() => {
    const cargar = async () => {
      setLoading(true);

      try {
        const res = await publicApi.getCompetitionGroupResults(group.id);
        setResults(res.data.data || []);
      } finally {
        setLoading(false);
      }
    };

    cargar();
  }, [group.id]);

  useEffect(() => {
    if (!eventId) return;


    const unsubscribe =
      suscribirLiveCompetencia(
        `competition-events.${eventId}`,
        (change) => {
          if (
            change.type !== 'group-results' ||
            change.group_id !== group.id
          ) {
            return;
          }

          const liveResults =
            change.data?.results || [];

          setResults((prev) => {
            const idsActualizados: number[] = [];

            const nuevos = prev.map((result) => {
              const live = liveResults.find(
                (item: PublicCompetitionResult) =>
                  item.id === result.id,
              );

              if (!live) {
                return result;
              }

              if (
                result.result_value !== live.result_value ||
                result.position !== live.position
              ) {
                idsActualizados.push(result.id);
              }

              return {
                ...result,
                ...live,
              };
            });

            setActualizados(idsActualizados);

            setTimeout(() => {
              setActualizados([]);
            }, 1200);

            return nuevos.sort(
              (a, b) =>
                (a.position ?? 9999) -
                (b.position ?? 9999),
            );
          });
        }
      );

    return unsubscribe;
  }, [eventId, group.id]);

  if (loading) {
    return (
      <div className="bg-[#11131c] border border-slate-800 rounded-xl p-5 text-center text-xs text-slate-500">
        Cargando resultados...
      </div>
    );
  }

  return (
    <div className="bg-[#11131c] border border-slate-800 rounded-xl overflow-hidden">
      {results.length === 0 ? (
        <div className="p-6 text-center text-xs text-slate-500">
          Aún no hay resultados registrados
        </div>
      ) : (
        <div className="divide-y divide-slate-800/60">
            {eventType === 'carrera' && (
                <ResultadoCarrera results={results} qualifiersPerGroup={
                    qualificationMethod === 'best_per_group'
                    ? qualifiersPerGroup
                    : null
                }/>
                )}

                {['salto', 'lanzamiento'].includes(eventType) && (
                <ResultadoIntentos results={results} updatedIds={actualizados}/>
                )}

                {eventType === 'puntaje' && (
                <ResultadoPuntaje results={results} />
            )}
        </div>
      )}
    </div>
  );
};