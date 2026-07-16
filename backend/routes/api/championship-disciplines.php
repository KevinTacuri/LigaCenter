<?php

use App\Http\Controllers\Api\ChampionshipDisciplineController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {

    Route::get(
        '/championships/{championship}/disciplines',
        [ChampionshipDisciplineController::class, 'index']
    );

    Route::post(
        '/championships/{championship}/disciplines',
        [ChampionshipDisciplineController::class, 'store']
    );

    Route::get(
        '/championship-disciplines/{championshipDiscipline}',
        [ChampionshipDisciplineController::class, 'show']
    );

    Route::put(
        '/championship-disciplines/{championshipDiscipline}',
        [ChampionshipDisciplineController::class, 'update']
    );

    Route::delete(
        '/championship-disciplines/{championshipDiscipline}',
        [ChampionshipDisciplineController::class, 'destroy']
    );

});