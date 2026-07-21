import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Asignar Pusher de forma global para que laravel-echo pueda leerlo
(window as any).Pusher = Pusher;

// Extraer dinámicamente el host del backend para WebSocket a partir de la API
const obtenerWsHost = (): string => {
  const urlBase = __VITE_API_URL__ || 'http://127.0.0.1:8000/api';
  try {
    const url = new URL(urlBase);
    return url.hostname; // Devuelve '127.0.0.1', 'localhost', o la IP local correspondiente
  } catch (e) {
    return '127.0.0.1';
  }
};

const wsHost = obtenerWsHost();

export const echo = new Echo({
  broadcaster: 'reverb',
  key: import.meta.env.VITE_REVERB_APP_KEY || '8y6q8k4jim6sn9exhwrd',
  wsHost: wsHost,
  wsPort: parseInt(import.meta.env.VITE_REVERB_PORT || '8080', 10),
  wssPort: parseInt(import.meta.env.VITE_REVERB_PORT || '8080', 10),
  forceTLS: import.meta.env.VITE_REVERB_SCHEME === 'https',
  enabledTransports: ['ws', 'wss'],
  disableStats: true,
});

export const registrarCanalPartido = (matchId: number) => {
  return echo.channel(`matches.${matchId}`);
};

export const registrarCanalCampeonato = (championshipId: number) => {
  return echo.channel(`championship.${championshipId}`);
};
