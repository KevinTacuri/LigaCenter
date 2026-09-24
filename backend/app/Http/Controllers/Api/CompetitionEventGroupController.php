<?php

namespace App\Http\Controllers\Api;

use App\Models\CompetitionEventGroup;
use App\Models\CompetitionEventStage;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class CompetitionEventGroupController extends Controller
{
    public function index(
        CompetitionEventStage $stage
    ) {
        $groups = $stage
            ->groups()
            ->with('venue')
            ->orderBy('group_number')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $groups,
        ]);
    }

    public function store(
        Request $request,
        CompetitionEventStage $stage
    ) {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
            ],

            'group_type' => [
                'required',
                'in:series,group',
            ],

            'group_number' => [
                'required',
                'integer',
                'min:1',
            ],

            'date' => [
                'nullable',
                'date',
            ],

            'start_time' => [
                'nullable',
                'date_format:H:i',
            ],

            'venue_id' => [
                'nullable',
                'exists:venues,id',
            ],

            'status' => [
                'nullable',
                'in:programado,en_curso,finalizado,cancelado',
            ],
        ]);

        $exists = CompetitionEventGroup::where(
            'competition_event_stage_id',
            $stage->id
        )
            ->where(
                'group_number',
                $validated['group_number']
            )
            ->exists();

        if ($exists) {
            return response()->json([
                'success' => false,
                'message' =>
                    'Ya existe un grupo o serie con ese número.',
            ], 422);
        }

        $group = $stage
            ->groups()
            ->create([
                'name' => $validated['name'],
                'group_type' => $validated['group_type'],
                'group_number' => $validated['group_number'],
                'date' => $validated['date'] ?? null,
                'start_time' =>
                    $validated['start_time'] ?? null,
                'venue_id' =>
                    $validated['venue_id'] ?? null,
                'status' =>
                    $validated['status'] ?? 'programado',
            ]);

        $group->load('venue');

        return response()->json([
            'success' => true,
            'message' =>
                'Grupo o serie creado correctamente.',
            'data' => $group,
        ], 201);
    }

    public function update(
        Request $request,
        CompetitionEventGroup $group
    ) {
        $validated = $request->validate([
            'name' => [
                'sometimes',
                'string',
                'max:255',
            ],

            'group_type' => [
                'sometimes',
                'in:series,group',
            ],

            'group_number' => [
                'sometimes',
                'integer',
                'min:1',
            ],

            'date' => [
                'sometimes',
                'nullable',
                'date',
            ],

            'start_time' => [
                'sometimes',
                'nullable',
                'date_format:H:i',
            ],

            'venue_id' => [
                'sometimes',
                'nullable',
                'exists:venues,id',
            ],

            'status' => [
                'sometimes',
                'in:programado,en_curso,finalizado,cancelado',
            ],
        ]);

        if (isset($validated['group_number'])) {
            $exists = CompetitionEventGroup::where(
                'competition_event_stage_id',
                $group->competition_event_stage_id
            )
                ->where(
                    'group_number',
                    $validated['group_number']
                )
                ->where('id', '!=', $group->id)
                ->exists();

            if ($exists) {
                return response()->json([
                    'success' => false,
                    'message' =>
                        'Ya existe un grupo o serie con ese número.',
                ], 422);
            }
        }

        $group->update($validated);

        $group->load('venue');

        return response()->json([
            'success' => true,
            'message' =>
                'Grupo o serie actualizado correctamente.',
            'data' => $group,
        ]);
    }

    public function destroy(
        CompetitionEventGroup $group
    ) {
        $group->delete();

        return response()->json([
            'success' => true,
            'message' =>
                'Grupo o serie eliminado correctamente.',
        ]);
    }
}