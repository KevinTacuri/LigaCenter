import { useCallback, useEffect, useState } from 'react';
import {
  publicApi,
  type PublicCompetitionEventDetail,
} from '../../servicios/apiPublic';

export const useDetalleEventoPublico = (eventId?: number) => {
  const [evento, setEvento] =
    useState<PublicCompetitionEventDetail | null>(null);

  const [loading, setLoading] = useState(true);

  const recargar = useCallback(async () => {
    if (!eventId) return;

    setLoading(true);

    try {
      const res =
        await publicApi.getCompetitionEvent(eventId);

      setEvento(res.data.data);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    recargar();
  }, [recargar]);

  return {
    evento,
    loading,
    recargar,
  };
};