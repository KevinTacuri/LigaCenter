<?php

namespace App\OpenApi;

use OpenApi\Attributes as OA;

#[OA\Info(
    version: '1.0.0',
    title: 'LigaCenter API',
    description: 'API para la gestión de campeonatos deportivos'
)]
#[OA\Server(
    url: 'http://localhost:8000',
    description: 'Servidor Local'
)]
#[OA\SecurityScheme(
    securityScheme: 'sanctum',
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT'
)]
class OpenApiSpec
{
}