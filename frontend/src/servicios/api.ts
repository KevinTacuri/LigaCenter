import axios, { type AxiosResponse } from 'axios';
import type {
  CrearEventoCompetencia,
  CrearParticipanteEvento,
  EventoCompetencia,
  ParticipanteEvento,
  EtapaEvento,
  GuardarEtapaEvento,
} from '../types/CompetitionEvent';

// URL base para la API del backend
const URL_BASE_API = __VITE_API_URL__ || 'http://127.0.0.1:8000/api';

// URL base del storage público de Laravel (sin el sufijo /api)
const URL_STORAGE_BASE = URL_BASE_API.replace(/\/api\/?$/, '');

// Convierte un path relativo del storage de Laravel (ej. "teams/logos/x.png")
// en una URL completa y usable en <img src>. Si ya es una URL absoluta (http/https), la deja igual.
export const resolverUrlImagen = (path?: string | null): string | null => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${URL_STORAGE_BASE}/storage/${path}`;
};

// Interfaz para respuestas estándar de la API
export interface RespuestaApi<T = any> {
  success: boolean;
  data: T;
  message: string | null;
}

// Interfaz del Usuario
export interface Usuario {
  id: number;
  name: string;
  email: string;
  dni?: string | null;
  phone?: string | null;
  is_active: boolean;
  roles: string[];
  permissions?: string[];
  championship_memberships?: {
    championship_id: number;
    role: 'organizer' | 'referee' | 'team_delegate' | 'score_table';
    team_id?: number | null;
    team_name?: string | null;
  }[];
}

// Datos de retorno al iniciar sesión o registrarse
export interface DatosAutenticacion {
  user: Usuario;
  token: string;
  type: string;
}

// Estructura de paginación para el listado de usuarios
export interface Paginacion {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}

// Respuesta para el listado de usuarios
export interface DatosUsuariosPaginados {
  users: Usuario[];
  pagination: Paginacion;
}
export interface DatosPartidosPaginados { matches: Partido[]; pagination: Paginacion; }
export interface DatosCampeonatosPaginados { championships: Campeonato[]; pagination: Paginacion; }

export interface DatosEquiposPaginados {
  teams: Equipo[];
  pagination: Paginacion;
}

export interface DatosJugadoresPaginados {
  players: Jugador[];
  pagination: Paginacion;
}

// Estructura de Rol simplificada
export interface Rol {
  id: number;
  name: string;
}

// Creación de la instancia de Axios
export const clienteApi = axios.create({
  baseURL: URL_BASE_API,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Interceptor para inyectar el Token de Sanctum y el X-Championship-ID en cada petición
clienteApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token_autenticacion');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // ── NUEVO: si el body es FormData, dejar que el navegador/Axios
    // generen el Content-Type con el boundary correcto.
    if (config.data instanceof FormData && config.headers) {
      const hdrs = config.headers as any;
      const keysToDelete = ['Content-Type', 'content-type'];
      keysToDelete.forEach(key => {
        delete hdrs[key];
        if (hdrs.common) delete hdrs.common[key];
        if (hdrs.post) delete hdrs.post[key];
        if (hdrs.put) delete hdrs.put[key];
        if (typeof hdrs.delete === 'function') {
          hdrs.delete(key);
        }
      });
    }

    const championshipId = localStorage.getItem('campeonato_activo_id');
    if (championshipId && config.headers) {
      config.headers['X-Championship-ID'] = championshipId;

      // Inyectar championship_id en los parámetros de consulta o en el cuerpo de la petición automáticamente
      const method = config.method?.toLowerCase();
      if (method === 'get') {
        config.params = {
          championship_id: championshipId,
          ...config.params
        };
      } else if (method && ['post', 'put', 'patch', 'delete'].includes(method)) {
        if (config.data && typeof config.data === 'object' && !(config.data instanceof FormData)) {
          config.data = {
            championship_id: championshipId,
            ...config.data
          };
        } else if (!config.data) {
          config.data = {
            championship_id: championshipId
          };
        } else if (config.data instanceof FormData) {
          if (!config.data.has('championship_id')) {
            config.data.append('championship_id', championshipId);
          }
        }
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para normalizar respuestas y capturar errores de autenticación
clienteApi.interceptors.response.use(
  (response) => {
    // Normalizar la respuesta si no viene envuelta en { success, data } y no es un Blob
    if (response.data && typeof response.data === 'object' && !Array.isArray(response.data) && !(response.data instanceof Blob)) {
      const keys = Object.keys(response.data);
      const isWrapped = keys.includes('success') && keys.includes('data');
      if (!isWrapped) {
        response.data = {
          success: true,
          data: response.data,
          message: null
        };
      }
    } else if (Array.isArray(response.data)) {
      response.data = {
        success: true,
        data: response.data,
        message: null
      };
    }
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Si el token es inválido o expiró, removemos los datos locales
      localStorage.removeItem('token_autenticacion');
      localStorage.removeItem('usuario_actual');
      localStorage.removeItem('campeonato_activo_id');
      localStorage.removeItem('campeonato_activo_name');
      localStorage.removeItem('campeonato_activo_type');
      localStorage.removeItem('campeonato_activo_status');
    }
    return Promise.reject(error);
  }
);

/**
 * Servicios de Autenticación
 */
export const serviciosAutenticacion = {
  // Registrar un nuevo usuario público
  registrar: async (datos: any): Promise<RespuestaApi<DatosAutenticacion>> => {
    const respuesta: AxiosResponse<RespuestaApi<DatosAutenticacion>> = await clienteApi.post('/register', datos);
    return respuesta.data;
  },

  // Iniciar sesión en el sistema
  iniciarSesion: async (datos: any): Promise<RespuestaApi<DatosAutenticacion>> => {
    const respuesta: AxiosResponse<RespuestaApi<DatosAutenticacion>> = await clienteApi.post('/login', datos);
    return respuesta.data;
  },

  // Cerrar sesión en el backend y eliminar tokens
  cerrarSesion: async (): Promise<RespuestaApi<null>> => {
    const respuesta: AxiosResponse<RespuestaApi<null>> = await clienteApi.post('/logout');
    return respuesta.data;
  },

  // Obtener la información del usuario autenticado actual
  obtenerUsuarioAutenticado: async (): Promise<RespuestaApi<Usuario>> => {
    const respuesta: AxiosResponse<RespuestaApi<Usuario>> = await clienteApi.get('/me');
    return respuesta.data;
  },

  // Solicitar recuperación de contraseña (envía enlace al correo)
  solicitarRecuperacion: async (correo: string): Promise<RespuestaApi<any>> => {
    const respuesta: AxiosResponse<RespuestaApi<any>> = await clienteApi.post('/forgot-password', { email: correo });
    return respuesta.data;
  },

  // Restablecer la contraseña usando el token
  restablecerContrasenia: async (datos: {
    token: string;
    email: string;
    password: string;
    password_confirmation: string;
  }): Promise<RespuestaApi<null>> => {
    const respuesta: AxiosResponse<RespuestaApi<null>> = await clienteApi.post('/reset-password', datos);
    return respuesta.data;
  },
};

/**
 * Servicios de Usuarios y Roles
 */
export const serviciosUsuarios = {
  // Obtener listado de usuarios paginado
  obtenerUsuarios: async (pagina: number = 1): Promise<RespuestaApi<DatosUsuariosPaginados>> => {
    const respuesta: AxiosResponse<RespuestaApi<DatosUsuariosPaginados>> = await clienteApi.get(`/users?page=${pagina}`);
    return respuesta.data;
  },

  // Obtener un usuario por ID
  obtenerUsuarioPorId: async (id: number): Promise<RespuestaApi<Usuario>> => {
    const respuesta: AxiosResponse<RespuestaApi<Usuario>> = await clienteApi.get(`/users/${id}`);
    return respuesta.data;
  },

  // Actualizar datos de un usuario
  actualizarUsuario: async (id: number, datos: any): Promise<RespuestaApi<Usuario>> => {
    const respuesta: AxiosResponse<RespuestaApi<Usuario>> = await clienteApi.put(`/users/${id}`, datos);
    return respuesta.data;
  },

  // Modificar el rol de un usuario
  cambiarRolUsuario: async (id: number, rol: string): Promise<RespuestaApi<Usuario>> => {
    const respuesta: AxiosResponse<RespuestaApi<Usuario>> = await clienteApi.put(`/users/${id}/role`, { role: rol });
    return respuesta.data;
  },

  // Eliminar lógicamente un usuario
  eliminarUsuario: async (id: number): Promise<RespuestaApi<null>> => {
    const respuesta: AxiosResponse<RespuestaApi<null>> = await clienteApi.delete(`/users/${id}`);
    return respuesta.data;
  },

  // Obtener listado de roles disponibles en el sistema
  obtenerRoles: async (): Promise<RespuestaApi<Rol[]>> => {
    const respuesta: AxiosResponse<RespuestaApi<Rol[]>> = await clienteApi.get('/roles');
    return respuesta.data;
  },
};

/**
 * Interfaces para los nuevos módulos
 */
export interface Disciplina {
  id: number;
  name: string;
  description?: string | null;
  rules?: string | null;
  status: string;
}

export interface ChampionshipDiscipline {
  id: number;
  championship_id: number;
  discipline_id: number;
  specific_rules?: {
    match_duration?: number;
    substitutions_limit?: number;
    [key: string]: any;
  } | null;
  discipline?: Disciplina;
  match_duration_minutes?: number;
  match_duration_settings?: any;
}

export interface Categoria {
  id: number;
  name: string;
  age_min?: number | null;
  age_max?: number | null;
  gender: string;
  gender_type?: string;
  discipline_id?: number | null;
  championship_discipline_id: number;
  championship_discipline?: ChampionshipDiscipline;
  format?: 'liga' | 'grupos' | 'eliminacion_directa';
  format_settings?: {
    num_groups?: number;
    advance_per_group?: number;
    third_place?: boolean;
  } | null;
}

export interface Organizacion {
  id: number;
  name: string;
  delegate_name: string;
}

export interface Equipo {
  id: number;
  name: string;
  logo?: string | null;
  representative?: string | null;
  registration_status?: 'pendiente' | 'aprobado' | 'rechazado';
  category?: {
    id: number;
    name: string;
    gender_type?: string | null;
  } | null;
  discipline?: {
    id: number;
    name: string;
  } | null;
  delegate?: {
    id: number;
    name: string;
    email: string;
  } | null;
  championship_user?: {
    user_id?: number;
    user?: {
      name?: string;
      email?: string;
    };
  } | null;
}

export interface Jugador {
  id: number;
  name: string;
  dni?: string | null;
  phone?: string | null;
  age?: number | null;
  birth_date?: string | null;
  team_id: number;
  number?: number | null;
  position?: string | null;
  photo?: string | null;
  team?: Equipo;
}

export interface Escenario {
  id: number;
  name: string;
  venue_type: string;
  location: string;
  capacity?: number | null;
  is_available: boolean;
}

export interface Partido {
  id: number;
  venue_id?: number | null;
  discipline_id: number;
  category_id: number;
  local_team_id: number | null;
  visitor_team_id: number | null;
  match_date?: string | null;
  match_time?: string | null;
  round: number;
  phase?: string | null;
  group_id?: number | null;
  status: string;
  home_score?: number | null;
  away_score?: number | null;
  venue?: Escenario;
  discipline?: Disciplina;
  category?: Categoria;
  local_team?: Equipo;
  visitor_team?: Equipo;
  report?: ActaPartido;
  incidences?: Incidencia[];
  current_elapsed_time?: number;
  current_period?: number;
  timer_status?: 'stopped' | 'running' | 'paused' | 'finished';
  timer_started_at?: string | null;
  parent_home_match_id?: number | null;
  parent_away_match_id?: number | null;
  placeholder_text_home?: string | null;
  placeholder_text_away?: string | null;
  extra_time_minutes?: number;
  has_extra_time?: boolean;
  max_extra_time?: number;
}

export interface ActaPartido {
  id: number;
  match_id: number;
  local_score: number;
  visitor_score: number;
  referee_signature?: string | null;
  delegate_signature?: string | null;
  observations?: string | null;
  is_locked: boolean;
}

export interface Incidencia {
  id: number;
  match_id: number;
  player_id?: number | null;
  team_id: number;
  incidence_type: 'goal' | 'yellow_card' | 'red_card' | 'foul' | 'injury';
  minute: number;
  second?: number | null;
  description?: string | null;
  player?: Jugador;
}

export interface Sancion {
  id: number;
  player_id: number;
  origin_match_id: number;
  sanction_type: string;
  reason: string;
  start_date: string;
  end_date?: string | null;
  duration?: number | null;
  status: string;
  player?: Jugador;
  match?: Partido;
}

export interface Posicion {
  id?: number | null;
  team_id: number;
  discipline_id?: number;
  category_id: number;
  matches_played: number;
  matches_won?: number;
  matches_drawn?: number;
  matches_lost?: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  total_points?: number;
  points: number;
  team?: Equipo;
  championship_id?: number;
  last_updated?: string | null;
  wins_total?: number;
  losses_total?: number;
  sets_for?: number;
  sets_against?: number;
  sets_ratio?: number;
  points_for?: number;
  points_against?: number;
  points_ratio?: number;
  win_percentage?: number;
  games_behind?: number;
  streak?: string | null;
}
export interface TipoEstadistica {
  id: number;
  order: number;
  statistic_type: {
    id: number;
    slug: string;
    display_name: string;
  };
}

export interface RankingItem {
  player_id: number;
  player_name: string;
  team: string | null;
  value: number;
  statistic: {
    id: number;
    slug: string;
    display_name: string;
  };
}

export interface EstadisticaJugador {
  id: number;
  player_id: number;
  matches_played: number;
  goals: number;
  yellow_cards: number;
  red_cards: number;
  player?: Jugador;
}

/**
 * Servicios de Gestión de Participantes
 */
export const serviciosParticipantes = {
  // Disciplinas
  obtenerDisciplinas: async (): Promise<RespuestaApi<Disciplina[]>> => {
    const res = await clienteApi.get('/disciplines');
    return res.data;
  },
  crearDisciplina: async (datos: any): Promise<RespuestaApi<Disciplina>> => {
    const res = await clienteApi.post('/disciplines', datos);
    return res.data;
  },
  eliminarDisciplina: async (id: number): Promise<RespuestaApi<null>> => {
    const res = await clienteApi.delete(`/disciplines/${id}`);
    return res.data;
  },

  // Disciplinas de Campeonato (ChampionshipDiscipline)
  obtenerDisciplinasCampeonato: async (championshipId: number): Promise<RespuestaApi<ChampionshipDiscipline[]>> => {
    const res = await clienteApi.get(`/championships/${championshipId}/disciplines`);
    return res.data;
  },
  agregarDisciplinaCampeonato: async (championshipId: number, datos: { discipline_id: number; specific_rules?: any }): Promise<RespuestaApi<ChampionshipDiscipline>> => {
    const res = await clienteApi.post(`/championships/${championshipId}/disciplines`, datos);
    return res.data;
  },
  eliminarDisciplinaCampeonato: async (id: number): Promise<RespuestaApi<null>> => {
    const res = await clienteApi.delete(`/championship-disciplines/${id}`);
    return res.data;
  },

  // Categorías
  obtenerCategorias: async (championshipDisciplineId: number): Promise<RespuestaApi<Categoria[]>> => {
    const res = await clienteApi.get(`/championship-disciplines/${championshipDisciplineId}/categories`);
    return res.data;
  },
  obtenerCategoriasPorCampeonato: async (championshipId: number): Promise<RespuestaApi<Categoria[]>> => {
    const res = await clienteApi.get(`/championships/${championshipId}/categories`);
    return res.data;
  },
  crearCategoria: async (championshipDisciplineId: number, datos: any): Promise<RespuestaApi<Categoria>> => {
    const res = await clienteApi.post(`/championship-disciplines/${championshipDisciplineId}/categories`, datos);
    return res.data;
  },
  crearCategoriaPorCampeonato: async (championshipId: number, datos: any): Promise<RespuestaApi<Categoria>> => {
    const res = await clienteApi.post(`/championships/${championshipId}/categories`, datos);
    return res.data;
  },
  actualizarCategoria: async (id: number, datos: any): Promise<RespuestaApi<Categoria>> => {
    const res = await clienteApi.put(`/categories/${id}`, datos);
    return res.data;
  },
  eliminarCategoria: async (id: number): Promise<RespuestaApi<null>> => {
    const res = await clienteApi.delete(`/categories/${id}`);
    return res.data;
  },
  obtenerGrupos: async (categoryId: number): Promise<RespuestaApi<any[]>> => {
    const res = await clienteApi.get(`/groups?category_id=${categoryId}`);
    return res.data;
  },

  // Importar categorías y equipos desde un archivo CSV o Excel
  importarCategoriasYEquipos: async (championshipId: number, datos: FormData) => {
  const res = await clienteApi.post(`/championships/${championshipId}/import`, datos);
  return res.data;
  },

  actualizarConfiguracionDisciplina: async (championshipDisciplineId: number, datos: {
    match_duration_minutes?: number;
    specific_rules?: any;
  }): Promise<RespuestaApi<ChampionshipDiscipline>> => {
    const res = await clienteApi.put(`/championship-disciplines/${championshipDisciplineId}`, datos);
    return res.data;
  },

  // Equipos
  obtenerEquiposBase: async (availableForChampionship: boolean = false): Promise<RespuestaApi<Equipo[]>> => {
    if (availableForChampionship) {
      const res = await clienteApi.get(`/teams?available=${availableForChampionship}`);
      return res.data;
    }
    const res = await clienteApi.get('/teams');
    return res.data;
  },

  // Championship Teams (Equipos de Campeonato)
  obtenerEquipos: async (params: { page?: number; per_page?: number; search?: string; category_id?: number; registration_status?: string; sort?: string; direction?: 'asc' | 'desc' } = {}): Promise<RespuestaApi<DatosEquiposPaginados>> => {
    const res = await clienteApi.get('/championshipTeams', { params });
    return res.data;
  },
  obtenerTodosEquipos: async (): Promise<RespuestaApi<Equipo[]>> => {
    const res = await serviciosParticipantes.obtenerEquipos({ page: 1, per_page: 100 });
    return { success: res.success, data: res.success ? res.data.teams : [], message: res.message };
  },
  obtenerEquiposPorCategoria: async (categoryId: number): Promise<RespuestaApi<Equipo[]>> => {
    const res = await clienteApi.get(`/categories/${categoryId}/teams`);
    return res.data;
  },
  crearEquipo: async (datos: any): Promise<RespuestaApi<Equipo>> => {
    if (datos instanceof FormData) {
      const res = await clienteApi.post('/championshipTeams', datos); // ← sin headers manuales
      return res.data;
    }
    const res = await clienteApi.post('/championshipTeams', datos);
    return res.data;
  },
  actualizarEquipo: async (id: number, datos: any): Promise<RespuestaApi<Equipo>> => {
    if (datos instanceof FormData) {
      if (!datos.has('_method')) {
        datos.append('_method', 'PUT');
      }
      const res = await clienteApi.post(`/championshipTeams/${id}`, datos); // ← sin headers manuales
      return res.data;
    }
    const res = await clienteApi.put(`/championshipTeams/${id}`, datos);
    return res.data;
  },
  eliminarEquipo: async (id: number): Promise<RespuestaApi<null>> => {
    const res = await clienteApi.delete(`/championshipTeams/${id}`);
    return res.data;
  },
  anadirVariosEquiposExistentes: async (teamIds: number[]): Promise<RespuestaApi<any>> => {
    const res = await clienteApi.post('/championshipTeams/addExistingTeams', {
      team_ids: teamIds
    });
    return res.data;
  },

  // Jugadores
  obtenerJugadores: async (availableForChampionship: boolean = false): Promise<RespuestaApi<Jugador[]>> => {
    if (availableForChampionship) {
      const res = await clienteApi.get(`/players?available=${availableForChampionship}`);
      return res.data;
    }
    const res = await clienteApi.get('/players');
    return res.data;
  },
  crearJugador: async (datos: any): Promise<RespuestaApi<Jugador>> => {
    const res = await clienteApi.post('/players', datos);
    return res.data;
  },
  eliminarJugador: async (id: number): Promise<RespuestaApi<null>> => {
    const res = await clienteApi.delete(`/players/${id}`);
    return res.data;
  },
  // Jugadores de un campeonato específico
  obtenerJugadoresPorCampeonato: async (params: { page?: number; per_page?: number; search?: string; championship_team_id?: number; category_id?: number; available_for_event_id?: number } = {}): Promise<RespuestaApi<DatosJugadoresPaginados>> => {
    const res = await clienteApi.get('/championshipPlayers', { params });
    return res.data;
  },
  obtenerTodosJugadoresPorCampeonato: async (): Promise<RespuestaApi<Jugador[]>> => {
    const res = await serviciosParticipantes.obtenerJugadoresPorCampeonato({ page: 1, per_page: 100 });
    return { success: res.success, data: res.success ? res.data.players : [], message: res.message };
  },

  eliminarJugadorDeCampeonato: async (id: number): Promise<RespuestaApi<null>> => {
    const res = await clienteApi.delete(`/championshipPlayers/${id}`);
    return res.data;
  },

  crearJugadorEnCampeonato: async (datos: any): Promise<RespuestaApi<Jugador>> => {
    const res = await clienteApi.post('/championshipPlayers', datos);
    return res.data;
  },

  actualizarJugadorEnCampeonato: async (id: number, datos: any): Promise<RespuestaApi<Jugador>> => {
    if (datos instanceof FormData) {
      if (!datos.has('_method')) {
        datos.append('_method', 'PUT');
      }
      const res = await clienteApi.post(`/championshipPlayers/${id}`, datos);
      return res.data;
    } 
    const res = await clienteApi.put(`/championshipPlayers/${id}`, datos);
    return res.data;
  },

  anadirVariosJugadoresExistentes: async (playerIds: number[], championshipTeamId: number | null = null): Promise<RespuestaApi<any>> => {
    const res = await clienteApi.post('/championshipPlayers/addExistingPlayers', {
      player_ids: playerIds,
      championship_team_id: championshipTeamId
    });
    return res.data;
  },


  // Actualizar datos de un jugador
  actualizarJugador: async (
    id: number,
    datos: any
  ): Promise<RespuestaApi<Jugador>> => {
    if (datos instanceof FormData) {
      if (!datos.has('_method')) {
        datos.append('_method', 'PUT');
      }
      const res = await clienteApi.post(`/players/${id}`, datos);
      return res.data;
    }
    const res = await clienteApi.put(`/players/${id}`, datos);
    return res.data;
  },
};

/**
 * Servicios de Fixture y Programación
 */
export const serviciosFixture = {
  // Escenarios
  obtenerEscenarios: async (): Promise<RespuestaApi<Escenario[]>> => {
    const res = await clienteApi.get('/venues');
    return res.data;
  },
  crearEscenario: async (datos: any): Promise<RespuestaApi<Escenario>> => {
    const res = await clienteApi.post('/venues', datos);
    return res.data;
  },
  actualizarEscenario: async (id: number, datos: any): Promise<RespuestaApi<Escenario>> => {
    const res = await clienteApi.put(`/venues/${id}`, datos);
    return res.data;
  },
  eliminarEscenario: async (id: number): Promise<RespuestaApi<null>> => {
    const res = await clienteApi.delete(`/venues/${id}`);
    return res.data;
  },

  // Partidos
  obtenerPartidos: async (params: { page?: number; per_page?: number } = {}): Promise<RespuestaApi<DatosPartidosPaginados>> => {
    const res = await clienteApi.get('/matches', { params });
    return res.data;
  },
  obtenerTodosPartidos: async (): Promise<RespuestaApi<Partido[]>> => {
    const res = await serviciosFixture.obtenerPartidos({ page: 1, per_page: 100 });
    return { success: res.success, data: res.success ? res.data.matches : [], message: res.message };
  },
  actualizarPartido: async (id: number, datos: any): Promise<RespuestaApi<Partido>> => {
    const res = await clienteApi.put(`/matches/${id}`, datos);
    return res.data;
  },
  reprogramarPartido: async (id: number, datos: { match_date: string; match_time: string; venue_id: number }): Promise<RespuestaApi<Partido>> => {
    const res = await clienteApi.put(`/matches/${id}/reschedule`, datos);
    return res.data;
  },

  actualizarTiempoExtra: async (id: number, datos: {
  extra_time_minutes: number;
  has_extra_time: boolean;
  }): Promise<RespuestaApi<Partido>> => {
    const res = await clienteApi.put(`/matches/${id}/extra-time`, datos);
    return res.data;
  },

  sincronizarTimer: async (id: number, datos: {
  current_elapsed_time: number;
  current_period: number;
  timer_status: 'stopped' | 'running' | 'paused' | 'finished';
  timer_started_at: string | null;
  }): Promise<RespuestaApi<any>> => {
    const res = await clienteApi.put(`/matches/${id}/sync-timer`, datos);
    return res.data;
  },

  // Fixture
  generarFixture: async (datos: {
    discipline_id: number;
    category_id: number;
    start_date: string;
    venue_ids: number[];
  }): Promise<RespuestaApi<any>> => {
    const res = await clienteApi.post('/fixture/generate', datos);
    return res.data;
  },
  obtenerFixture: async (disciplineId: number, categoryId: number): Promise<RespuestaApi<Partido[]>> => {
    const res = await clienteApi.get(`/fixture?discipline_id=${disciplineId}&category_id=${categoryId}`);
    return res.data;
  },
  programarFecha: async (datos: {
    discipline_id: number;
    category_id: number;
    round: number;
    available_hours: string[];
    venue_ids: number[];
  }): Promise<RespuestaApi<any>> => {
    const res = await clienteApi.post('/fixture/schedule-round', datos);
    return res.data;
  },
};

// Servicios de eventos y programacion de competencias (para disciplinas de atletismo, natación, etc.)
export const serviciosEventosCompetencia = {
  // crear evento de competencia
  crearEvento: async (datos: CrearEventoCompetencia): Promise<RespuestaApi<EventoCompetencia>> => {
    const res = await clienteApi.post('/competition-events', datos);
    return res.data;
  },

  obtenerEventos: async (params?: {
    championship_discipline_id?: number;
    category_id?: number;
    date?: string;
    status?: string;
  }): Promise<RespuestaApi<EventoCompetencia[]>> => {
    const response = await clienteApi.get('/competition-events', {
      params
    });

    return response.data;
  },

  obtenerParticipantes: async (eventoId: number): Promise<RespuestaApi<ParticipanteEvento[]>> => {
    const response = await clienteApi.get(
      '/competition-event-participants',
      {
        params: {
          competition_event_id: eventoId
        }
      }
    );

    return response.data;
  },

  agregarParticipante: async (datos: CrearParticipanteEvento): Promise<RespuestaApi<any>> => {
    const response = await clienteApi.post(
      '/competition-event-participants',
      datos
    );

    return response.data;
  },

  eliminarParticipante: async (id: number): Promise<RespuestaApi<any>> => {
    const response = await clienteApi.delete(
      `/competition-event-participants/${id}`
    );

    return response.data;
  },

  actualizarParticipante: async (
    id: number,
    datos: {
      lane?: number | null;
      start_order?: number | null;
      status?: string;
    }
  ): Promise<RespuestaApi<any>> => {
    const response = await clienteApi.put(
      `/competition-event-participants/${id}`,
      datos
    );

    return response.data;
  },

  actualizarEvento: async (
    id: number,
    datos: {
      championship_discipline_id?: number;
      category_id?: number;
      name?: string;
      event_type?: 'carrera' | 'salto' | 'lanzamiento' | 'puntaje';
      date?: string;
      start_time?: string | null;
      venue_id?: number | null;
      status?: 'programado' | 'en_curso' | 'finalizado' | 'cancelado';
    }
  ): Promise<RespuestaApi<any>> => {
    const response = await clienteApi.put(
      `/competition-events/${id}`,
      datos
    );

    return response.data;
  },

  eliminarEvento: async (id: number): Promise<RespuestaApi<any>> => {
    const response = await clienteApi.delete(
      `/competition-events/${id}`
    );

    return response.data;
  },

  obtenerEtapas: async (
    eventoId: number
  ): Promise<RespuestaApi<EtapaEvento[]>> => {
    const response = await clienteApi.get(
      `/competition-events/${eventoId}/stages`
    );

    return response.data;
  },

  crearEtapa: async (
    eventoId: number,
    datos: GuardarEtapaEvento
  ): Promise<RespuestaApi<EtapaEvento>> => {
    const response = await clienteApi.post(
      `/competition-events/${eventoId}/stages`,
      datos
    );

    return response.data;
  },

  actualizarEtapa: async (
    etapaId: number,
    datos: GuardarEtapaEvento
  ): Promise<RespuestaApi<EtapaEvento>> => {
    const response = await clienteApi.put(
      `/competition-event-stages/${etapaId}`,
      datos
    );

    return response.data;
  },

  eliminarEtapa: async (
    etapaId: number
  ): Promise<RespuestaApi<null>> => {
    const response = await clienteApi.delete(
      `/competition-event-stages/${etapaId}`
    );

    return response.data;
  },
}

/**
 * Servicios de Resultados, Incidencias y Sanciones
 */
export const serviciosResultados = {
  // Actas de Partido
  registrarActa: async (datos: {
    match_id: number;
    local_score: number;
    visitor_score: number;
    referee_signature?: string;
    delegate_signature?: string;
    observations?: string;
  }): Promise<RespuestaApi<ActaPartido>> => {
    const res = await clienteApi.post('/match-reports', datos);
    return res.data;
  },
  actualizarActa: async (id: number, datos: {
    local_score: number;
    visitor_score: number;
    referee_signature?: string;
    delegate_signature?: string;
    observations?: string;
  }): Promise<RespuestaApi<ActaPartido>> => {
    const res = await clienteApi.put(`/match-reports/${id}`, datos);
    return res.data;
  },
  bloquearActa: async (id: number): Promise<RespuestaApi<ActaPartido>> => {
    const res = await clienteApi.post(`/match-reports/${id}/lock`);
    return res.data;
  },
  obtenerActaPorPartido: async (matchId: number): Promise<RespuestaApi<ActaPartido>> => {
    const res = await clienteApi.get(`/match-reports/by-match/${matchId}`);
    return res.data;
  },

  // Incidencias
  registrarIncidencia: async (datos: {
    match_id: number;
    player_id?: number | null;
    team_id: number;
    incidence_type: string;
    minute: number;
    second?: number;
    description?: string;
  }): Promise<RespuestaApi<Incidencia>> => {
    const res = await clienteApi.post('/match-incidences', datos);
    return res.data;
  },
  eliminarIncidencia: async (id: number): Promise<RespuestaApi<null>> => {
    const res = await clienteApi.delete(`/match-incidences/${id}`);
    return res.data;
  },
  obtenerIncidenciasPorPartido: async (matchId: number): Promise<RespuestaApi<Incidencia[]>> => {
    const res = await clienteApi.get(`/match-incidences?match_id=${matchId}`);
    return res.data;
  },

  // Sanciones
  obtenerSanciones: async (teamId?: number): Promise<RespuestaApi<Sancion[]>> => {
    const res = await clienteApi.get('/sanctions', { params: teamId ? { team_id: teamId } : undefined });
    return res.data;
  },
  obtenerReportePartido: async (matchId: number): Promise<RespuestaApi<any>> => {
    const res = await clienteApi.get(`/match-reports/by-match/${matchId}`);
    return res.data;
  },

  // Tabla de posiciones
  obtenerPosiciones: async (disciplineId?: number, categoryId?: number): Promise<RespuestaApi<Posicion[]>> => {
    let url = '/standings';
    const params: string[] = [];
    if (disciplineId) params.push(`discipline_id=${disciplineId}`);
    if (categoryId) params.push(`category_id=${categoryId}`);
    if (params.length > 0) url += `?${params.join('&')}`;
    const res = await clienteApi.get(url);
    return res.data;
  },

  // Estadísticas generales y dinámicas
  obtenerEstadisticasPorDisciplina: async (disciplineId: number): Promise<RespuestaApi<TipoEstadistica[]>> => {
    const res = await clienteApi.get(`/disciplines/${disciplineId}/statistics`);
    return res.data;
  },
  obtenerRankingEstadisticas: async (params: {
    discipline_id: number;
    statistic_type_id: number;
    championship_id?: number;
    category_id?: number;
    limit?: number;
  }): Promise<RespuestaApi<RankingItem[]>> => {
    let url = '/statistics/ranking';
    const parts: string[] = [];
    parts.push(`discipline_id=${params.discipline_id}`);
    parts.push(`statistic_type_id=${params.statistic_type_id}`);
    if (params.championship_id) parts.push(`championship_id=${params.championship_id}`);
    if (params.category_id) parts.push(`category_id=${params.category_id}`);
    if (params.limit) parts.push(`limit=${params.limit}`);
    url += `?${parts.join('&')}`;
    const res = await clienteApi.get(url);
    return res.data;
  },

  obtenerPosicionesCompletas: async (params: {
    championship_id: number;
    category_id: number;
    discipline_id?: number;
  }): Promise<RespuestaApi<any[]>> => {
    let url = '/standings/complete';
    const parts: string[] = [];
    parts.push(`championship_id=${params.championship_id}`);
    parts.push(`category_id=${params.category_id}`);
    if (params.discipline_id) parts.push(`discipline_id=${params.discipline_id}`);
    url += `?${parts.join('&')}`;
    const res = await clienteApi.get(url);
    return res.data;
  },
};

/**
 * Interfaces para SaaS Multi-Campeonato
 */
export interface Campeonato {
  id: number;
  name: string;
  type: 'basico' | 'completo';
  status: string;
  user_id?: number;
  rules_pdf?: string | null;
  settings?: any;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  is_public?: boolean;
}

export interface ChampionshipUser {
  id: number;
  championship_id: number;
  user_id: number;
  role: 'team_delegate' | 'score_table' | string;
  team_id?: number | null;
  user?: Usuario;
  team?: Equipo;
}

export interface TenantInfo {
  id: number;
  name: string;
  email: string;
  championships_count: number;
  is_active: boolean;
}

/**
 * Servicios de SaaS
 */
export const serviciosCampeonatos = {
  obtenerCampeonato: async (id: number): Promise<RespuestaApi<Campeonato>> => {
    try {
      const res = await clienteApi.get(`/championships/${id}`);
      return res.data;
    } catch (err) {
      const locales = localStorage.getItem('campeonatos_simulados');
      const lista: Campeonato[] = locales ? JSON.parse(locales) : [];
      const found = lista.find((c) => c.id === id);
      if (found) {
        return { success: true, data: found, message: 'Retornado de fallback local' };
      }
      return { success: false, data: null as any, message: 'Campeonato no encontrado' };
    }
  },
  obtenerUsuariosCampeonato: async (championshipId: number): Promise<RespuestaApi<ChampionshipUser[]>> => {
    const res = await clienteApi.get(`/championships/${championshipId}/users`);
    return res.data;
  },
  agregarUsuarioCampeonato: async (championshipId: number, datos: { user_id: number; role: string; team_id?: number | null }): Promise<RespuestaApi<ChampionshipUser>> => {
    const res = await clienteApi.post(`/championships/${championshipId}/users`, datos);
    return res.data;
  },
  actualizarRolUsuarioCampeonato: async (id: number, datos: { role: string; team_id?: number | null }): Promise<RespuestaApi<ChampionshipUser>> => {
    const res = await clienteApi.put(`/championship-users/${id}`, datos);
    return res.data;
  },
  removerUsuarioCampeonato: async (id: number): Promise<RespuestaApi<null>> => {
    const res = await clienteApi.delete(`/championship-users/${id}`);
    return res.data;
  },
  obtenerCampeonatos: async (params: { page?: number; per_page?: number } = {}): Promise<RespuestaApi<DatosCampeonatosPaginados>> => {
    try {
      const res = await clienteApi.get('/championships', { params });
      return res.data;
    } catch (err) {
      // Fallback a localStorage si el backend no ha implementado la ruta
      const locales = localStorage.getItem('campeonatos_simulados');
      const lista: Campeonato[] = locales ? JSON.parse(locales) : [
        { id: 1, name: 'Liga de Fútbol Intercolegios', type: 'basico', status: 'en_curso', rules_pdf: null },
        { id: 2, name: 'Campeonato Colegio de Ingenieros Arequipa', type: 'completo', status: 'creado', rules_pdf: null }
      ];
      if (!locales) {
        localStorage.setItem('campeonatos_simulados', JSON.stringify(lista));
      }
      return { success: true, data: { championships: lista, pagination: { total: lista.length, per_page: lista.length, current_page: 1, last_page: 1 } }, message: 'Retornado de fallback local' };
    }
  },
  obtenerTodosCampeonatos: async (): Promise<RespuestaApi<Campeonato[]>> => {
    const res = await serviciosCampeonatos.obtenerCampeonatos({ page: 1, per_page: 100 });
    return { success: res.success, data: res.success ? res.data.championships : [], message: res.message };
  },
  crearCampeonato: async (datos: any): Promise<RespuestaApi<Campeonato>> => {
    try {
      const res = await clienteApi.post('/championships', datos);
      return res.data;
    } catch (err) {
      // Fallback
      const locales = localStorage.getItem('campeonatos_simulados');
      const lista: Campeonato[] = locales ? JSON.parse(locales) : [];
      let name = '';
      let type: 'basico' | 'completo' = 'basico';
      if (datos instanceof FormData) {
        name = datos.get('name') as string || '';
        type = (datos.get('type') as 'basico' | 'completo') || 'basico';
      } else if (datos) {
        name = datos.name || '';
        type = datos.type || 'basico';
      }
      const nuevo: Campeonato = {
        id: lista.length > 0 ? Math.max(...lista.map((c) => c.id)) + 1 : 1,
        name: name,
        type: type,
        status: 'creado',
        rules_pdf: null
      };
      lista.push(nuevo);
      localStorage.setItem('campeonatos_simulados', JSON.stringify(lista));
      return { success: true, data: nuevo, message: 'Guardado en fallback local' };
    }
  },
  descargarReglamento: async (id: number): Promise<Blob> => {
    const res = await clienteApi.get(`/championships/${id}/rules`, {
      responseType: 'blob'
    });
    return res.data;
  },
  actualizarCampeonato: async (id: number, datos: any): Promise<RespuestaApi<Campeonato>> => {
    if (datos instanceof FormData) {
      if (!datos.has('_method')) {
        datos.append('_method', 'PUT');
      }
      const res = await clienteApi.post(`/championships/${id}`, datos);
      return res.data;
    } else {
      const res = await clienteApi.put(`/championships/${id}`, datos);
      return res.data;
    }
  },
  eliminarCampeonato: async (id: number): Promise<RespuestaApi<null>> => {
    try {
      const res = await clienteApi.delete(`/championships/${id}`);
      return res.data;
    } catch (err) {
      // Fallback a localStorage si el backend falla o no lo implementa
      const locales = localStorage.getItem('campeonatos_simulados');
      if (locales) {
        const lista: Campeonato[] = JSON.parse(locales);
        const filtrada = lista.filter((c) => c.id !== id);
        localStorage.setItem('campeonatos_simulados', JSON.stringify(filtrada));
      }
      return { success: true, data: null, message: 'Campeonato eliminado (fallback)' };
    }
  }
};

export const serviciosSuperAdmin = {
  obtenerTenants: async (): Promise<RespuestaApi<TenantInfo[]>> => {
    // Retornar directamente la lista de mock/fallback local sin hacer la petición HTTP
    // ya que el backend no implementa este endpoint (es una simulación SaaS)
    const lista: TenantInfo[] = [
      { id: 1, name: 'Organizador', email: 'organizador@ligacenter.com', championships_count: 2, is_active: true },
      { id: 2, name: 'Juan Pérez', email: 'juan@ligacenter.com', championships_count: 1, is_active: true },
      { id: 3, name: 'Mesa Control', email: 'mesa@ligacenter.com', championships_count: 0, is_active: true }
    ];
    return { success: true, data: lista, message: 'Retornado de mock local' };
  }
};
