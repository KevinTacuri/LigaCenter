<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\MatchReportController;
use App\Http\Controllers\Api\MatchIncidenceController;
use App\Http\Controllers\Api\SanctionController;
use App\Http\Controllers\Api\StandingController;

/*
|--------------------------------------------------------------------------
| Match Reports
|--------------------------------------------------------------------------
*/

Route::get(
    'match-reports/by-match/{matchId}',
    [MatchReportController::class, 'getByMatch']
);

Route::apiResource(
    'match-reports',
    MatchReportController::class
);

Route::post(
    'match-reports/{id}/lock',
    [MatchReportController::class, 'lock']
);

/*
|--------------------------------------------------------------------------
| Match Incidences
|--------------------------------------------------------------------------
*/

Route::apiResource(
    'match-incidences',
    MatchIncidenceController::class
);

/*
|--------------------------------------------------------------------------
| Sanctions
|--------------------------------------------------------------------------
*/

Route::apiResource(
    'sanctions',
    SanctionController::class
);

/*
|--------------------------------------------------------------------------
| Standings
|--------------------------------------------------------------------------
*/

Route::apiResource(
    'standings',
    StandingController::class
)->only(['index', 'show']);