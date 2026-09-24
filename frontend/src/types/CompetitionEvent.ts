import type { ChampionshipDiscipline, Categoria, Escenario, Jugador, Equipo } from '../servicios/api';

export type EventType =
  | 'carrera'
  | 'salto'
  | 'lanzamiento'
  | 'puntaje';

export type ParticipationType =
  | 'individual'
  | 'team';

export type EventStatus =
  | 'programado'
  | 'en_curso'
  | 'finalizado'
  | 'cancelado';

export interface EventoCompetencia {
  id: number;

  championship_discipline_id: number;
  category_id: number;

  name: string;

  event_type: EventType;
  participation_type: ParticipationType;

  date: string;

  start_time?: string | null;
  venue_id?: number | null;

  status: EventStatus;

  championship_discipline?: ChampionshipDiscipline;
  category?: Categoria;
  venue?: Escenario;
}

export type CrearEventoCompetencia = Omit<
  EventoCompetencia,
  | 'id'
  | 'championship_discipline'
  | 'category'
  | 'venue'
>;

export interface DatosEvento {
  discipline_id: string;
  category_id: string;

  name: string;

  event_type: EventType;
  participation_type: ParticipationType;

  date: string;
  start_time: string;

  venue_id: string;
}

export interface DatosEdicionEvento {
  name: string;
  event_type: EventType;
  date: string;
  start_time: string;
  venue_id: string;
  status: EventStatus;
}

export type ParticipantStatus =
  | 'inscrito'
  | 'confirmado'
  | 'no_presento'
  | 'retirado';

export interface ParticipanteEvento {
  id: number;
  competition_event_id: number;

  championship_player_id: number | null;
  championship_team_id: number | null;

  status: ParticipantStatus;

  championship_player?: Jugador | null;
  championship_team?: Equipo | null;
}

export type CrearParticipanteEvento = Omit<
  ParticipanteEvento,
  | 'id'
  | 'championship_player'
  | 'championship_team'
>;