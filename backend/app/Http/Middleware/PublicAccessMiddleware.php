<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class PublicAccessMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        if (!$request->isMethod('GET')) {
            return response()->json([
                'message' => 'El portal público es de solo lectura',
            ], 405);
        }

        return $next($request);
    }
}
