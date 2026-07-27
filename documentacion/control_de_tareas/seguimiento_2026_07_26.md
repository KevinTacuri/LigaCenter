# 📋 Seguimiento de Cambios — 26 de Julio de 2026

## 🛠️ Resumen de Implementaciones y Mejoras

En esta sesión se abordaron refactorizaciones clave de duraciones de juego, sincronización de base de datos, resolución de errores de validación API, el rediseño completo del Dashboard principal, la reestructuración de la gestión de Delegados y Oficiales de Mesa, la adaptación dinámica de temas (Claro/Oscuro) en Autenticación, la eliminación de la barra lateral para Delegados, la **Protección Estricta de Rutas mediante Guards de Seguridad**, la incorporación del **Logo e Icono/Botón de Inicio en la Cabecera Superior** y la adaptación de los **Pasos de Ayuda Flotante para el Delegado**.

---

### 1. ⏱️ Duraciones de Tiempo Configurables por Disciplina (Backend & Frontend)
Se eliminaron las duraciones fijas hardcodeadas (45 min, 10 min, etc.) para permitir tiempos flexibles ajustados por disciplina o torneo (ej. tiempos de 20 min en fútbol relámpago):

* **Migraciones Base (`championship_disciplines` & `matches`)**:
  - Agregados los campos `match_duration_minutes` y `match_duration_settings` en la tabla de relación `championship_disciplines`.
  - Agregado el campo `custom_period_duration` en la tabla de partidos (`matches`).
* **Backend Laravel (`ChampionshipDisciplineController` & `GameMatchController`)**:
  - Los endpoints de disciplinas aceptan y retornan la configuración de tiempo.
  - La respuesta de partidos incluye `category.championshipDiscipline` con sus reglas de minutos.
* **Mesa de Control (`MesaControl.tsx`)**:
  - La función `obtenerNormasDeporte` evalúa dinámicamente la duración personalizada asignada a la disciplina o partido.
  - Incorporado un widget selector rápido (`Duración: [ 20 min v ]`) junto al cronómetro para que la mesa de control pueda ajustar el tiempo del periodo sobre la marcha.

---

### 2. 🗄️ Actualización y Recreación de Base de Datos Local
* Se ejecutó el comando `php artisan migrate:fresh --seed` integrando limpiamente el esquema de la rama `fix/timer_partidos`.
* **Seeder de Datos de Prueba (`TestDataSeeder.php`)**:
  - Creado e integrado al `DatabaseSeeder.php`.
  - Registra un campeonato completo para el usuario `organizador@ligacenter.com` (password: `12345678`), con disciplinas de Fútbol (20 min por tiempo) y Básquet (10 min por cuarto), categorías, sedes, equipos y partidos en estado *en curso*, *programado* y *finalizado*.

---

### 3. 🐛 Solución de Error 422 en Configuración de Campeonato
* **Incidencia**: Falla `422 (Unprocessable Content)` al guardar un campeonato como Público mediante `POST /api/championships/{id}`.
* **Corrección en `ChampionshipController.php`**:
  - Inclusión del estado `'activo'` en la regla de validación `status`.
  - Normalización de `is_public` con `filter_var(..., FILTER_VALIDATE_BOOLEAN)` cuando proviene de `FormData`.
  - Decodificación automática de `settings` cuando es enviado como string JSON.
  - Flexibilización de permisos para permitir actualización si el organizador está asociado mediante `championship_users`.

---

### 4. 🎨 Rediseño Completo del Dashboard (`Tablero.tsx`)
Se eliminó la sección redundante de "Módulos Disponibles" (opciones ya presentes en la barra lateral) y se transformó la vista inicial en un **Centro de Control Operativo y Métricas en Tiempo Real**:

* **⚡ Acciones Rápidas de Control (1-Clic)**:
  - Botones de acceso directo a *Inscribir Equipo*, *Programar Fixture*, *Planilla de Juego* y *Portal Público*.
* **🚨 Panel de Alertas Operativas Críticas**:
  - Detección en tiempo real de partidos sin cancha/horario asignado, planillas pendientes de firma y planteles incompletos.
* **Tarjetas KPI de Resumen Operativo**:
  - 🛡️ Equipos Inscritos
  - 📅 Partidos Programados / Finalizados
  - 📡 Partidos en Vivo (con badge parpadeante y acceso directo a la Mesa de Control)
  - 🪪 **Jugadores Registrados** (total de deportistas con plantilla y dorsal dados de alta)
