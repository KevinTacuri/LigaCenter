<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\MatchReportController;
use App\Http\Controllers\Api\MatchIncidenceController;
use App\Http\Controllers\Api\SanctionController;
use App\Http\Controllers\Api\StandingController;

Route::middleware(['auth:sanctum', 'championship.access'])->group(function () {
    Route::get('match-reports/by-match/{matchId}', [MatchReportController::class, 'getByMatch']);
    Route::apiResource('match-reports', MatchReportController::class);
    Route::post('match-reports/{id}/lock', [MatchReportController::class, 'lock']);
    Route::post('match-reports/{id}/walkover', [MatchReportController::class, 'walkover']);
    Route::apiResource('match-incidences', MatchIncidenceController::class);
    Route::apiResource('sanctions', SanctionController::class);
    Route::apiResource('standings', StandingController::class)->only(['index', 'show']);
});
