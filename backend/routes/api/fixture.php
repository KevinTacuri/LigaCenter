<?php

use App\Http\Controllers\Api\VenueController;
use App\Http\Controllers\Api\GameMatchController;
use App\Http\Controllers\Api\FixtureController;

// Venues
Route::apiResource('venues', VenueController::class);
Route::get('venues-available', [VenueController::class, 'getAvailableVenues']);

// Matches
Route::apiResource('matches', GameMatchController::class);
Route::put('matches/{id}/reschedule', [GameMatchController::class, 'reschedule']);

// Fixture
Route::post('fixture/generate', [FixtureController::class, 'generate']);
Route::get('fixture', [FixtureController::class, 'getFixture']);
Route::post('fixture/schedule-round', [FixtureController::class, 'scheduleRound']);