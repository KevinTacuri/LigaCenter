# LigaCenter - Backend API

## Descripcion

Sistema para la gestion, seguimiento, rendimiento y control estadistico de campeonatos deportivos multidisciplinarios. Este repositorio contiene el backend desarrollado con **Laravel 13** que provee una API RESTful para la gestion de usuarios, autenticacion, roles, permisos, equipos, jugadores, disciplinas, partidos y estadisticas.

---

## Requisitos

### Para desarrollo local (sin Docker)
- **PHP >= 8.4.1**
- **Composer 2.x**
- **MySQL >= 8.0** o **MariaDB >= 11**
- **Node.js >= 18** (para Vite, opcional en backend puro)
- **Herd** (recomendado) o XAMPP/WAMP

### Para produccion (Docker / Dokploy)
- Docker + Docker Compose
- Un servidor con Dokploy instalado (opcional)

### Extensiones PHP requeridas
- pdo
- pdo_mysql
- openssl
- mbstring
- tokenizer
- xml
- ctype
- curl
- fileinfo
- json
- bcmath
- intl
- zip
- opcache

---

## Instalacion (desarrollo local)

### 1. Clonar repositorio
```bash
git clone https://gitlab.com/grupo.01.pis.2026/proyecto-campeonato.git
cd proyecto-campeonato/backend
```

### 2. Instalar dependencias PHP
```bash
composer install
```

### 3. Crear archivo de entorno
```bash
cp .env.example .env
```

### 4. Configurar MySQL en `.env`
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=db_ligacenter
DB_USERNAME=root
DB_PASSWORD=tu_contraseña
```

### 5. Generar clave
```bash
php artisan key:generate
```

### 6. Migraciones y seeders
```bash
php artisan migrate:fresh --seed
```

### 7. Ejecutar servidor de desarrollo
```bash
php artisan serve
```

Abrir: **http://127.0.0.1:8000**

Documentacion Swagger: **http://127.0.0.1:8000/api/documentation**

---

## Instalacion con Docker (recomendado para paridad con produccion)

Desde la raiz del proyecto `proyecto-campeonato/`:

```bash
# 1. Configurar variables
cp .env.example.production .env

# 2. Levantar los 3 servicios (db + backend + frontend)
docker compose up -d --build

# 3. Esperar ~60s a que termine el entrypoint (migraciones + APP_KEY)
docker compose logs -f backend
```

El backend quedara en **http://localhost:8080/api**.

---

## ⚡ Comandos utiles

```bash
# Desarrollo
composer run setup            # Setup completo: install, env, key, migrate
composer run dev              # Servidor + queue + logs + Vite (concurrente)
php artisan optimize:clear    # Limpiar caches
php artisan test              # Ejecutar tests

# Base de datos
php artisan migrate           # Correr migraciones pendientes
php artisan migrate:fresh --seed   # Resetear BD con datos de prueba
php artisan tinker            # Consola interactiva de Laravel

# Produccion (dentro del contenedor)
php artisan config:cache      # Cachear configuracion
php artisan route:cache       # Cachear rutas
php artisan view:cache        # Cachear vistas Blade

# Docker
docker compose logs -f backend      # Ver logs del backend
docker compose exec backend bash    # Shell dentro del contenedor
docker compose restart backend      # Reiniciar solo el backend
```

---

## Seeders y usuario administrador por defecto

Este proyecto incluye **seeders** para cargar datos iniciales necesarios para el funcionamiento del sistema, como roles, permisos y usuarios.

### Ejecutar seeders

Despues de ejecutar las migraciones, corre el siguiente comando:

```bash
php artisan db:seed
```

O si deseas refrescar la base de datos completamente:

```bash
php artisan migrate:fresh --seed
```

---

### Usuarios por defecto

Al ejecutar los seeders, se crean los siguientes usuarios:

```text
Email: admin@ligacenter.com;       Password: 12345678; Rol: administrador
Email: organizador@ligacenter.com; Password: 12345678; Rol: organizador
Email: mesa@ligacenter.com;        Password: 12345678; Rol: encargado_mesa
Email: publico@ligacenter.com;     Password: 12345678; Rol: usuario_publico
```

### Seeders incluidos

Los seeders ejecutados por defecto son:

- `RolesAndPermissionsSeeder` — crea los 4 roles y sus permisos asociados
- `UserSeeder` — crea los 4 usuarios base (uno por cada rol)

Estos seeders haran que el sistema arranque con datos minimos funcionales.

---

## Variables de entorno clave

| Variable | Descripcion | Ejemplo |
|---|---|---|
| `APP_NAME` | Nombre de la aplicacion | `LigaCenter` |
| `APP_ENV` | Entorno (`local` / `production`) | `local` |
| `APP_KEY` | Clave de cifrado (32 bytes base64) | `base64:xxxxx...` |
| `APP_URL` | URL publica de la app | `http://localhost:8080` |
| `DB_CONNECTION` | Driver de BD | `mysql` |
| `DB_HOST` | Host de la BD | `127.0.0.1` (local) / `db` (Docker) |
| `DB_DATABASE` | Nombre de la BD | `db_ligacenter` |
| `SESSION_DRIVER` | Driver de sesiones | `database` |
| `CACHE_STORE` | Driver de cache | `database` |
| `QUEUE_CONNECTION` | Driver de colas | `database` |

