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

  competition_format: CompetitionFormat;
  result_aggregation: | ResultAggregation | null;

  championship_discipline?: ChampionshipDiscipline;
  category?: Categoria;
  venue?: Escenario;
}

export type CrearEventoCompetencia = {
  championship_discipline_id: number;
  category_id: number;
  name: string;
  event_type: EventType;
  participation_type: ParticipationType;
  competition_format: CompetitionFormat;
  rounds_count?: number | null;
  result_aggregation?: ResultAggregation | null;
  date: string;
  start_time?: string | null;
  venue_id?: number | null;
  status: EventStatus;
};

export interface DatosEvento {
  discipline_id: string;
  category_id: string;

  name: string;

  event_type: EventType;
  participation_type: ParticipationType;

  date: string;
  start_time: string;

  venue_id: string;
  competition_format: CompetitionFormat;
  rounds_count: string;
  result_aggregation: ResultAggregation;
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

export type EventStageType =
  | 'qualifying'
  | 'semifinal'
  | 'final'

export type QualificationMethod =
  | 'best_overall'
  | 'best_per_group'
  | 'all'
  | 'none';

export type CompetitionFormat =
  | 'single_final'
  | 'qualifying_final'
  | 'qualifying_semifinal_final'
  | 'custom';

export type ResultAggregation =
  | 'sum'
  | 'best'
  | 'average';

export interface EtapaEvento {
  id: number;
  competition_event_id: number;
  name: string;
  stage_type: EventStageType;
  stage_number: number;
  rounds_count: number;
  result_aggregation: ResultAggregation;
  qualifiers_count: number | null;
  qualifiers_per_group: number | null;
  qualification_method: QualificationMethod | null;
  podium_places: number | null;
  status: EventStatus;
}

export interface GuardarEtapaEvento {
  name: string;
  stage_type: EventStageType;
  stage_number: number;
  rounds_count: number;
  result_aggregation: ResultAggregation;
  qualifiers_count: number | null;
  qualification_method: QualificationMethod | null;
  qualifiers_per_group: number | null;
  podium_places: number | null;
  status: EventStatus;
}

export interface DatosEtapaEvento {
  name: string;
  stage_type: EventStageType;
  stage_number: string;
  rounds_count: string;
  result_aggregation: ResultAggregation;
  qualification_method: QualificationMethod | '';
  qualifiers_count: string;
  qualifiers_per_group: string;
  podium_places: string;
  status: EventStatus;
}

export type EventGroupType =
  | 'series'
  | 'group';

export interface GrupoEtapaEvento {
  id: number;
  competition_event_stage_id: number;
  name: string;
  group_type: EventGroupType;
  group_number: number;
  date: string | null;
  start_time: string | null;
  venue_id: number | null;
  status: EventStatus;
  venue?: Escenario | null;
}

export interface GuardarGrupoEtapaEvento {
  name: string;
  group_type: EventGroupType;
  group_number: number;
  date: string | null;
  start_time: string | null;
  venue_id: number | null;
  status: EventStatus;
}

export interface DatosGrupoEtapaEvento {
  name: string;
  group_type: EventGroupType;
  group_number: string;
  date: string;
  start_time: string;
  venue_id: string;
  status: EventStatus;
}

export interface ParticipanteGrupoEvento {
  id: number;
  competition_event_group_id: number;
  competition_event_participant_id: number;
  lane: number | null;
  start_order: number | null;
}

export interface CrearParticipanteGrupoEvento {
  competition_event_participant_id: number;
  lane: number | null;
  start_order: number | null;
}

export interface IntentoResultadoEvento {
  id: number;
  competition_result_id: number;
  competition_event_participant_member_id: number | null;
  attempt_number: number;
  value: string | number | null;
}

export interface ResultadoEvento {
  id: number;
  competition_event_group_participant_id: number;

  result_value: string | number | null;
  result_unit: string | null;

  position: number | null;

  status:
    | 'registrado'
    | 'oficializado'
    | 'anulado';

  attempts: IntentoResultadoEvento[];
}