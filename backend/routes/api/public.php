<?php

use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ChampionshipController;
use App\Http\Controllers\Api\DisciplineController;
use App\Http\Controllers\Api\GameMatchController;
use App\Http\Controllers\Api\GroupController;
use App\Http\Controllers\Api\PlayerController;
use App\Http\Controllers\Api\PlayerStatisticController;
use App\Http\Controllers\Api\PublicSearchController;
use App\Http\Controllers\Api\StandingController;
use App\Http\Controllers\Api\TeamController;
use Illuminate\Support\Facades\Route;

Route::middleware(['public.access', 'throttle:60,1'])->prefix('public')->group(function () {
    // ========== CAMPEONATOS ==========
    Route::get('/championships', [ChampionshipController::class, 'indexPublic']);
    Route::get('/championships/{championship}', [ChampionshipController::class, 'showPublic']);
    Route::get('/championships/{championship}/disciplines', [ChampionshipController::class, 'disciplines']);

    // ========== PARTIDOS ==========
    Route::get('/matches', [GameMatchController::class, 'indexPublic']);
    Route::get('/matches/live', [GameMatchController::class, 'live']);
    Route::get('/matches/upcoming', [GameMatchController::class, 'upcoming']);
    Route::get('/matches/{id}', [GameMatchController::class, 'showPublic']);

    // ========== TABLA DE POSICIONES ==========
    Route::get('/standings', [StandingController::class, 'indexPublic']);
    Route::get('/standings/championship/{championshipId}', [StandingController::class, 'byChampionship']);
    Route::get('/standings/group/{groupId}', [GroupController::class, 'getPublicStandings']);

    // ========== EQUIPOS ==========
    Route::get('/teams', [TeamController::class, 'indexPublic']);
    Route::get('/teams/{id}', [TeamController::class, 'showPublic']);

    // ========== JUGADORES ==========
    Route::get('/players', [PlayerController::class, 'indexPublic']);
    Route::get('/players/{id}', [PlayerController::class, 'showPublic']);

    // ========== DISCIPLINAS ==========
    Route::get('/disciplines', [DisciplineController::class, 'indexPublic']);
    Route::get('/disciplines/{id}', [DisciplineController::class, 'showPublic']);

    // ========== CATEGORÍAS ==========
    Route::get('/categories', [CategoryController::class, 'indexPublic']);
    Route::get('/categories/{id}', [CategoryController::class, 'showPublic']);

    // ========== ESTADÍSTICAS ==========
    Route::get('/statistics/ranking', [PlayerStatisticController::class, 'getPublicRanking']);
    Route::get('/statistics/top-scorers', [PlayerStatisticController::class, 'getPublicTopScorers']);
    Route::get('/statistics/top-assists', [PlayerStatisticController::class, 'getPublicTopAssists']);
    Route::get('/statistics/top-yellow-cards', [PlayerStatisticController::class, 'getPublicTopYellowCards']);
    Route::get('/statistics/top-red-cards', [PlayerStatisticController::class, 'getPublicTopRedCards']);
    Route::get('/players/{id}/history', [PlayerStatisticController::class, 'getPublicHistory']);

    // ========== BÚSQUEDA ==========
    Route::get('/search', [PublicSearchController::class, 'search']);
});