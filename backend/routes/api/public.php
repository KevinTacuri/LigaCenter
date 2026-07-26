<?php

use App\Http\Controllers\Public\PublicChampionshipController;
use App\Http\Controllers\Public\PublicDisciplineController;
use App\Http\Controllers\Public\PublicCategoryController;
use App\Http\Controllers\Public\PublicMatchController;
use App\Http\Controllers\Public\PublicPlayerController;
use App\Http\Controllers\Public\PublicSearchController;
use App\Http\Controllers\Public\PublicTeamController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes - Públicas
|--------------------------------------------------------------------------
|
*/

Route::prefix('public')->group(function () {
    // Búsqueda global
    Route::get('/search', [PublicSearchController::class, 'search']);

    // Disciplinas
    Route::get('/disciplines', [PublicDisciplineController::class, 'index']);
    
    // Categorías
    Route::get('/categories', [PublicCategoryController::class, 'index']);

    // Campeonatos
    Route::get('/championships', [PublicChampionshipController::class, 'index']);
    Route::get('/championships/{id}', [PublicChampionshipController::class, 'show']);
    Route::get('/championships/{id}/standings', [PublicChampionshipController::class, 'standings']);
    Route::get('/championships/{id}/matches', [PublicChampionshipController::class, 'matches']);
    Route::get('/championships/{id}/statistics', [PublicChampionshipController::class, 'statistics']);
    Route::get('/championships/{id}/standings-complete', [PublicChampionshipController::class, 'standingsComplete']);
    Route::get('/championships/{id}/disciplines', [PublicChampionshipController::class, 'disciplines']);
    Route::get('/championships/{id}/categories', [PublicChampionshipController::class, 'categories']);

    // Partidos
    Route::get('/matches', [PublicMatchController::class, 'index']);
    Route::get('/matches/live', [PublicMatchController::class, 'live']);
    Route::get('/matches/highlighted', [PublicMatchController::class, 'highlighted']);
    Route::get('/matches/{id}', [PublicMatchController::class, 'show']);

    // Equipos
    Route::get('/teams', [PublicTeamController::class, 'index']);
    Route::get('/teams/{id}', [PublicTeamController::class, 'show']);

    // Jugadores
    Route::get('/players', [PublicPlayerController::class, 'index']);
    Route::get('/players/{id}', [PublicPlayerController::class, 'show']);
});