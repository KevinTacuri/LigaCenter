<?php

use App\Http\Controllers\Api\VenueController;
use App\Http\Controllers\Api\GameMatchController;
use App\Http\Controllers\Api\FixtureController;

Route::middleware(['auth:sanctum', 'championship.access'])->group(function () {
    Route::apiResource('venues', VenueController::class);
    Route::get('venues-available', [VenueController::class, 'getAvailableVenues']);
    Route::apiResource('matches', GameMatchController::class);
    Route::put('matches/{id}/reschedule', [GameMatchController::class, 'reschedule']);
    Route::put('matches/{id}/sync-timer', [GameMatchController::class, 'syncTimer']);
    Route::post('fixture/generate', [FixtureController::class, 'generate']);
    Route::get('fixture', [FixtureController::class, 'getFixture']);
    Route::post('fixture/schedule-round', [FixtureController::class, 'scheduleRound']);
});