* **🏆 Líderes de la Liga (Top 3 Posiciones)**:
  - Podio ejecutivo con posiciones, escudos de equipos, partidos jugados y puntos.
* **Encuentros en Vivo & Próximos Partidos**:
  - Visualización directa del marcador en tiempo real y próximos partidos de la jornada con escudos de equipos (`TeamLogo`).
* **Checklist y Estado del Torneo**:
  - Ficha de estado del campeonato activo (formato, visibilidad pública/privada, estado) y lista de pasos de organización.
* **Adaptación Completa a Tema Claro / Oscuro**:
  - Sustitución de colores oscuros estáticos por variables semánticas de Tailwind (`bg-primary-container`, `bg-surface-dim`, `text-on-surface`, `border-outline`).

---

### 5. 🏆 Recálculo Dinámico de Tabla de Posiciones (`StandingController.php`)
* **Problema:** En la vista pública de tabla de posiciones, los registros aparecían vacíos o con valores en 0.
* **Causa:** Existía un filtro estricto por `registration_status = 'aprobado'` que descartaba equipos en estado `'activo'` y no se invocaba el recálculo dinámico al consultar la vista.
* **Solución:**
  - Inclusión del método `recalcularPosicionesSiEsNecesario` en `StandingController.php`, que procesa los partidos en estado `'finalizado'` e inserta/actualiza las métricas reales (PJ, PG, PE, PP, GF, GC, DG, Puntos).
  - Eliminación de la restricción rígida de `registration_status = 'aprobado'`.

---

### 6. 🎨 Correcciones Visuales de Tema Claro (`MesaControl.tsx` & `CabeceraEstandar.tsx`)
* **Mesa de Control (`MesaControl.tsx`)**:
  - Reemplazadas las clases fijas oscuras por clases adaptativas (`bg-primary-container`, `bg-surface-dim`, `bg-surface`, `border-outline`, `text-on-surface`).
* **Appbar (`CabeceraEstandar.tsx`)**:
  - Eliminado el fondo oscuro hardcodeado `bg-[#11131c]/90`.
  - El botón de **Vista Pública** utiliza el tema semántico adaptativo con icono acentuado.

---

### 7. 🚀 Rediseño Premium de Barra Lateral (`BarraLateral.tsx`)
* **Botón de Contraer/Expandir en la Parte Superior (Estilo ChatGPT / IDEs)**:
  - Se reubicó el botón de colapso a la cabecera superior junto al logo `LigaCenter` con el icono dinámico `view_sidebar`.
* **Animación Suave CSS Grid en Submenús**:
  - Transición fluida de altura y opacidad al desplegar y comprimir las opciones.
* **Memoria de Estado por el Usuario (`submenusModificadosPorUsuario`)**:
  - El sistema respeta de manera permanente la decisión del usuario al navegar entre páginas.
* **Redistribución Dinámica de Pantalla Sincronizada**:
  - Se vinculó la variable CSS `--sidebar-width` entre `BarraLateral.tsx` y la regla responsive `.lg:ml-64`.

---

### 8. 🖼️ Favicon e Icono de Marca Oficial en Pestañas de Navegador (`index.html`)
* **Implementación:**
  - Se vinculó el logo oficial vectorial de la aplicación `logo.svg` a las pestañas de los navegadores web.
  - Actualizados `frontend/public/favicon.svg` y `frontend/public/logo.svg`.

---

### 9. 🔗 Corrección de Redirección en "Ver Tabla" y "Portal Público" (`Tablero.tsx`)
* **Solución:** Se actualizó la navegación para dirigir específicamente a la vista pública del torneo activo: `/campeonatos/${campeonatoActivo.id}`.

---

### 10. 🛡️ Restructuración de Delegados y Oficiales de Mesa (Backend & Frontend)
* **Backend (`UserController.php` & `ChampionshipController.php`)**:
  - `UserController.php`: Método `index` admite `exclude_privileged=1`.
  - `ChampionshipController.php`: Validación de seguridad en `addUser` que impide otorgar roles de oficial/delegado a administradores u organizadores.
* **Módulo Encargados de Mesa (`GestionDelegados.tsx`)**:
  - Vista reorientada exclusivamente para la administración del personal técnico de apoyo: **Encargados de Mesa (`score_table`)** y **Árbitros (`referee`)**.

