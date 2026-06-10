<?php

use App\Http\Controllers\Api\ChampionshipController;
use App\Http\Controllers\Api\ChampionshipUserController;

Route::middleware(['auth:sanctum', 'championship.access'])->group(function () {
    Route::apiResource('championships', ChampionshipController::class);
    Route::post('championships/{id}/users', [ChampionshipController::class, 'addUser']);
    Route::get('championships/{championshipId}/users', [ChampionshipUserController::class, 'index']);
    Route::put('championship-users/{id}', [ChampionshipUserController::class, 'update']);
    Route::delete('championship-users/{id}', [ChampionshipUserController::class, 'destroy']);
});