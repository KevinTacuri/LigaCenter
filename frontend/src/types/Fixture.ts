import type { Escenario, Partido, Disciplina, Categoria, Jugador, Equipo } from '../servicios/api';

export type TabFixture = 'escenarios' | 'generar' | 'programar' | 'partidos' | 'eventos';
export type GenerarMode = 'fixture' | 'eventos';

export interface FiltrosPartidosFixture {
  ronda: number | null;
  equipo: number | null;
  estado: string;
  cancha: number | null;
}

export interface DatosFixtureFormulario {
  discipline_id: string;
  category_id: string;
  start_date: string;
  venue_ids: number[];
  format: 'liga' | 'grupos' | 'eliminacion_directa';
  num_groups: string;
  advance_per_group: string;
  third_place: boolean;
}

export interface DatosFechaFixture {
  discipline_id: string;
  category_id: string;
  round: string;
  available_hours: string;
  venue_ids: number[];
}

export interface DatosReprogramacionFixture {
  match_date: string;
  match_time: string;
  venue_id: string;
}

export interface FiltroEscenarioFixture {
  texto: string;
  tipo: string;
}

export interface EquipoEnPartidoFixture {
  id: number;
  nombre: string;
}

export interface FixtureHookState {
  escenarios: Escenario[];
  partidos: Partido[];
  disciplinas: Disciplina[];
  categorias: Categoria[];
  jugadores: Jugador[];
  cargando: boolean;
  errorLocal: string | null;
  recargar: () => Promise<void>;
}

export type EstadoPartidoFixture =
  | 'programado'
  | 'en_curso'
  | 'finalizado'
  | 'cancelado'
  | 'reprogramado'
  | 'suspendido';

export interface PartidosFiltradosResultado {
  partidos: Partido[];
  totalPaginas: number;
  totalRegistros: number;
  equipos: EquipoEnPartidoFixture[];
}

export interface EscenarioFormularioState {
  name: string;
  venue_type: string;
  location: string;
  capacity: string;
  status: string;
}

export interface ReprogramacionPartidoPayload {
  match_date: string;
  match_time: string;
  venue_id: number;
}
