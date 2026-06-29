<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class PublicAccessMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        
        if ($request->user()) {
            return $next($request);
        }

        if (!$request->isMethod('GET')) {
            return response()->json([
                'message' => 'Método no permitido para usuarios no autenticados'
            ], 405);
        }

        $championshipId = $request->route('championship') ?? 
                         $request->route('id') ?? 
                         $request->input('championship_id');

        if ($championshipId) {
            $championship = \App\Models\Championship::find($championshipId);
            if ($championship && !$championship->is_public) {
                return response()->json([
                    'message' => 'Este campeonato no es público'
                ], 403);
            }
        }

        return $next($request);
    }
}