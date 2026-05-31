# Informe de Avances y Distribución de Tareas - Entregable 1

Este documento detalla los avances logrados hasta el momento en el desarrollo de la parte visual e integraciones del frontend, así como la distribución y justificación de **15 horas de trabajo** para cada uno de los 3 integrantes del equipo.

---

## 👥 Resumen del Equipo y Carga de Horas

| Nombre | Rol | Horas Justificadas | Estado de Tareas |
| :--- | :--- | :---: | :---: |
| **Sharon** | Diseñadora UI/UX | 15 hrs | Completado |
| **Braulio** | Desarrollador Frontend 1 | 15 hrs | Completado |
| **Alejandro** | Desarrollador Frontend 2 | 15 hrs | Completado |
| **Total** | | **45 hrs** | |

---

## 📈 Resumen General de Avances del Proyecto

Para este primer hito del proyecto, centrado en el **Módulo de Autenticación y Seguridad**, se han implementado con éxito los siguientes componentes:

1.  **Entorno Local Aislado**: Configuración local de base de datos SQLite y `.env` para pruebas del backend sin alterar el código de Git de los compañeros de backend.
2.  **Proyecto Frontend**: Inicialización de la SPA independiente en la carpeta `/frontend` usando **React + TypeScript + Vite + Tailwind CSS v4**.
3.  **Ruteo (React Router)**: Definición de rutas públicas y privadas para todo el flujo.
4.  **Capa de API**: Configuración de Axios con interceptores automatizados para inyectar y limpiar el token Sanctum Bearer de seguridad.
5.  **Contexto de Autenticación**: Manejo del estado global de sesión del usuario y métodos en español (`tieneRol`, `tienePermiso`) para verificar permisos Spatie.
6.  **Vistas de Usuario**: Interfaces responsivas y premium (*glassmorphism*) creadas en Tailwind CSS para:
    *   Inicio de Sesión (Login)
    *   Registro de Usuario Público
    *   Recuperación de Contraseña
    *   Nueva Contraseña (Restablecer con Token)
    *   Tablero de Control (Dashboard condicional basado en roles/permisos del backend)

---

## 📋 Justificación de Horas de Trabajo

A continuación se detalla la división de tareas y subtareas asignadas a cada miembro para alcanzar las **15 horas** requeridas en este entregable.

---

### 🎨 1. Sharon — Diseñadora UI/UX (15 Horas)

Su trabajo se centró en la investigación, conceptualización de la identidad visual de **LigaCenter** y la estructuración de la experiencia de usuario para el flujo de seguridad.

*   **Tarea 1: Diseño de Flujos y Wireframes de Autenticación (6 horas)**
    *   *Subtarea 1.1:* Análisis de requisitos del primer entregable (flujos de login, registro, olvido de contraseña y dashboard condicional). *(2 horas)*
    *   *Subtarea 1.2:* Diseño de wireframes y flujo de navegación del usuario en Figma. *(2 horas)*
    *   *Subtarea 1.3:* Definición de la guía de estilo visual (paleta de colores deportivos oscuros, tipografía premium, sombras y botones con efecto cristal/glassmorphism). *(2 horas)*
*   **Tarea 2: Diseño de Prototipos de Alta Fidelidad en HTML (6 horas)**
    *   *Subtarea 2.1:* Maquetación y estructura en limpio de las interfaces visuales básicas del Login y Registro en archivos HTML estructurados. *(3 horas)*
    *   *Subtarea 2.2:* Maquetación de la interfaz del Tablero con la distribución de los módulos según los roles y la interfaz de recuperación de clave. *(3 horas)*
*   **Tarea 3: Coordinación y Traspaso de Diseño (Handover) (3 horas)**
    *   *Subtarea 3.1:* Reunión de alineación con Braulio y Alejandro para la explicación del flujo de usuario y el diseño conceptual. *(1.5 horas)*
    *   *Subtarea 3.2:* Documentación de los tokens de diseño (variables CSS de colores, tamaños y animaciones propuestas) para el equipo de desarrollo. *(1.5 horas)*

