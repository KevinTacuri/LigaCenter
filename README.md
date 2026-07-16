# =============================================================================
# LigaCenter
# =============================================================================

Sistema de gestión, seguimiento y control estadístico de campeonatos deportivos
multidisciplinarios para el Colegio de Ingenieros de Arequipa.

**Stack:** Laravel 13 (PHP 8.4) · React 19 + Vite 8 · MariaDB 11 · Docker

---

## 🚀 Despliegue con Dokploy (producción)

Este repo está **100% dockerizado** y listo para desplegar en [Dokploy](https://dokploy.com).

### Requisitos en Dokploy

1. Un servidor con Docker instalado
2. Un dominio apuntando a la IP del servidor
3. Esta carpeta (`proyecto-campeonato/`) subida a un repositorio Git (GitLab/GitHub)

### Pasos

1. **En Dokploy**, crear un nuevo proyecto → **Service** → tipo **"Compose"**
2. **Source**: apuntar al repo GitLab (`grupo.01.pis.2026/proyecto-campeonato`)
3. **Branch**: `main`
4. **Compose path**: `docker-compose.yml`
5. **Environment variables** (pegar en la UI):
   ```env
   APP_URL=https://tu-dominio.com
   APP_KEY=                    # dejar vacío en el primer deploy (se autogenera)
   DB_DATABASE=db_ligacenter
   DB_USERNAME=ligacenter
   DB_PASSWORD=<password-seguro>
   DB_ROOT_PASSWORD=<otro-password-más-seguro>
   ```
6. **Domain**: configurar el dominio en Dokploy → apuntará al puerto 80 del frontend
7. Click **Deploy**

Dokploy se encarga de:
- Construir las 3 imágenes Docker (frontend, backend, db)
- Levantarlas y conectarlas a la red interna
- Manejar SSL automático (Let's Encrypt)
- Persistir los datos en volúmenes Docker

### Verificación post-deploy

```bash
# Desde el servidor
docker ps                              # 3 contenedores: db, backend, frontend
docker logs ligacenter-backend         # ver logs de Laravel
curl https://tu-dominio.com            # debe responder el frontend
curl https://tu-dominio.com/api/login  # debe responder el API
```

---

## 💻 Desarrollo local

### Opción A: Docker (recomendado)

```bash
# 1. Configurar variables
cp .env.example.production .env
# Editar .env y poner APP_URL=http://localhost

# 2. Levantar todo
docker compose up -d --build

# 3. Esperar ~60 segundos a que terminen las migraciones
docker compose logs -f backend   # ver progreso
```

Abre:
- Frontend: http://localhost
- API: http://localhost/api
- Swagger: http://localhost/api/documentation

### Opción B: Sin Docker (la que ya tenías funcionando)

```bash
# MariaDB local
docker run -d --name ligacenter-db \
  -e MARIADB_ROOT_PASSWORD=root \
  -e MARIADB_DATABASE=db_ligacenter \
  -e MARIADB_USER=ligacenter \
  -e MARIADB_PASSWORD=ligacenter \
  -p 3306:3306 mariadb:11

# Backend
export PATH="$HOME/Library/Application Support/Herd/bin:$PATH"
cd backend && composer install && php artisan migrate:fresh --seed && php artisan serve

# Frontend
export NVM_DIR="$HOME/.nvm" && source "$NVM_DIR/nvm.sh"
cd frontend && nvm use && pnpm install && pnpm dev
```

---

## 🔑 Credenciales sembradas (4 usuarios de prueba)

| Email | Password | Rol |
|---|---|---|
| `admin@ligacenter.com` | `12345678` | administrador |
| `organizador@ligacenter.com` | `12345678` | organizador |
| `mesa@ligacenter.com` | `12345678` | encargado_mesa |
| `publico@ligacenter.com` | `12345678` | usuario_publico |

---

## 📁 Estructura del repo

```
proyecto-campeonato/
├── backend/                  # Laravel 13 + PHP 8.4
│   ├── app/                  # Código de aplicación
│   ├── database/             # Migraciones + Seeders
│   ├── docker/               # Configs Docker (nginx, supervisord, entrypoint)
│   ├── Dockerfile            # Imagen de producción multi-stage
│   └── .dockerignore
├── frontend/                 # React 19 + Vite 8 + TS 6
│   ├── src/                  # Código de aplicación
│   ├── Dockerfile            # Build estático + nginx
│   ├── nginx.conf            # Proxy /api → backend
│   └── .dockerignore
├── docker-compose.yml        # Orquesta los 3 servicios
├── .env.example.production   # Variables para Dokploy
└── README.md                 # Este archivo
```

---

## 🧪 Comandos útiles

```bash
# Ver logs en vivo
docker compose logs -f backend
docker compose logs -f frontend

# Reiniciar un servicio
docker compose restart backend

# Re-ejecutar migraciones manualmente
docker compose exec backend php artisan migrate --force

# Crear nuevo superusuario
docker compose exec backend php artisan tinker
>>> \App\Models\User::create([...])

# Acceder al shell del backend
docker compose exec backend bash

# Backup de la BD
docker compose exec db mariadb-dump -uligacenter -p db_ligacenter > backup.sql
```

---

## 📚 Más documentación

- `CONTEXTO_PROYECTO.md` (en la raíz del PIS, no en este repo) — contexto completo del proyecto
- Swagger interactivo del API: `/api/documentation` una vez levantado

---

**Universidad Nacional de San Agustín (UNSA)** · Proyecto de Ingeniería de Software 2026-1 · Grupo 01