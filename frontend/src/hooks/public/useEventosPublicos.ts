import { useEffect, useState } from 'react';
import {
  publicApi,
  type PublicCompetitionEvent,
} from '../../servicios/apiPublic';

export const useEventosPublicos = (
  disciplineId?: number
) => {
  const [events, setEvents] = useState<PublicCompetitionEvent[]>([]);
  const [highlightedEvents, setHighlightedEvents] = useState<PublicCompetitionEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  const cargarEventos = async () => {
    setLoadingEvents(true);

    try {
      const [eventsRes, highlightedRes] = await Promise.all([
        publicApi.getCompetitionEvents({
          discipline_id: disciplineId,
        }),
        publicApi.getHighlightedEvents(),
      ]);

      setEvents(eventsRes.data.data || []);
      setHighlightedEvents(highlightedRes.data.data || []);
    } finally {
      setLoadingEvents(false);
    }
  };

  useEffect(() => {
    cargarEventos();
  }, [disciplineId]);

  return {
    events,
    highlightedEvents,
    loadingEvents,
    reloadEvents: cargarEventos,
  };
};