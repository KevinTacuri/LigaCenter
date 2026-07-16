# =============================================================================
# LigaCenter Backend - Laravel 13 / PHP 8.4
# Multi-stage build optimizado para producción
# =============================================================================

# ---- Stage 1: Build de dependencias con PHP 8.4 + Composer ----
# composer:2.7 viene con PHP 8.3 por defecto (no compatible con Laravel 13).
# Usamos PHP 8.4 CLI e instalamos Composer 2.7 desde la fuente oficial.
FROM php:8.4-cli-bookworm AS vendor

# Extensiones mínimas que Composer necesita
RUN apt-get update && apt-get install -y --no-install-recommends \
        git \
        unzip \
        ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Instalar Composer 2.7 desde el instalador oficial
COPY --from=composer:2.7 /usr/bin/composer /usr/bin/composer

WORKDIR /app

# Aumentar timeout de Composer a 15 minutos (paquete swagger-ui es pesado)
ENV COMPOSER_PROCESS_TIMEOUT=900

# Copiamos solo manifests primero (cacheo de capas Docker)
COPY composer.json composer.lock ./

# Instalar dependencias SIN dev para producción
RUN composer install \
    --no-dev \
    --no-scripts \
    --no-autoloader \
    --prefer-dist \
    --optimize-autoloader \
    --no-interaction \
    --no-progress

# Copiamos el resto del código
COPY . .

# Generar autoloader optimizado
RUN composer dump-autoload --optimize --no-dev --no-interaction

# ---- Stage 2: Runtime PHP-FPM + Nginx en un solo contenedor ----
FROM php:8.4-fpm-bookworm AS runtime

# Argumentos de build (se pueden sobreescribir en Dokploy)
ARG APP_ENV=production
ARG APP_DEBUG=false

ENV APP_ENV=${APP_ENV} \
    APP_DEBUG=${APP_DEBUG} \
    LOG_CHANNEL=stderr \
    LOG_LEVEL=info

# Dependencias del sistema + extensiones PHP requeridas por Laravel
# wget se incluye para soportar el healthcheck del docker-compose.yml
# (debe instalarse en la misma capa que nginx/supervisor para mantener el orden)
RUN apt-get update && apt-get install -y --no-install-recommends \
        nginx \
        supervisor \
        wget \
        libpq-dev \
        libzip-dev \
        libicu-dev \
        libpng-dev \
        libjpeg-dev \
        libfreetype6-dev \
        libonig-dev \
        zip \
        unzip \
        curl \
        ca-certificates \
        git \
    && docker-php-ext-install -j$(nproc) \
        pdo_mysql \
        pdo_pgsql \
        mbstring \
        zip \
        intl \
        bcmath \
        opcache \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Configuración de PHP para producción
RUN { \
        echo 'memory_limit=512M'; \
        echo 'upload_max_filesize=64M'; \
        echo 'post_max_size=64M'; \
        echo 'max_execution_time=120'; \
        echo 'date.timezone=America/Lima'; \
        echo 'opcache.enable=1'; \
        echo 'opcache.memory_consumption=256'; \
        echo 'opcache.max_accelerated_files=20000'; \
        echo 'opcache.validate_timestamps=0'; \
        echo 'opcache.revalidate_freq=0'; \
    } > /usr/local/etc/php/conf.d/ligacenter.ini

WORKDIR /var/www/html

# Copiar dependencias ya instaladas desde el stage de Composer
COPY --from=vendor /app /var/www/html

# Configuración de Nginx
COPY ./docker/nginx.conf /etc/nginx/conf.d/default.conf

# Configuración de Supervisor (gestiona php-fpm + nginx en el mismo contenedor)
COPY ./docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Script de entrada: espera DB, corre migraciones, arranca Supervisor
COPY ./docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Permisos correctos para Laravel
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html/storage /var/www/html/bootstrap/cache

EXPOSE 8000

ENTRYPOINT ["entrypoint.sh"]
CMD ["supervisord", "-c", "/etc/supervisor/supervisord.conf"]