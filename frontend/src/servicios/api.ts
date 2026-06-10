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

// Interceptor para inyectar el Token de Sanctum en cada petición
clienteApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token_autenticacion');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para capturar respuestas con errores de autenticación
clienteApi.interceptors.response.use(
  (response) => response,
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
