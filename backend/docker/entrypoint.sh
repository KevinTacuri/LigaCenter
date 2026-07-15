#!/bin/bash
set -e

echo "🚀 LigaCenter Backend - Iniciando..."

# ============================================================================
# 1. Esperar a que la base de datos esté lista
# ============================================================================
echo "⏳ Esperando base de datos en ${DB_HOST}:${DB_PORT}..."

MAX_TRIES=30
TRIES=0
until php -r "
try {
    new PDO(
        'mysql:host=' . getenv('DB_HOST') . ';port=' . getenv('DB_PORT') . ';dbname=' . getenv('DB_DATABASE'),
        getenv('DB_USERNAME'),
        getenv('DB_PASSWORD')
    );
    exit(0);
} catch (Exception \$e) {
    exit(1);
}
" 2>/dev/null; do
    TRIES=$((TRIES+1))
    if [ $TRIES -ge $MAX_TRIES ]; then
        echo "❌ No se pudo conectar a la BD después de $MAX_TRIES intentos"
        exit 1
    fi
    echo "   Intento $TRIES/$MAX_TRIES..."
    sleep 2
done

echo "✅ Base de datos lista"

# ============================================================================
# 2. Asegurar que .env existe (Laravel lo necesita)
# ============================================================================
if [ ! -f /var/www/html/.env ]; then
    echo "📝 Creando .env desde .env.example..."
    cp /var/www/html/.env.example /var/www/html/.env
    # Inyectar las variables de entorno de Docker al .env (sin sobreescribir si ya existen)
    grep -q "^APP_KEY=$" /var/www/html/.env 2>/dev/null || \
        echo "APP_KEY=" >> /var/www/html/.env
fi

# Sincronizar las variables de entorno del contenedor al .env
# (para que Laravel las pueda leer con config() en runtime)
for var in APP_ENV APP_DEBUG APP_URL APP_KEY \
           DB_CONNECTION DB_HOST DB_PORT DB_DATABASE DB_USERNAME DB_PASSWORD \
           SESSION_DRIVER CACHE_STORE QUEUE_CONNECTION \
           LOG_CHANNEL LOG_LEVEL; do
    value=$(printenv "$var" 2>/dev/null || true)
    if [ -n "$value" ]; then
        # Escapar caracteres especiales para sed
        escaped=$(printf '%s\n' "$value" | sed 's/[&/\]/\\&/g')
        # Reemplazar o agregar la línea
        if grep -q "^${var}=" /var/www/html/.env; then
            sed -i "s|^${var}=.*|${var}=${escaped}|" /var/www/html/.env
        else
            echo "${var}=${escaped}" >> /var/www/html/.env
        fi
    fi
done

# Asegurar permisos correctos en .env
chmod 640 /var/www/html/.env
chown www-data:www-data /var/www/html/.env

# Generar APP_KEY si quedó vacío después de la sincronización
CURRENT_KEY=$(grep "^APP_KEY=" /var/www/html/.env | cut -d= -f2-)
if [ -z "$CURRENT_KEY" ] || [ "$CURRENT_KEY" = "base64:" ]; then
    echo "🔑 Generando APP_KEY..."
    # Hacer backup temporal del .env porque key:generate lo lee
    cp /var/www/html/.env /tmp/.env.backup
    php artisan key:generate --force
    # Restaurar las variables de Docker que key:generate pudo sobreescribir
    cp /tmp/.env.backup /var/www/html/.env
    rm /tmp/.env.backup
    # Re-sincronizar por seguridad
    for var in APP_ENV APP_DEBUG APP_URL \
               DB_CONNECTION DB_HOST DB_PORT DB_DATABASE DB_USERNAME DB_PASSWORD \
               SESSION_DRIVER CACHE_STORE QUEUE_CONNECTION \
               LOG_CHANNEL LOG_LEVEL; do
        value=$(printenv "$var" 2>/dev/null || true)
        if [ -n "$value" ]; then
            escaped=$(printf '%s\n' "$value" | sed 's/[&/\]/\\&/g')
            if grep -q "^${var}=" /var/www/html/.env; then
                sed -i "s|^${var}=.*|${var}=${escaped}|" /var/www/html/.env
            else
                echo "${var}=${escaped}" >> /var/www/html/.env
            fi
        fi
    done
    chmod 640 /var/www/html/.env
fi
echo "🔐 APP_KEY actual: $(grep ^APP_KEY= /var/www/html/.env | cut -c1-30)..."

# ============================================================================
# 3. Cachear configuración (solo producción)
# ============================================================================
if [ "$APP_ENV" = "production" ]; then
    echo "⚡ Cacheando configuración para producción..."
    php artisan config:cache
    php artisan route:cache
    php artisan view:cache
fi

# ============================================================================
# 4. Ejecutar migraciones (solo si SKIP_MIGRATIONS no está en true)
# ============================================================================
if [ "${SKIP_MIGRATIONS:-false}" != "true" ]; then
    echo "📦 Ejecutando migraciones..."
    php artisan migrate --force --no-interaction
else
    echo "⏭️  Migraciones omitidas (SKIP_MIGRATIONS=true)"
fi

# ============================================================================
# 5. Storage link (para archivos públicos)
# ============================================================================
if [ ! -L /var/www/html/public/storage ]; then
    php artisan storage:link 2>/dev/null || true
fi

# ============================================================================
# 6. Asegurar permisos
# ============================================================================
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

echo "✅ Backend listo. Arrancando servicios..."

# Ejecutar CMD pasado (supervisord)
exec "$@"