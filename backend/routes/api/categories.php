<?php

use App\Http\Controllers\Api\CategoryController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {

    // Categorías de una disciplina de un campeonato
    Route::get(
        '/championship-disciplines/{championshipDiscipline}/categories',
        [CategoryController::class, 'index']
    );

    // Obtener todas las categorías de un campeonato
    Route::get(
        '/championships/{championship}/categories',
        [CategoryController::class, 'indexByChampionship']
    );

    Route::post(
        '/championship-disciplines/{championshipDiscipline}/categories',
        [CategoryController::class, 'store']
    );

    // Operaciones sobre una categoría específica
    Route::get(
        '/categories/{category}',
        [CategoryController::class, 'show']
    );

    Route::put(
        '/categories/{category}',
        [CategoryController::class, 'update']
    );

    Route::delete(
        '/categories/{category}',
        [CategoryController::class, 'destroy']
    );

});