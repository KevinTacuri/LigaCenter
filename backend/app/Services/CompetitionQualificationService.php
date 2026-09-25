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
                $stage->loadMissing('event');
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
                | 4. VALIDAR DESEMPATES
                |--------------------------------------------------------------------------
                */

                $tiebreakInfo = $this->getTiebreakInfo($stage);

                if ($tiebreakInfo['required']) {
                    throw ValidationException::withMessages([
                        'tiebreak' =>
                            'Existe un empate que debe resolverse antes de finalizar la etapa.',
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
                    
                    // Asignar Carril
                    // Solo las competencias de tipo carril usan carriles
                    $lane = null;

                    if ($stage->event->event_type === 'carrera') {
                        $lane = $this->nextAvailableLane($targetGroup->id);
                    }

                    CompetitionEventGroupParticipant::create([
                        'competition_event_group_id' =>
                            $targetGroup->id,

                        'competition_event_participant_id' =>
                            $participantId,

                        'lane' => $lane,

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
                    $groupResults =
                        $results
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
                            ->values();

                    $this->validateCutoffTie(
                        $groupResults,
                        $quantity
                    );

                    /*
                    * Como position ya establece
                    * el ranking normal, solo
                    * resolvemos igualdad de marca.
                    */

                    $groupResults =
                        $groupResults
                            ->sort(
                                function (
                                    $a,
                                    $b
                                ) {
                                    if (
                                        (float)
                                        $a->result_value
                                        !==
                                        (float)
                                        $b->result_value
                                    ) {
                                        return (
                                            $a->position
                                            <=>
                                            $b->position
                                        );
                                    }

                                    return (
                                        $a->tiebreak_order
                                        ?? PHP_INT_MAX
                                    )
                                    <=>
                                    (
                                        $b->tiebreak_order
                                        ?? PHP_INT_MAX
                                    );
                                }
                            );

                    return $groupResults
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

        $ordered = $this->orderOverall(
            $stage,
            $results
        );

        $this->validateCutoffTie(
            $ordered,
            $quantity,
        );

        return $ordered
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
                ->sort(
                    function ($a, $b) {
                        $result =
                            (float)
                            $a->result_value
                            <=>
                            (float)
                            $b->result_value;

                        if ($result !== 0) {
                            return $result;
                        }

                        return (
                            $a->tiebreak_order
                            ?? PHP_INT_MAX
                        )
                        <=>
                        (
                            $b->tiebreak_order
                            ?? PHP_INT_MAX
                        );
                    }
                )
                ->values();
        }

        return $results
            ->sort(
                function ($a, $b) {
                    $result =
                        (float)
                        $b->result_value
                        <=>
                        (float)
                        $a->result_value;

                    if ($result !== 0) {
                        return $result;
                    }

                    return (
                        $a->tiebreak_order
                        ?? PHP_INT_MAX
                    )
                    <=>
                    (
                        $b->tiebreak_order
                        ?? PHP_INT_MAX
                    );
                }
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

    private function validateCutoffTie(
        $results,
        int $quantity
    ): void {
        if (
            $quantity <= 0 ||
            $results->count() <= $quantity
        ) {
            return;
        }

        $ordered = $results->values();

        $lastQualified = $ordered[$quantity - 1];

        $firstEliminated = $ordered[$quantity];

        /*
        * No existe empate justo
        * en el corte.
        */

        if (
            (float)
            $lastQualified
                ->result_value
            !==
            (float)
            $firstEliminated
                ->result_value
        ) {
            return;
        }

        /*
        * Obtener todos los que tienen
        * exactamente esa misma marca.
        */

        $tieValue = $lastQualified->result_value;

        $tied = $ordered->filter(
            fn ($result) =>
                (float)
                $result
                    ->result_value
                ===
                (float)
                $tieValue
        );

        /*
        * Todos deben tener orden
        * de desempate.
        */
        $missingTiebreak =
            $tied->contains(
                fn ($result) =>
                    $result
                        ->tiebreak_order
                    === null
            );

        if ($missingTiebreak) {
            throw ValidationException::withMessages([
                'tiebreak' =>
                    'Existe un empate en el límite de clasificación. Debe registrar el desempate antes de finalizar la etapa.',
            ]);
        }

        /*
        * Tampoco permitimos:
        *
        * Luis  → 1
        * Mario → 1
        */

        $orders = $tied->pluck('tiebreak_order' );

        if (
            $orders->unique()->count()
            !==
            $orders->count()
        ) {
            throw ValidationException::withMessages([
                'tiebreak' =>
                    'Los participantes empatados deben tener órdenes de desempate diferentes.',
            ]);
        }
    }

    public function getTiebreakInfo(
        CompetitionEventStage $stage
    ): array {
        $stage->loadMissing(
            'event'
        );

        $results =
            CompetitionResult::with([
                'groupParticipant.group',
                'groupParticipant.participant.championshipPlayer',
                'groupParticipant.participant.championshipTeam',
            ])
            ->whereHas(
                'groupParticipant.group',
                fn ($query) =>
                    $query->where(
                        'competition_event_stage_id',
                        $stage->id
                    )
            )
            ->where(
                'status',
                'oficializado'
            )
            ->whereNotNull(
                'result_value'
            )
            ->get();

        $ties = collect();

        /*
        |--------------------------------------------------------------------------
        | FINAL → EMPATES QUE AFECTAN EL PODIO
        |--------------------------------------------------------------------------
        */

        if (
            $stage->stage_type ===
            'final'
        ) {
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

            $values =
                $ordered
                    ->take(
                        $podiumPlaces
                    )
                    ->pluck(
                        'result_value'
                    )
                    ->unique();

            foreach (
                $values
                as $value
            ) {
                $tied =
                    $ordered->filter(
                        fn ($result) =>
                            (float)
                            $result
                                ->result_value
                            ===
                            (float)
                            $value
                    );

                if (
                    $tied->count() > 1 &&
                    !$this->tieResolved(
                        $tied
                    )
                ) {
                    $ties->push(
                        $this->serializeTie(
                            $tied,
                            'podium'
                        )
                    );
                }
            }

            return [
                'required' =>
                    $ties->isNotEmpty(),

                'ties' =>
                    $ties->values(),
            ];
        }

        /*
        |--------------------------------------------------------------------------
        | BEST OVERALL
        |--------------------------------------------------------------------------
        */

        if (
            $stage
                ->qualification_method ===
            'best_overall'
        ) {
            $ordered =
                $this->orderOverall(
                    $stage,
                    $results
                );

            $quantity =
                (int)
                $stage
                    ->qualifiers_count;

            $tie =
                $this->findCutoffTie(
                    $ordered,
                    $quantity
                );

            if (
                $tie &&
                !$this->tieResolved(
                    $tie
                )
            ) {
                $ties->push(
                    $this->serializeTie(
                        $tie,
                        'overall'
                    )
                );
            }
        }

        /*
        |--------------------------------------------------------------------------
        | BEST PER GROUP
        |--------------------------------------------------------------------------
        */

        if (
            $stage
                ->qualification_method ===
            'best_per_group'
        ) {
            $groups =
                CompetitionEventGroup::where(
                    'competition_event_stage_id',
                    $stage->id
                )->get();

            foreach ($groups as $group) {
                $groupResults =
                    $results
                        ->filter(
                            fn ($result) =>
                                $result
                                    ->groupParticipant
                                    ->competition_event_group_id
                                ===
                                $group->id
                        )
                        ->sortBy(
                            'position'
                        )
                        ->values();

                $tie =
                    $this->findCutoffTie(
                        $groupResults,
                        (int)
                        $stage
                            ->qualifiers_per_group
                    );

                if (
                    $tie &&
                    !$this->tieResolved(
                        $tie
                    )
                ) {
                    $ties->push(
                        $this->serializeTie(
                            $tie,
                            'group',
                            $group->name
                        )
                    );
                }
            }
        }

        return [
            'required' =>
                $ties->isNotEmpty(),

            'ties' =>
                $ties->values(),
        ];
    }

    private function findCutoffTie(
        $results,
        int $quantity
    ) {
        if (
            $quantity <= 0 ||
            $results->count() <=
                $quantity
        ) {
            return null;
        }

        $results =
            $results->values();

        $qualified =
            $results[
                $quantity - 1
            ];

        $eliminated =
            $results[
                $quantity
            ];

        if (
            (float)
            $qualified->result_value
            !==
            (float)
            $eliminated->result_value
        ) {
            return null;
        }

        $value =
            $qualified
                ->result_value;

        return $results
            ->filter(
                fn ($result) =>
                    (float)
                    $result
                        ->result_value
                    ===
                    (float)
                    $value
            )
            ->values();
    }


    private function tieResolved(
        $results
    ): bool {
        $orders =
            $results->pluck(
                'tiebreak_order'
            );

        if (
            $orders->contains(
                null
            )
        ) {
            return false;
        }

        return
            $orders
                ->unique()
                ->count()
            ===
            $orders->count();
    }


    private function serializeTie(
        $results,
        string $scope,
        ?string $groupName = null
    ): array {
        return [
            'scope' =>
                $scope,

            'group_name' =>
                $groupName,

            'result_value' =>
                $results
                    ->first()
                    ->result_value,

            'participants' =>
                $results
                    ->map(
                        function (
                            $result
                        ) {
                            $participant =
                                $result
                                    ->groupParticipant
                                    ->participant;

                            return [
                                'result_id' =>
                                    $result->id,

                                'name' =>
                                    $participant
                                        ->championshipPlayer->player
                                        ?->name
                                    ??
                                    $participant
                                        ->championshipTeam->team
                                        ?->name
                                    ??
                                    'Participante',

                                'group_name' =>
                                    $result
                                        ->groupParticipant
                                        ->group
                                        ?->name,

                                'result_value' =>
                                    $result
                                        ->result_value,

                                'tiebreak_order' =>
                                    $result
                                        ->tiebreak_order,
                            ];
                        }
                    )
                    ->values()
                    ->all(),
        ];
    }

    private function nextAvailableLane(
        int $groupId
    ): int {
        $usedLanes =
            CompetitionEventGroupParticipant::where(
                'competition_event_group_id',
                $groupId
            )
            ->whereNotNull('lane')
            ->pluck('lane')
            ->map(
                fn ($lane) =>
                    (int) $lane
            )
            ->all();

        $lane = 1;

        while (
            in_array(
                $lane,
                $usedLanes,
                true
            )
        ) {
            $lane++;
        }

        return $lane;
    }
}