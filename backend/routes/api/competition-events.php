<?php

use App\Http\Controllers\Api\CompetitionEventController;
use App\Http\Controllers\Api\CompetitionEventParticipantController;
use App\Http\Controllers\Api\CompetitionResultAttemptController;
use App\Http\Controllers\Api\CompetitionResultController;
use App\Http\Controllers\Api\CompetitionEventParticipantMemberController;
use App\Http\Controllers\Api\CompetitionEventStageController;
use App\Http\Controllers\Api\CompetitionEventGroupController;
use App\Http\Controllers\Api\CompetitionEventGroupParticipantController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'championship.access'])->group(function () {
    Route::get(
        'competition-events/{competitionEvent}/standings',
        [CompetitionEventController::class, 'standings']
    );
    Route::post(
        'competition-events/{competitionEvent}/finish',
        [CompetitionEventController::class, 'finish']
    );
    Route::apiResource('competition-events', CompetitionEventController::class);
    Route::apiResource(
        'competition-event-participants',
        CompetitionEventParticipantController::class
    );
    // Rutas para los miembros de los participantes de la competencia
    Route::get(
        'competition-event-participants/{participant}/members',
        [CompetitionEventParticipantMemberController::class, 'index']
    );

    Route::post(
        'competition-event-participants/{participant}/members',
        [CompetitionEventParticipantMemberController::class, 'store']
    );

    Route::delete(
        'competition-event-participants/{participant}/members/{member}',
        [CompetitionEventParticipantMemberController::class, 'destroy']
    );

    // Rutas para las etapas de competencia
    Route::get(
        'competition-events/{competitionEvent}/stages',
        [CompetitionEventStageController::class, 'index']
    );

    Route::post(
        'competition-events/{competitionEvent}/stages',
        [CompetitionEventStageController::class, 'store']
    );

    Route::put(
        'competition-event-stages/{stage}',
        [CompetitionEventStageController::class, 'update']
    );

    Route::delete(
        'competition-event-stages/{stage}',
        [CompetitionEventStageController::class, 'destroy']
    );

    Route::get(
        'competition-event-stages/{stage}/standings',
        [CompetitionEventStageController::class, 'standings']
    );

    Route::post(
        'competition-event-stages/{stage}/advance',
        [CompetitionEventStageController::class, 'advance']
    );

    // Rutas para los grupos de competencia
    Route::get(
        'competition-event-stages/{stage}/groups',
        [CompetitionEventGroupController::class, 'index']
    );

    Route::post(
        'competition-event-stages/{stage}/groups',
        [CompetitionEventGroupController::class, 'store']
    );

    Route::put(
        'competition-event-groups/{group}',
        [CompetitionEventGroupController::class, 'update']
    );

    Route::delete(
        'competition-event-groups/{group}',
        [CompetitionEventGroupController::class, 'destroy']
    );

    // Rutas para los participantes de los grupos de competencia
    Route::get(
    'competition-event-groups/{group}/participants',
        [CompetitionEventGroupParticipantController::class, 'index']
    );

    Route::post(
        'competition-event-groups/{group}/participants',
        [CompetitionEventGroupParticipantController::class, 'store']
    );

    Route::put(
        'competition-event-group-participants/{groupParticipant}',
        [CompetitionEventGroupParticipantController::class, 'update']
    );

    Route::delete(
        'competition-event-group-participants/{groupParticipant}',
        [CompetitionEventGroupParticipantController::class, 'destroy']
    );

    // Rutas para los resultados de la competencia
    Route::get(
        'competition-results',
        [CompetitionResultController::class, 'index']
    );

    Route::post(
        'competition-results',
        [CompetitionResultController::class, 'store']
    );

    Route::get(
        'competition-results/{competitionResult}',
        [CompetitionResultController::class, 'show']
    );

    Route::put(
        'competition-results/{competitionResult}',
        [CompetitionResultController::class, 'update']
    );

    Route::delete(
        'competition-results/{competitionResult}',
        [CompetitionResultController::class, 'destroy']
    );

    // Rutas para los intentos de resultados
    Route::get(
        'competition-results/{competitionResult}/attempts',
        [CompetitionResultAttemptController::class, 'index']
    );

    Route::post(
        'competition-results/{competitionResult}/attempts',
        [CompetitionResultAttemptController::class, 'store']
    );

    Route::put(
        'competition-result-attempts/{attempt}',
        [CompetitionResultAttemptController::class, 'update']
    );

    Route::delete(
        'competition-result-attempts/{attempt}',
        [CompetitionResultAttemptController::class, 'destroy']
    );


});