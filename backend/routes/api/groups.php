<?php

use App\Http\Controllers\Api\GroupController;
use App\Http\Controllers\Api\GroupTeamController;

Route::middleware(['auth:sanctum', 'championship.access'])->group(function () {
    Route::get('groups', [GroupController::class, 'index']);
    Route::get('groups/{id}', [GroupController::class, 'show']);
    Route::get('groups/{id}/standings', [GroupController::class, 'getStandings']);

    Route::get('group-teams', [GroupTeamController::class, 'index']);
    Route::get('group-teams/{id}', [GroupTeamController::class, 'show']);
    Route::put('group-teams/{id}', [GroupTeamController::class, 'update']);
});