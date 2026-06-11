import axios, { type AxiosResponse } from 'axios';

// URL base para la API del backend
const URL_BASE_API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

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
    // Normalizar la respuesta si no viene envuelta en { success, data }
    if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
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
      // Podríamos redirigir a login, pero dejamos que el Contexto de Autenticación lo maneje
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

export interface Categoria {
  id: number;
  name: string;
  age_min?: number | null;
  age_max?: number | null;
  gender: string;
  gender_type?: string;
  discipline_id: number;
  championship_id: number;
  discipline?: Disciplina;
}

export interface Organizacion {
  id: number;
  name: string;
  delegate_name: string;
}

export interface Equipo {
  id: number;
  name: string;
  logo_url?: string | null;
  representative?: string | null;
  organization_id: number;
  organization?: Organizacion;
  registration_status?: 'pendiente' | 'aprobado' | 'rechazado';
}

export interface Jugador {
  id: number;
  name: string;
  dni?: string | null;
  phone?: string | null;
  team_id: number;
  number?: number | null;
  position?: string | null;
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
  local_team_id: number;
  visitor_team_id: number;
  match_date?: string | null;
  match_time?: string | null;
  round: number;
  status: string;
  venue?: Escenario;
  discipline?: Disciplina;
  category?: Categoria;
  local_team?: Equipo;
  visitor_team?: Equipo;
  report?: ActaPartido;
  incidences?: Incidencia[];
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
  id: number;
  team_id: number;
  discipline_id: number;
  category_id: number;
  matches_played: number;
  matches_won: number;
  matches_drawn: number;
  matches_lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  total_points: number;
  team?: Equipo;
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

  // Categorías
  obtenerCategorias: async (): Promise<RespuestaApi<Categoria[]>> => {
    const res = await clienteApi.get('/categories');
    return res.data;
  },
  crearCategoria: async (datos: any): Promise<RespuestaApi<Categoria>> => {
    const res = await clienteApi.post('/categories', datos);
    return res.data;
  },
  eliminarCategoria: async (id: number): Promise<RespuestaApi<null>> => {
    const res = await clienteApi.delete(`/categories/${id}`);
    return res.data;
  },

  // Organizaciones
  obtenerOrganizaciones: async (): Promise<RespuestaApi<Organizacion[]>> => {
    const res = await clienteApi.get('/organizations');
    return res.data;
  },
  crearOrganizacion: async (datos: any): Promise<RespuestaApi<Organizacion>> => {
    const res = await clienteApi.post('/organizations', datos);
    return res.data;
  },
  eliminarOrganizacion: async (id: number): Promise<RespuestaApi<null>> => {
    const res = await clienteApi.delete(`/organizations/${id}`);
    return res.data;
  },

  // Equipos
  obtenerEquipos: async (): Promise<RespuestaApi<Equipo[]>> => {
    const res = await clienteApi.get('/teams');
    return res.data;
  },
  crearEquipo: async (datos: any): Promise<RespuestaApi<Equipo>> => {
    const res = await clienteApi.post('/teams', datos);
    return res.data;
  },
  actualizarEquipo: async (id: number, datos: any): Promise<RespuestaApi<Equipo>> => {
    const res = await clienteApi.put(`/teams/${id}`, datos);
    return res.data;
  },
  eliminarEquipo: async (id: number): Promise<RespuestaApi<null>> => {
    const res = await clienteApi.delete(`/teams/${id}`);
    return res.data;
  },

  // Jugadores
  obtenerJugadores: async (): Promise<RespuestaApi<Jugador[]>> => {
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
  eliminarEscenario: async (id: number): Promise<RespuestaApi<null>> => {
    const res = await clienteApi.delete(`/venues/${id}`);
    return res.data;
  },

  // Partidos
  obtenerPartidos: async (): Promise<RespuestaApi<Partido[]>> => {
    const res = await clienteApi.get('/matches');
    return res.data;
  },
  actualizarPartido: async (id: number, datos: any): Promise<RespuestaApi<Partido>> => {
    const res = await clienteApi.put(`/matches/${id}`, datos);
    return res.data;
  },
  reprogramarPartido: async (id: number, datos: { match_date: string; match_time: string; venue_id: number }): Promise<RespuestaApi<Partido>> => {
    const res = await clienteApi.put(`/matches/${id}/reschedule`, datos);
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
  obtenerSanciones: async (): Promise<RespuestaApi<Sancion[]>> => {
    const res = await clienteApi.get('/sanctions');
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

  // Estadísticas generales
  obtenerGoleadores: async (): Promise<RespuestaApi<EstadisticaJugador[]>> => {
    const res = await clienteApi.get('/statistics/top-scorers');
    return res.data;
  },
  obtenerTarjetasAmarillas: async (): Promise<RespuestaApi<EstadisticaJugador[]>> => {
    const res = await clienteApi.get('/statistics/top-yellow-cards');
    return res.data;
  },
  obtenerTarjetasRojas: async (): Promise<RespuestaApi<EstadisticaJugador[]>> => {
    const res = await clienteApi.get('/statistics/top-red-cards');
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
  obtenerCampeonatos: async (): Promise<RespuestaApi<Campeonato[]>> => {
    try {
      const res = await clienteApi.get('/championships');
      return res.data;
    } catch (err) {
      // Fallback a localStorage si el backend no ha implementado la ruta
      const locales = localStorage.getItem('campeonatos_simulados');
      const lista: Campeonato[] = locales ? JSON.parse(locales) : [
        { id: 1, name: 'Liga de Fútbol Intercolegios', type: 'basico', status: 'en_curso' },
        { id: 2, name: 'Campeonato Colegio de Ingenieros Arequipa', type: 'completo', status: 'creado' }
      ];
      if (!locales) {
        localStorage.setItem('campeonatos_simulados', JSON.stringify(lista));
      }
      return { success: true, data: lista, message: 'Retornado de fallback local' };
    }
  },
  crearCampeonato: async (datos: { name: string; type: 'basico' | 'completo' }): Promise<RespuestaApi<Campeonato>> => {
    try {
      const res = await clienteApi.post('/championships', datos);
      return res.data;
    } catch (err) {
      // Fallback
      const locales = localStorage.getItem('campeonatos_simulados');
      const lista: Campeonato[] = locales ? JSON.parse(locales) : [];
      const nuevo: Campeonato = {
        id: lista.length > 0 ? Math.max(...lista.map((c) => c.id)) + 1 : 1,
        name: datos.name,
        type: datos.type,
        status: 'creado'
      };
      lista.push(nuevo);
      localStorage.setItem('campeonatos_simulados', JSON.stringify(lista));
      return { success: true, data: nuevo, message: 'Guardado en fallback local' };
    }
  }
};

export const serviciosSuperAdmin = {
  obtenerTenants: async (): Promise<RespuestaApi<TenantInfo[]>> => {
    try {
      const res = await clienteApi.get('/admin/tenants');
      return res.data;
    } catch (err) {
      // Fallback
      const lista: TenantInfo[] = [
        { id: 1, name: 'Organizador', email: 'organizador@ligacenter.com', championships_count: 2, is_active: true },
        { id: 2, name: 'Juan Pérez', email: 'juan@ligacenter.com', championships_count: 1, is_active: true },
        { id: 3, name: 'Mesa Control', email: 'mesa@ligacenter.com', championships_count: 0, is_active: true }
      ];
      return { success: true, data: lista, message: 'Retornado de fallback local' };
    }
  }
};
