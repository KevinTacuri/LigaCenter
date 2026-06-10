<?php

use App\Http\Controllers\Api\PlayerStatisticController;

Route::get('players/{id}/history', [PlayerStatisticController::class, 'getHistory']);
Route::get('statistics/top-scorers', [PlayerStatisticController::class, 'getTopScorers']);
Route::get('statistics/top-yellow-cards', [PlayerStatisticController::class, 'getTopYellowCards']);
Route::get('statistics/top-red-cards', [PlayerStatisticController::class, 'getTopRedCards']);