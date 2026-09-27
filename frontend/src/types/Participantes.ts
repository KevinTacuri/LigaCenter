// Tipos compartidos para el módulo de gestión de participantes (organizador)

export type TabParticipantes =
  | 'disciplinas'
  | 'categorias'
  | 'equipos'
  | 'jugadores'
  | 'registro-equipo'
  | 'planilla-jugadores';

export interface FilaJugador {
  id?: number;
  nombre: string;
  dni: string;
  edad: string;
  dorsal: string;
  guardado: boolean;
  guardando?: boolean;
  error?: string;
  foto?: string | null;
  fotoFile?: File | null;
  fotoUrlLocal?: string | null;
}

export interface OpcionAutocomplete {
  id: number;
  label: string;
}

export interface FiltrosEquipos {
  busqueda: string;
  estado: 'todos' | 'aprobado' | 'pendiente' | 'rechazado';
  categoria: string;
  orden:
    | 'nombre_asc'
    | 'nombre_desc'
    | 'representante_asc'
    | 'representante_desc'
    | 'estado';
}

export interface FiltrosJugadores {
  busqueda: string;
  orden: 'nombre_asc' | 'nombre_desc' | 'equipo_asc' | 'equipo_desc';
  categoriaId: number | null;
  equipoId: number | null;
}