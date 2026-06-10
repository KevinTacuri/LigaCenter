<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\Championship;

class CheckChampionshipAccess
{
    public function handle(Request $request, Closure $next)
    {
        $championshipId = $request->route('championship_id') 
            ?? $request->input('championship_id')
            ?? $request->query('championship_id');

        if (!$championshipId) {
            return $next($request);
        }

        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'No autenticado'], 401);
        }

        $championship = Championship::find($championshipId);

        if (!$championship) {
            return response()->json(['message' => 'Campeonato no encontrado'], 404);
        }

        $hasAccess = $championship->user_id === $user->id
            || $championship->users()->where('user_id', $user->id)->exists()
            || $user->hasRole('super-admin');

        if (!$hasAccess) {
            return response()->json(['message' => 'No tienes acceso a este campeonato'], 403);
        }

        return $next($request);
    }
}