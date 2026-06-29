<?php

use App\Http\Controllers\Api\ChampionshipController;
use App\Http\Controllers\Api\GameMatchController;
use App\Http\Controllers\Api\StandingController;
use App\Http\Controllers\Api\TeamController;
use App\Http\Controllers\Api\PlayerController;
use App\Http\Controllers\Api\DisciplineController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\GroupController;
use App\Http\Controllers\Api\PlayerStatisticController;

Route::middleware(['public.access'])->prefix('public')->group(function () {

    // ========== CAMPEONATOS ==========
    Route::get('/championships', [ChampionshipController::class, 'index']);
    Route::get('/championships/{championship}', [ChampionshipController::class, 'show']);
    Route::get('/championships/{championship}/disciplines', [ChampionshipController::class, 'disciplines']); // Nuevo método

    // ========== PARTIDOS ==========
    Route::get('/matches', [GameMatchController::class, 'index']);
    Route::get('/matches/live', [GameMatchController::class, 'live']); // Nuevo método
    Route::get('/matches/upcoming', [GameMatchController::class, 'upcoming']); // Nuevo método
    Route::get('/matches/{id}', [GameMatchController::class, 'show']);

    // ========== TABLA DE POSICIONES ==========
    Route::get('/standings', [StandingController::class, 'index']);
    Route::get('/standings/championship/{championshipId}', [StandingController::class, 'byChampionship']); // Nuevo método
    Route::get('/standings/group/{groupId}', [GroupController::class, 'getStandings']);

    // ========== EQUIPOS ==========
    Route::get('/teams', [TeamController::class, 'index']);
    Route::get('/teams/{id}', [TeamController::class, 'show']);

    // ========== JUGADORES ==========
    Route::get('/players', [PlayerController::class, 'index']);
    Route::get('/players/{id}', [PlayerController::class, 'show']);

    // ========== DISCIPLINAS ==========
    Route::get('/disciplines', [DisciplineController::class, 'index']);
    Route::get('/disciplines/{id}', [DisciplineController::class, 'show']);

    // ========== CATEGORÍAS ==========
    Route::get('/categories', [CategoryController::class, 'indexPublic']); // Nuevo método
    Route::get('/categories/{id}', [CategoryController::class, 'show']);

    // ========== ESTADÍSTICAS ==========
    Route::get('/statistics/ranking', [PlayerStatisticController::class, 'getRanking']);
    Route::get('/statistics/top-scorers', [PlayerStatisticController::class, 'getTopScorers']); // Nuevo método
    Route::get('/statistics/top-assists', [PlayerStatisticController::class, 'getTopAssists']); // Nuevo método
    Route::get('/statistics/top-yellow-cards', [PlayerStatisticController::class, 'getTopYellowCards']);
    Route::get('/statistics/top-red-cards', [PlayerStatisticController::class, 'getTopRedCards']);
    Route::get('/players/{id}/history', [PlayerStatisticController::class, 'getHistory']);

    // ========== BÚSQUEDA ==========
    Route::get('/search', [App\Http\Controllers\Api\PublicSearchController::class, 'search']); // Nuevo controlador

});