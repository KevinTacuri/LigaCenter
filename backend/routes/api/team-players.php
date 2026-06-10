<?php

use App\Http\Controllers\Api\TeamPlayerController;

Route::middleware(['auth:sanctum', 'championship.access'])->group(function () {
    Route::apiResource('team-players', TeamPlayerController::class);
    Route::get('teams/{teamId}/players', [TeamPlayerController::class, 'getPlayersByTeam']);
    Route::get('players/{playerId}/teams', [TeamPlayerController::class, 'getTeamsByPlayer']);
});