---

### 💻 2. Braulio — Desarrollador Frontend 1 (15 Horas)

Su trabajo se enfocó en preparar el entorno técnico y desarrollar la estructura base de la aplicación y las vistas principales de captura de datos de usuario.

*   **Tarea 1: Configuración de la Infraestructura del Proyecto (4 horas)**
    *   *Subtarea 1.1:* Clonación del proyecto en local y configuración de la rama de desarrollo `rama/configuracion-frontend`. *(1 hora)*
    *   *Subtarea 1.2:* Creación de la base de datos de desarrollo SQLite aislada (`database.sqlite`) y configuración del archivo local `.env` del backend. *(1.5 horas)*
    *   *Subtarea 1.3:* Instalación local de dependencias mediante Laravel Herd y ejecución de migraciones y seeders para usuarios de prueba. *(1.5 horas)*
*   **Tarea 2: Inicialización de la Aplicación y Configuración del Build (6 horas)**
    *   *Subtarea 2.1:* Inicialización del frontend con Vite, React y TypeScript en la carpeta `/frontend`. *(2 horas)*
    *   *Subtarea 2.2:* Configuración e instalación de dependencias base (`react-router-dom`, `axios`, `tailwindcss` v4 y `@tailwindcss/vite`). *(2 horas)*
    *   *Subtarea 2.3:* Configuración del ruteo inicial en `App.tsx` y configuración de la importación global de Tailwind CSS. *(2 horas)*
*   **Tarea 3: Desarrollo de Interfaces de Acceso (5 horas)**
    *   *Subtarea 3.1:* Implementación de la página de Inicio de Sesión (`Login.tsx`) con formularios interactivos y alertas. *(2.5 horas)*
    *   *Subtarea 3.2:* Implementación de la vista de Registro de Usuario Público (`Registro.tsx`) y validaciones básicas de campos de formulario. *(2.5 horas)*

---

### 💻 3. Alejandro — Desarrollador Frontend 2 (15 Horas)

Su trabajo se centró en la integración con la API del backend, el control de la sesión, la seguridad mediante tokens y el desarrollo del panel de administración dinámico.

*   **Tarea 1: Integración con la API y Configuración de Axios (5 horas)**
    *   *Subtarea 1.1:* Creación de `api.ts` con la instancia configurada de Axios. *(1.5 horas)*
    *   *Subtarea 1.2:* Creación de interceptores para inyectar automáticamente el Bearer token almacenado en las cabeceras HTTP. *(1.5 horas)*
    *   *Subtarea 1.3:* Mapeo y tipado de los endpoints de autenticación y de CRUD de usuarios provistos por el backend de Laravel. *(2 horas)*
*   **Tarea 2: Desarrollo del Estado Global y Seguridad (5 horas)**
    *   *Subtarea 2.1:* Implementación de `ContextoAutenticacion.tsx` para persistir la sesión de usuario y manejar el inicio y cierre de sesión local y remoto. *(2 horas)*
    *   *Subtarea 2.2:* Implementación de lógica en español (`tieneRol`, `tienePermiso`) para el control de accesos. *(1.5 horas)*
    *   *Subtarea 2.3:* Limpieza automática de credenciales expiradas en local mediante interceptor de respuestas de error `401`. *(1.5 horas)*
*   **Tarea 3: Vistas de Recuperación de Clave y Panel de Control (5 horas)**
    *   *Subtarea 3.1:* Creación de las vistas para recuperar y restablecer contraseña (`RecuperarContrasenia.tsx` y `RestablecerContrasenia.tsx`) leyendo los parámetros de la URL. *(2 horas)*
    *   *Subtarea 3.2:* Implementación del panel de control (`Tablero.tsx`) mostrando de manera condicional los accesos directos de los módulos en base a los permisos del usuario. *(2 horas)*
    *   *Subtarea 3.3:* Ejecución de pruebas de compilación de producción (`npm run build`) para verificar la ausencia de errores en TypeScript. *(1 hora)*
