<?php

namespace App\Services;

use App\Models\CompetitionEvent;
use App\Models\CompetitionEventGroup;
use App\Models\CompetitionEventGroupParticipant;
use App\Models\CompetitionEventStage;
use App\Models\CompetitionResult;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CompetitionQualificationService
{
    public function finalizeStage(
        CompetitionEventStage $stage
    ): array {
        return DB::transaction(
            function () use ($stage) {

                /*
                |--------------------------------------------------------------------------
                | VALIDAR ETAPA
                |--------------------------------------------------------------------------
                */

                if ($stage->status === 'finalizado') {
                    throw ValidationException::withMessages([
                        'stage' =>
                            'Esta etapa ya fue finalizada.',
                    ]);
                }

                $groups =
                    CompetitionEventGroup::where(
                        'competition_event_stage_id',
                        $stage->id
                    )
                    ->orderBy('group_number')
                    ->get();

                if ($groups->isEmpty()) {
                    throw ValidationException::withMessages([
                        'groups' =>
                            'La etapa no tiene grupos o series.',
                    ]);
                }

                /*
                |--------------------------------------------------------------------------
                | TODOS LOS GRUPOS DEBEN ESTAR FINALIZADOS
                |--------------------------------------------------------------------------
                */

                $unfinishedGroups =
                    $groups->filter(
                        fn ($group) =>
                            $group->status !== 'finalizado'
                    );

                if ($unfinishedGroups->isNotEmpty()) {
                    throw ValidationException::withMessages([
                        'groups' =>
                            'Todos los grupos de la etapa deben estar finalizados.',
                    ]);
                }

                /*
                |--------------------------------------------------------------------------
                | ETAPA FINAL
                |--------------------------------------------------------------------------
                */

                if ($stage->stage_type === 'final') {

                    $stage->update([
                        'status' => 'finalizado',
                    ]);

                    $event =
                        CompetitionEvent::findOrFail(
                            $stage->competition_event_id
                        );

                    /*
                    | Si ya no queda ninguna etapa pendiente,
                    | termina también el evento.
                    */

                    $hasPendingStages =
                        CompetitionEventStage::where(
                            'competition_event_id',
                            $event->id
                        )
                        ->where(
                            'status',
                            '!=',
                            'finalizado'
                        )
                        ->exists();

                    if (!$hasPendingStages) {
                        $event->update([
                            'status' => 'finalizado',
                        ]);
                    }

                    return [
                        'stage' => $stage->fresh(),
                        'next_stage' => null,
                        'qualified_count' => 0,
                        'qualified_participant_ids' => [],
                    ];
                }

                /*
                |--------------------------------------------------------------------------
                | BUSCAR SIGUIENTE ETAPA
                |--------------------------------------------------------------------------
                */

                $nextStage =
                    CompetitionEventStage::where(
                        'competition_event_id',
                        $stage->competition_event_id
                    )
                    ->where(
                        'stage_number',
                        '>',
                        $stage->stage_number
                    )
                    ->orderBy('stage_number')
                    ->first();

                if (!$nextStage) {
                    throw ValidationException::withMessages([
                        'next_stage' =>
                            'No existe una siguiente etapa configurada.',
                    ]);
                }

                $nextGroups =
                    CompetitionEventGroup::where(
                        'competition_event_stage_id',
                        $nextStage->id
                    )
                    ->orderBy('group_number')
                    ->get();

                if ($nextGroups->isEmpty()) {
                    throw ValidationException::withMessages([
                        'next_stage_groups' =>
                            'La siguiente etapa no tiene grupos o series configurados.',
                    ]);
                }

                /*
                |--------------------------------------------------------------------------
                | RESULTADOS VÁLIDOS DE LA ETAPA ACTUAL
                |--------------------------------------------------------------------------
                */

                $results =
                    CompetitionResult::with([
                        'groupParticipant',
                    ])
                    ->whereHas(
                        'groupParticipant.group',
                        function ($query) use ($stage) {
                            $query->where(
                                'competition_event_stage_id',
                                $stage->id
                            );
                        }
                    )
                    ->where(
                        'status',
                        'oficializado'
                    )
                    ->whereNotNull(
                        'result_value'
                    )
                    ->get();

                if ($results->isEmpty()) {
                    throw ValidationException::withMessages([
                        'results' =>
                            'La etapa no tiene resultados válidos.',
                    ]);
                }

                /*
                |--------------------------------------------------------------------------
                | OBTENER CLASIFICADOS
                |--------------------------------------------------------------------------
                */

                $qualifiedResults =
                    match ($stage->qualification_method) {

                        'best_per_group' =>
                            $this->bestPerGroup(
                                $groups,
                                $results,
                                (int)
                                $stage->qualifiers_per_group
                            ),

                        'best_overall' =>
                            $this->bestOverall(
                                $stage,
                                $results,
                                (int)
                                $stage->qualifiers_count
                            ),

                        'all' =>
                            $results,

                        default =>
                            throw ValidationException::withMessages([
                                'qualification_method' =>
                                    'La etapa no tiene un método de clasificación válido.',
                            ]),
                    };

                /*
                |--------------------------------------------------------------------------
                | EXTRAER PARTICIPANTES DEL EVENTO
                |--------------------------------------------------------------------------
                */

                $qualifiedParticipantIds =
                    $qualifiedResults
                        ->map(
                            fn ($result) =>
                                $result
                                    ->groupParticipant
                                    ->competition_event_participant_id
                        )
                        ->unique()
                        ->values();

                if ($qualifiedParticipantIds->isEmpty()) {
                    throw ValidationException::withMessages([
                        'qualifiers' =>
                            'No se encontraron participantes clasificados.',
                    ]);
                }

                /*
                |--------------------------------------------------------------------------
                | ASIGNAR A LA SIGUIENTE ETAPA
                |--------------------------------------------------------------------------
                */

                foreach (
                    $qualifiedParticipantIds
                    as $index => $participantId
                ) {
                    /*
                    | Evitar que el participante aparezca
                    | dos veces en la siguiente etapa.
                    */

                    $alreadyAssigned =
                        CompetitionEventGroupParticipant::where(
                            'competition_event_participant_id',
                            $participantId
                        )
                        ->whereHas(
                            'group',
                            function ($query) use ($nextStage) {
                                $query->where(
                                    'competition_event_stage_id',
                                    $nextStage->id
                                );
                            }
                        )
                        ->exists();

                    if ($alreadyAssigned) {
                        continue;
                    }

                    /*
                    | Una sola serie final:
                    |
                    | todos van al mismo grupo.
                    |
                    | Múltiples grupos:
                    |
                    | reparto circular.
                    */

                    $targetGroup =
                        $nextGroups[
                            $index %
                            $nextGroups->count()
                        ];

                    $nextStartOrder =
                        CompetitionEventGroupParticipant::where(
                            'competition_event_group_id',
                            $targetGroup->id
                        )
                        ->max('start_order');

                    CompetitionEventGroupParticipant::create([
                        'competition_event_group_id' =>
                            $targetGroup->id,

                        'competition_event_participant_id' =>
                            $participantId,

                        'lane' => null,

                        'start_order' =>
                            ($nextStartOrder ?? 0) + 1,
                    ]);
                }

                /*
                |--------------------------------------------------------------------------
                | FINALIZAR ETAPA ACTUAL
                |--------------------------------------------------------------------------
                */

                $stage->update([
                    'status' => 'finalizado',
                ]);

                return [
                    'stage' =>
                        $stage->fresh(),

                    'next_stage' =>
                        $nextStage,

                    'qualified_count' =>
                        $qualifiedParticipantIds->count(),

                    'qualified_participant_ids' =>
                        $qualifiedParticipantIds->all(),
                ];
            }
        );
    }

    /*
    |--------------------------------------------------------------------------
    | MEJORES POR GRUPO
    |--------------------------------------------------------------------------
    */

    private function bestPerGroup(
        $groups,
        $results,
        int $quantity
    ) {
        return $groups
            ->flatMap(
                function ($group) use (
                    $results,
                    $quantity
                ) {
                    return $results
                        ->filter(
                            fn ($result) =>
                                $result
                                    ->groupParticipant
                                    ->competition_event_group_id
                                === $group->id
                        )
                        ->sortBy(
                            'position'
                        )
                        ->take(
                            $quantity
                        );
                }
            )
            ->values();
    }

    /*
    |--------------------------------------------------------------------------
    | MEJORES DE TODA LA ETAPA
    |--------------------------------------------------------------------------
    */

    private function bestOverall(
        CompetitionEventStage $stage,
        $results,
        int $quantity
    ) {
        return $this
            ->orderOverall(
                $stage,
                $results
            )
            ->take(
                $quantity
            )
            ->values();
    }

    public function getStageSummary(
        CompetitionEventStage $stage
    ): array {
        if ($stage->status !== 'finalizado') {
            return [
                'type' => 'pending',
                'participants' => [],
            ];
        }

        $stage->loadMissing('event');

        $results = CompetitionResult::with([
            'groupParticipant.group',
            'groupParticipant.participant.championshipPlayer',
            'groupParticipant.participant.championshipTeam',
        ])
            ->whereHas(
                'groupParticipant.group',
                function ($query) use ($stage) {
                    $query->where(
                        'competition_event_stage_id',
                        $stage->id
                    );
                }
            )
            ->where(
                'status',
                'oficializado'
            )
            ->whereNotNull(
                'result_value'
            )
            ->get();

        /*
        |--------------------------------------------------------------------------
        | FINAL → PODIO
        |--------------------------------------------------------------------------
        */

        if ($stage->stage_type === 'final') {
            $ordered =
                $this->orderOverall(
                    $stage,
                    $results
                );

            $podiumPlaces =
                (int) (
                    $stage->podium_places
                    ?? 3
                );

            return [
                'type' => 'podium',

                'participants' =>
                    $this->serializeResults(
                        $ordered
                            ->take(
                                $podiumPlaces
                            )
                            ->values(),
                        true
                    ),
            ];
        }

        /*
        |--------------------------------------------------------------------------
        | CLASIFICADOS
        |--------------------------------------------------------------------------
        */

        $groups =
            CompetitionEventGroup::where(
                'competition_event_stage_id',
                $stage->id
            )
            ->orderBy(
                'group_number'
            )
            ->get();

        $qualified =
            match (
                $stage->qualification_method
            ) {
                'best_per_group' =>
                    $this->bestPerGroup(
                        $groups,
                        $results,
                        (int)
                        $stage->qualifiers_per_group
                    ),

                'best_overall' =>
                    $this->bestOverall(
                        $stage,
                        $results,
                        (int)
                        $stage->qualifiers_count
                    ),

                'all' =>
                    $this->orderOverall(
                        $stage,
                        $results
                    ),

                default =>
                    collect(),
            };

        return [
            'type' => 'qualified',

            'participants' =>
                $this->serializeResults(
                    $qualified,
                    false
                ),
        ];
    }

    private function orderOverall(
        CompetitionEventStage $stage,
        $results
    ) {
        $stage->loadMissing(
            'event'
        );

        /*
        * Carrera:
        * menor resultado = mejor.
        *
        * Puntaje / salto / lanzamiento:
        * mayor resultado = mejor.
        */

        if (
            $stage->event->event_type
            === 'carrera'
        ) {
            return $results
                ->sortBy(
                    'result_value'
                )
                ->values();
        }

        return $results
            ->sortByDesc(
                'result_value'
            )
            ->values();
    }

    private function serializeResults(
        $results,
        bool $useOverallRanking
    ): array {
        return $results
            ->values()
            ->map(
                function (
                    $result,
                    $index
                ) use (
                    $useOverallRanking
                ) {
                    $eventParticipant =
                        $result
                            ->groupParticipant
                            ->participant;

                    $name =
                        $eventParticipant
                            ->championshipPlayer
                            ?->player->name
                        ??
                        $eventParticipant
                            ->championshipTeam
                            ?->team->name
                        ??
                        'Participante';

                    return [
                        'competition_event_participant_id' =>
                            $eventParticipant->id,

                        'name' =>
                            $name,

                        'group_name' =>
                            $result
                                ->groupParticipant
                                ->group
                                ?->name,

                        'result_value' =>
                            $result
                                ->result_value,

                        'result_unit' =>
                            $result
                                ->result_unit,

                        /*
                        * position es la posición
                        * dentro de su grupo.
                        */
                        'source_position' =>
                            $result
                                ->position,

                        /*
                        * rank se usa principalmente
                        * para el podio/global.
                        */
                        'rank' =>
                            $useOverallRanking
                                ? $index + 1
                                : $result->position,
                    ];
                }
            )
            ->all();
    }
}