<?php

namespace App\Traits;

use Illuminate\Http\JsonResponse;

trait ApiResponse
{
    protected function successResponse($data, string $message = null, int $code = 200): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $data,
            'message' => $message,
        ], $code);
    }

    protected function errorResponse(string $message, int $code, $errors = null): JsonResponse
    {
        return response()->json([
            'success' => false,
            'data' => $errors,
            'message' => $message,
        ], $code);
    }
}