---

### 11. 🏆 Gestión de Delegados por Equipo, Rediseño Premium y Portales de Modales (`GestionParticipantes.tsx`)
* **Navegación por URL Query (`?tab=equipos`)**:
  - Abre la pestaña de **Equipos** directamente al ser invocada.
* **Segmented Toggle Controls (3 Botones de Estado)**:
  - 3 Botones Interactivos (*Aprobado*, *Pendiente*, *Rechazado*).
* **Cobertura Total de Pantalla y Desenfoque Sutil (`createPortal`)**:
  - Modales envueltos en **React `createPortal`** dirigidos a `document.body` con capa `z-[9999]`.

---

### 12. ☀️/🌙 Selector de Tema Claro / Oscuro en Autenticación (`Login.tsx`, `Registro.tsx`, `RecuperarContrasenia.tsx`, `RestablecerContrasenia.tsx`)
* **Inclusión del `BotonTema`**: Se agregó el botón interactivo de alternancia de tema en la esquina superior derecha.

---

### 13. 🔒 Protección de Rutas por Seguridad, Ocultamiento de Barra Lateral y Botón de Inicio (`App.tsx`, `BarraLateral.tsx`, `CabeceraEstandar.tsx`, `Tablero.tsx`)
* **Ocultamiento Total de Barra Lateral**: Para usuarios con rol de **Delegado de Equipo (`esDelegadoPuro`)**, la barra lateral no se renderiza (`null`), ofreciendo un portal limpio al 100% de pantalla.
* **Guardián de Rutas de Seguridad (`RutaProtegidaOrganizador`)**:
  - En `App.tsx`, se protegieron las rutas organizativas: `/tablero/delegados`, `/tablero/mesa`, `/tablero/usuarios`, `/tablero/saas-admin`, `/tablero/configuracion`.
  - Redirección automática a `/tablero` si el delegado intenta acceder mediante URL directa.
* **Logo e Icono/Botón de Inicio Visible (`CabeceraEstandar.tsx`)**:
  - Incorporado en la esquina superior izquierda el logo de **LigaCenter** junto con un botón interactivo **`🏠 Inicio`** que permite a delegados y usuarios retornar al panel principal con 1 clic.
* **Pasos de Ayuda Adaptados para Delegados (`GestionParticipantes.tsx`)**:
  - El botón flotante `?` de ayuda muestra pasos específicos de inscripción para delegados (selección de equipo, modalidad masiva/manual, dorsales, foto de carnet y habilitación).

---

