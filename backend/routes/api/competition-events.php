<?php

use App\Http\Controllers\Api\CompetitionEventController;
use App\Http\Controllers\Api\CompetitionEventParticipantController;
use App\Http\Controllers\Api\CompetitionResultAttemptController;
use App\Http\Controllers\Api\CompetitionResultController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'championship.access'])->group(function () {
    Route::get(
        'competition-events/{competitionEvent}/standings',
        [CompetitionEventController::class, 'standings']
    );
    Route::apiResource('competition-events', CompetitionEventController::class);
    Route::apiResource(
        'competition-event-participants',
        CompetitionEventParticipantController::class
    );
    Route::apiResource(
        'competition-results',
        CompetitionResultController::class
    );
    Route::apiResource(
        'competition-result-attempts',
        CompetitionResultAttemptController::class
    );
});