> **Importante en Docker/Dokploy:** las variables se inyectan automaticamente desde el entrypoint. NO es necesario crear un `.env` manualmente dentro del contenedor.

---

## Estructura del backend

```
backend/
├── app/                  # Codigo de aplicacion (Models, Controllers, etc.)
│   ├── Http/Controllers/ # Controladores (API + Web)
│   └── Models/           # Modelos Eloquent
├── bootstrap/            # Archivos de arranque de Laravel
├── config/               # Configuracion (cacheable)
├── database/
│   ├── migrations/       # 21 migraciones (campeonato, equipos, jugadores, etc.)
│   ├── seeders/          # RolesAndPermissionsSeeder + UserSeeder
│   └── factories/        # Model factories para tests
├── docker/               # Configs de Docker (nginx, supervisord, entrypoint)
├── public/               # Document root del servidor web
├── resources/            # Vistas Blade + assets
├── routes/               # Definicion de rutas (api.php, web.php)
├── storage/              # Archivos generados (logs, cache, uploads)
├── tests/                # Tests automatizados (PHPUnit)
├── artisan               # CLI de Laravel
├── composer.json         # Dependencias PHP
├── Dockerfile            # Imagen Docker de produccion (multi-stage)
└── .dockerignore         # Archivos excluidos del build Docker
```

---

## API endpoints principales

Lista abreviada (la lista completa esta en Swagger: `/api/documentation`):

| Metodo | Endpoint | Descripcion |
|---|---|---|
| POST | `/api/login` | Iniciar sesion |
| POST | `/api/logout` | Cerrar sesion |
| POST | `/api/forgot-password` | Recuperar contrasena |
| GET | `/api/championships` | Listar campeonatos |
| POST | `/api/championships` | Crear campeonato |
| GET | `/api/teams` | Listar equipos |
| GET | `/api/players` | Listar jugadores |
| GET | `/api/matches` | Listar partidos |
| POST | `/api/fixture/generate` | Generar fixture automatico |
| GET | `/api/disciplines` | Listar disciplinas deportivas |
| GET | `/api/documentation` | Swagger interactivo del API |

---

## Deploy a produccion (Dokploy)

Ver el README de la raiz del proyecto: [`/proyecto-campeonato/README.md`](../README.md)

Resumen rapido:
1. Subir el repo a GitLab (incluyendo los Dockerfiles nuevos)
2. En Dokploy, crear Service tipo **Compose**
3. Apuntar al repo + branch `main` + compose path `docker-compose.yml`
4. Configurar variables de entorno: `APP_URL`, `APP_KEY`, `DB_*`
5. Deploy

---

## Troubleshooting

### Error: "SQLSTATE[HY000] [2002] No connection could be made"
La BD no esta corriendo. Si usas Docker: `docker compose ps` y asegurate de que `ligacenter-db` este healthy. Si usas local: `brew services start mysql` o inicia MariaDB.

### Error: "No application encryption key has been specified"
`APP_KEY` no esta configurado. Corre `php artisan key:generate` (local) o configura la variable de entorno (Docker/Dokploy).

### Error: "Class 'XYZ' not found" despues de un pull
Limpia caches: `php artisan optimize:clear`.

### Error en migraciones: "Base table or view already exists"
La BD tiene datos viejos. Usa `php artisan migrate:fresh --seed` para resetear (CUIDADO: borra todos los datos).

---

**Universidad Nacional de San Agustin (UNSA)** · Proyecto de Ingenieria de Software 2026-1 · Grupo 01