<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\OrganizationController;
use App\Http\Controllers\Api\TeamController;
use App\Http\Controllers\Api\PlayerController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\DisciplineController;
use App\Http\Controllers\Api\DisciplineStatisticController;
use App\Http\Controllers\Api\ChampionshipTeamController;
use App\Http\Controllers\Api\ChampionshipPlayerController;

Route::middleware(['auth:sanctum', 'championship.access'])->group(function () {
    Route::apiResource('teams', TeamController::class);
    Route::apiResource('championshipTeams', ChampionshipTeamController::class);
    Route::apiResource('championshipPlayers', ChampionshipPlayerController::class);
    Route::apiResource('players', PlayerController::class);
    Route::apiResource('disciplines', DisciplineController::class);
    Route::get('disciplines/{discipline}/statistics', 
        [DisciplineStatisticController::class, 'index']
    );
    Route::get(
        '/categories/{category}/teams',
        [TeamController::class, 'index']
    );

    // Route to add existing teams to a championship discipline
    Route::post(
        '/championshipTeams/addExistingTeams',
        [ChampionshipTeamController::class, 'addExistingTeams']
    );

    Route::post(
        '/championshipPlayers/addExistingPlayers',
        [ChampionshipPlayerController::class, 'addExistingPlayers']
    );
});