<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\OrganizationController;
use App\Http\Controllers\Api\TeamController;
use App\Http\Controllers\Api\PlayerController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\DisciplineController;
use App\Http\Controllers\Api\DisciplineStatisticController;

Route::middleware(['auth:sanctum', 'championship.access'])->group(function () {
    Route::apiResource('teams', TeamController::class);
    Route::apiResource('players', PlayerController::class);
    Route::apiResource('categories', CategoryController::class);
    Route::apiResource('disciplines', DisciplineController::class);
    Route::get('disciplines/{discipline}/statistics', 
        [DisciplineStatisticController::class, 'index']
    );
});