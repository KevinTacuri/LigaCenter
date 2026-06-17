# LigaCenter - Backend API

## Descripcion

Sistema para la gestion, seguimiento, rendimiento y control estadistico de campeonatos deportivos multidisciplinarios. Este repositorio contiene el backend desarrollado con Laravel 12 que provee una API RESTful para la gestion de usuarios, autenticacion, roles, permisos y proximamente equipos, jugadores, disciplinas, partidos y estadisticas.

## Requisitos

- PHP >= 8.2
- Composer
- MySQL >= 8.0
- Node.js >= 18 (para Vite)
- Herd (recomendado) o XAMPP/WAMP

Extensiones PHP requeridas:
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

## Instalacion

### 1. Clonar repositorio

```bash
git clone https://github.com/tu-organizacion/LigaCenter.git
cd LigaCenter
```

### 2 Instalar dependencias PHP
```bash
composer install
```

### 3 Crear archivo de entorno
```bash
cp .env.example .env
```

### 4 Configurar MySQL (.env)
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=db_ligacenter
DB_USERNAME=root
DB_PASSWORD=tu_contraseña
```

### 5 Generar clave
```bash
php artisan key:generate
```
### 6 Migraciones
```bash
php artisan migrate
```

## Ejecutar proyecto

Con Herd (recomendado)
Abre Herd

Agrega el sitio apuntando a la carpeta del proyecto

El dominio sera ligacenter.test

```bash
php artisan serve
```

Abrir:
http://127.0.0.1:8000

---

## ⚡ Comandos útiles

```bash
composer run setup
composer run dev
php artisan optimize:clear
php artisan test
```

---


---

### 7 Instalar PNPM

Si no se tiene PNPM instalado globalmente:

```bash
npm install -g pnpm
```

### 8 Instalar dependencias frontend

```bash
pnpm install
```

### 9 Compilar assets

```bash
pnpm run dev
```

## Seeders y usuario administrador por defecto

Este proyecto incluye **seeders** para cargar datos iniciales necesarios para el funcionamiento del sistema, como roles, sucursales, productos y medios de pago.

### Ejecutar seeders

Después de ejecutar las migraciones, corre el siguiente comando:

```bash
php artisan db:seed
```

O si deseas refrescar la base de datos completamente:

```bash
php artisan migrate:fresh --seed
```

---

### Usuario administrador y demas por defecto

Al ejecutar los seeders, se crean los siguientes usuarios:

```text
Email: admin@ligacenter.com; Password: 12345678; Rol: administrador
Email: organizador@ligacenter.com; Password: 12345678; Rol: organizador
Email: mesa@ligacenter.com; Password: 12345678; Rol: encargado_mesa
Email: publico@ligacenter.com; Password: 12345678; Rol: usuario_publico
```

### Seeders incluidos

Los seeders ejecutados por defecto son:

- `RolesAndPermissionsSeeder`
- `UserSeeder`


Estos seeders haran que el sistema arranque con datos mínimos funcionales.

---

