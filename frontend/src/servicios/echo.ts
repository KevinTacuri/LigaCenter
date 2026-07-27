import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Asignar Pusher de forma global para que laravel-echo pueda leerlo
(window as any).Pusher = Pusher;

// Extraer dinámicamente el host del backend para WebSocket a partir de la API
// Convierte "api.compose-...sslip.io" → "ws.compose-...sslip.io"
const obtenerWsHost = (): string => {
  const urlBase = __VITE_API_URL__ || 'http://127.0.0.1:8000/api';
  try {
    const url = new URL(urlBase);
    return url.hostname.replace(/^api\./, 'ws.');
  } catch (e) {
    return 'ws.compose-connect-primary-bandwidth-elym5d-9de16a-144-126-134-104.sslip.io';
  }
};

const wsHost = obtenerWsHost();

export const echo = new Echo({
  broadcaster: 'reverb',
  key: import.meta.env.VITE_REVERB_APP_KEY || '8y6q8k4jim6sn9exhwrd',
  wsHost: wsHost,
  wsPort: 443,                                    // Traefik expone 443
  wssPort: 443,
  forceTLS: true,                                  // WSS vía Traefik + Let's Encrypt
  enabledTransports: ['ws', 'wss'],
  disableStats: true,
});

export const registrarCanalPartido = (matchId: number) => {
  return echo.channel(`matches.${matchId}`);
};

export const registrarCanalCampeonato = (championshipId: number) => {
  return echo.channel(`championship.${championshipId}`);
};