### 14. 🎴 Galería de Tarjetas de Jugadores, Carga Masiva CSV, Indicaciones de Unicidad y Dashboard Optimizado del Delegado (`GestionParticipantes.tsx`, `Tablero.tsx`, `CabeceraEstandar.tsx`)
* **Galería de Tarjetas de Jugadores (Player Cards Grid)**:
  - Reemplazo de la tabla clásica por una cuadrícula adaptativa (`grid-cols-2` a `lg:grid-cols-5`) de tarjetas deportivas.
  - Foto del rostro en gran tamaño y prominente (`w-28 h-28 rounded-2xl` con sombra de carnet oficial).
  - Badge circular de dorsal (#) destacado en la esquina superior de la tarjeta.
  - Píldoras con DNI y Edad, junto con botones de acción rápida **`✏️ Editar`** y **`🗑️ Eliminar`**.
* **Modal Interactivo de Inscripción y Carga Masiva (`createPortal`)**:
  - Modal flotante para inscribir deportistas uno por uno con selector interactivo de foto.
  - Modal de **Carga Masiva de Plantel en Bloque** con zona dropzone para archivos `.CSV` / `.XLSX`.
  - Botón de **`⬇️ Descargar Plantilla (.CSV)`** de muestra con encabezados requeridos.
* **Indicaciones Explícitas de Unicidad (DNI y Dorsales)**:
  - Banners normativos en los modales y pasos de ayuda especificando que cada deportista debe contar con su **DNI/Cédula único** y que el **número de dorsal (#)** no se puede repetir dentro del mismo equipo.
* **Dashboard del Delegado Unificado (`Tablero.tsx`)**:
  - Banner de bienvenida descartable con botón **`✕`** que persiste la preferencia en `localStorage`.
  - Acción principal reducida a **UN ÚNICO BOTÓN PRINCIPAL: `⚽ Registrar Jugadores`**, que navega directamente a la plantilla.
* **Barra Superior Mejorada (`CabeceraEstandar.tsx`)**:
  - Etiquetas de acceso directo para delegados (**`⚽ Registrar Jugadores`** y **`📅 Partidos`**).
  - **Botón `🚪 Salir` (Logout)** directo en el extremo derecho de la barra superior.

---

## 📁 Archivos Creados o Modificados

| Archivo | Descripción del Cambio |
|---|---|
| `backend/database/migrations/2026_06_09_223305_create_championship_disciplines_table.php` | Añadidos campos `match_duration_minutes` y `match_duration_settings`. |
| `backend/app/Models/ChampionshipDiscipline.php` | `$fillable` actualizado. |
| `backend/app/Models/GameMatch.php` | `$fillable` y `$casts` actualizados con `custom_period_duration`. |
| `backend/app/Http/Controllers/Api/ChampionshipDisciplineController.php` | Soporte para parámetros de tiempo en `store` y `update`. |
| `backend/app/Http/Controllers/Api/GameMatchController.php` | Carga de relación `category.championshipDiscipline`. |
| `backend/app/Http/Controllers/Api/ChampionshipController.php` | Corrección de error 422 y validación de roles en `addUser`. |
| `backend/app/Http/Controllers/Api/UserController.php` | Filtro `exclude_privileged=1` para la consulta de usuarios en `index`. |
| `backend/app/Http/Controllers/Api/StandingController.php` | Recálculo dinámico de posiciones y eliminación de filtro restrictivo de status. |
| `backend/database/seeders/TestDataSeeder.php` | Seeder con datos de prueba reales para el organizador. |
| `backend/database/seeders/DatabaseSeeder.php` | Registro de `TestDataSeeder`. |
| `frontend/index.html` | Configuración de favicons y title oficial con el logo en las pestañas del navegador. |
| `frontend/public/favicon.svg` | Favicon vectorial del logo oficial de LigaCenter. |
| `frontend/src/servicios/api.ts` | Interfaces y llamadas API actualizadas con la configuración de tiempos. |
| `frontend/src/App.tsx` | Protección de rutas de organizador con `RutaProtegidaOrganizador`. |
| `frontend/src/componentes/CabeceraEstandar.tsx` | Logo oficial, botón de inicio, etiquetas del delegado y botón de Logout en la barra superior. |
| `frontend/src/componentes/BarraLateral.tsx` | Eliminación de barra lateral para delegados (`esDelegadoPuro`). |
| `frontend/src/paginas/auth/Login.tsx` | Rediseño con selector de Tema Claro/Oscuro y clases semánticas. |
| `frontend/src/paginas/auth/Registro.tsx` | Rediseño con selector de Tema Claro/Oscuro y clases semánticas. |
| `frontend/src/paginas/auth/RecuperarContrasenia.tsx` | Rediseño con selector de Tema Claro/Oscuro y clases semánticas. |
| `frontend/src/paginas/auth/RestablecerContrasenia.tsx` | Rediseño con selector de Tema Claro/Oscuro y clases semánticas. |
| `frontend/src/paginas/organizador/MesaControl.tsx` | Adaptación del panel de acta, marcador y tarjetas de partidos a tema claro/oscuro. |
| `frontend/src/paginas/dashboard/Tablero.tsx` | Dashboard de delegado optimizado con botón único de registro y banner descartable. |
| `frontend/src/paginas/organizador/GestionDelegados.tsx` | Reorientación a Oficiales y Encargados de Mesa, modal de alta y filtrado seguro. |
| `frontend/src/paginas/organizador/GestionParticipantes.tsx` | Galería de Tarjetas de Jugadores, foto prominente, modales `createPortal` y descarga CSV. |
| `documentacion/control_de_tareas/seguimiento_2026_07_26.md` | Documento de seguimiento de tareas de la fecha actualizado. |

---

## ✅ Verificación y Pruebas
- **Compilación Frontend (`npx tsc --noEmit`)**: Código de salida **0** (sin errores).
- **Servidor Backend**: En funcionamiento en `http://127.0.0.1:8000`.
- **Servidor Frontend**: En funcionamiento en `http://localhost:5173`.
