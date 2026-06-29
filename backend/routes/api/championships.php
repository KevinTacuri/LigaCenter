<?php

use AppHttpControllersApiChampionshipController;
use AppHttpControllersApiChampionshipUserController;
use IlluminateSupportFacadesRoute;

Route::middleware(['auth:sanctum', 'championship.access'])->group(function () {
    Route::get('championships', [ChampionshipController::class, 'index']);
    Route::get('championships/{id}', [ChampionshipController::class, 'show']);
    Route::post('championships', [ChampionshipController::class, 'store']);
    Route::put('championships/{id}', [ChampionshipController::class, 'update']);
    Route::delete('championships/{id}', [ChampionshipController::class, 'destroy']);
    Route::post('championships/{id}/users', [ChampionshipController::class, 'addUser']);
    Route::get('championships/{championshipId}/users', [ChampionshipUserController::class, 'index']);
    Route::put('championship-users/{id}', [ChampionshipUserController::class, 'update']);
    Route::delete('championship-users/{id}', [ChampionshipUserController::class, 'destroy']);
    Route::get('championships/{id}/rules', [ChampionshipController::class, 'downloadRules']);
});
