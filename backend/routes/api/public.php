<?php

use AppHttpControllersApiCategoryController;
use AppHttpControllersApiChampionshipController;
use AppHttpControllersApiDisciplineController;
use AppHttpControllersApiGameMatchController;
use AppHttpControllersApiGroupController;
use AppHttpControllersApiPlayerController;
use AppHttpControllersApiPlayerStatisticController;
use AppHttpControllersApiPublicSearchController;
use AppHttpControllersApiStandingController;
use AppHttpControllersApiTeamController;
use IlluminateSupportFacadesRoute;

Route::middleware(['public.access', 'throttle:60,1'])->prefix('public')->group(function () {
    Route::get('/championships', [ChampionshipController::class, 'indexPublic']);
    Route::get('/championships/{championship}', [ChampionshipController::class, 'showPublic']);
    Route::get('/championships/{championship}/disciplines', [ChampionshipController::class, 'disciplines']);

    Route::get('/matches', [GameMatchController::class, 'indexPublic']);
    Route::get('/matches/live', [GameMatchController::class, 'live']);
    Route::get('/matches/upcoming', [GameMatchController::class, 'upcoming']);
    Route::get('/matches/{id}', [GameMatchController::class, 'showPublic']);

    Route::get('/standings', [StandingController::class, 'indexPublic']);
    Route::get('/standings/championship/{championshipId}', [StandingController::class, 'byChampionship']);
    Route::get('/standings/group/{groupId}', [GroupController::class, 'getPublicStandings']);

    Route::get('/teams', [TeamController::class, 'indexPublic']);
    Route::get('/teams/{id}', [TeamController::class, 'showPublic']);

    Route::get('/players', [PlayerController::class, 'indexPublic']);
    Route::get('/players/{id}', [PlayerController::class, 'showPublic']);

    Route::get('/disciplines', [DisciplineController::class, 'indexPublic']);
    Route::get('/disciplines/{id}', [DisciplineController::class, 'showPublic']);

    Route::get('/categories', [CategoryController::class, 'indexPublic']);
    Route::get('/categories/{id}', [CategoryController::class, 'showPublic']);

    Route::get('/statistics/ranking', [PlayerStatisticController::class, 'getPublicRanking']);
    Route::get('/statistics/top-scorers', [PlayerStatisticController::class, 'getPublicTopScorers']);
    Route::get('/statistics/top-assists', [PlayerStatisticController::class, 'getPublicTopAssists']);
    Route::get('/statistics/top-yellow-cards', [PlayerStatisticController::class, 'getPublicTopYellowCards']);
    Route::get('/statistics/top-red-cards', [PlayerStatisticController::class, 'getPublicTopRedCards']);
    Route::get('/players/{id}/history', [PlayerStatisticController::class, 'getPublicHistory']);

    Route::get('/search', [PublicSearchController::class, 'search']);
});
