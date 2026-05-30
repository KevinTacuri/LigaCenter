# Reporte de Avances - Primer Entregable

Este documento detalla el progreso y los componentes creados para el primer entregable del sistema **LigaCenter** (Gestión de Campeonatos). El objetivo de esta fase fue implementar el flujo completo de autenticación y roles de usuario.

---

## 🔒 Estado de Integridad del Backend
> [!IMPORTANT]
> **No se ha modificado ningún archivo del backend registrado en Git.**
>
> Para evitar interferir con el código y la base de datos de tus compañeros, todo el despliegue local se realizó con archivos ignorados por Git:
> 1.  **`backend/.env`**: Creado localmente (ignorado por Git) para configurar una conexión SQLite.
> 2.  **`backend/database/database.sqlite`**: Base de datos SQLite local (ignorada por Git) donde se corrieron las migraciones y seeders.
>
> Tus compañeros no verán afectada su base de datos ni su configuración cuando hagas *commit* y *push*.

---

## 🚀 Avances Realizados

### 1. Inicialización y Estructura del Frontend
Se creó el proyecto en una carpeta independiente llamada `frontend/` al mismo nivel de `backend/` usando:
*   **React + TypeScript + Vite**
*   **Tailwind CSS v4** (integrado mediante el plugin oficial `@tailwindcss/vite`)
*   **React Router Dom v7** (manejo de ruteo SPA)
*   **Axios** (cliente de peticiones HTTP)

### 2. Capa de Servicios y API (`src/servicios/`)
*   **[api.ts](file:///C:/Users/achav/Desktop/PIS-proyecto/proyecto-campeonato/frontend/src/servicios/api.ts)**: Configuración del cliente Axios con la URL de la API local. 
    *   Implementa un **interceptor de petición** para inyectar automáticamente el Bearer token almacenado en las cabeceras de autorización de Sanctum.
    *   Implementa un **interceptor de respuesta** para cerrar la sesión local automáticamente si el servidor responde con un error `401 Unauthorized` (token expirado o inválido).
    *   Define tipos e interfaces en español y expone métodos de conexión para: `iniciarSesion`, `registrar`, `cerrarSesion`, `obtenerUsuarioAutenticado`, `solicitarRecuperacion`, `restablecerContrasenia`, `obtenerUsuarios`, `actualizarUsuario` y `cambiarRolUsuario`.

### 3. Contexto de Autenticación (`src/contexto/`)
*   **[ContextoAutenticacion.tsx](file:///C:/Users/achav/Desktop/PIS-proyecto/proyecto-campeonato/frontend/src/contexto/ContextoAutenticacion.tsx)**: Provee el estado global del usuario logueado en la aplicación.
    *   Maneja de forma transparente el token en `localStorage`.
    *   Expone funciones globales en español como `iniciarSesion`, `registrar` y `cerrarSesion`.
    *   Incluye los métodos `tieneRol(rol)` y `tienePermiso(permiso)` para que las vistas del frontend puedan mostrar u ocultar secciones dependiendo de los roles y permisos de Spatie devueltos por la API.

### 4. Vistas e Interfaces de Usuario (`src/paginas/`)
Se diseñaron e implementaron las siguientes interfaces responsivas con un estilo oscuro de alta estética (*glassmorphism*):
*   **[Login.tsx](file:///C:/Users/achav/Desktop/PIS-proyecto/proyecto-campeonato/frontend/src/paginas/Login.tsx)**: Pantalla de inicio de sesión con alertas de error y efectos visuales modernos. Incluye enlace para recuperar contraseña y registro.
*   **[Registro.tsx](file:///C:/Users/achav/Desktop/PIS-proyecto/proyecto-campeonato/frontend/src/paginas/Registro.tsx)**: Formulario completo en español para crear una cuenta (rol `usuario_publico`).
*   **[RecuperarContrasenia.tsx](file:///C:/Users/achav/Desktop/PIS-proyecto/proyecto-campeonato/frontend/src/paginas/RecuperarContrasenia.tsx)**: Permite ingresar el correo para que el backend envíe el enlace de recuperación.
*   **[RestablecerContrasenia.tsx](file:///C:/Users/achav/Desktop/PIS-proyecto/proyecto-campeonato/frontend/src/paginas/RestablecerContrasenia.tsx)**: Captura el token y el correo electrónico desde la URL y permite ingresar y confirmar la nueva contraseña.
*   **[Tablero.tsx](file:///C:/Users/achav/Desktop/PIS-proyecto/proyecto-campeonato/frontend/src/paginas/Tablero.tsx)**: Panel de control del usuario autenticado. 
    *   Muestra un saludo personalizado y la lista de permisos técnicos de Spatie.
    *   Renderiza condicionalmente botones y accesos a módulos de desarrollo (Gestión de Usuarios, Planillas, Equipos, Tablas de Posición) basándose en los permisos reales del usuario.

### 5. Configuración de Rutas y Estilos
*   **[App.tsx](file:///C:/Users/achav/Desktop/PIS-proyecto/proyecto-campeonato/frontend/src/App.tsx)**: Concentra y encapsula las rutas públicas y protegidas bajo el proveedor de autenticación.
*   **[index.css](file:///C:/Users/achav/Desktop/PIS-proyecto/proyecto-campeonato/frontend/src/index.css)**: Importa las utilidades globales de Tailwind CSS v4.

### 6. Comunicación y Coordinación de Equipos
*   **[solicitudes_backend.md](file:///C:/Users/achav/Desktop/PIS-proyecto/proyecto-campeonato/solicitudes_backend.md)**: Archivo creado en la raíz del proyecto para documentar los endpoints y las estructuras JSON que tu equipo de Frontend necesite solicitar al equipo de Backend a futuro.

---

## 📋 Estado de Verificación y Compilación
*   Se corrieron exitosamente las pruebas de compilación en el frontend (`pnpm run build`), lo que garantiza que **el código de TypeScript y de Tailwind v4 no posee errores de compilación ni de sintaxis**.
*   Tanto el servidor del backend de Laravel (`php artisan serve`) como el frontend (`pnpm dev`) están en funcionamiento en tu computadora en este momento.
