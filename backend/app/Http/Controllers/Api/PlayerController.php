<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Player;
use App\Models\Team;
use Illuminate\Http\Request;

class PlayerController extends Controller
{
    public function index()
    {
        return response()->json(
            Player::with([
                'team.organization',
                'team.category',
                'team.discipline'
            ])->get()
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'team_id' => 'required|exists:teams,id',
            'full_name' => 'required|string|max:255',
            'dni' => 'nullable|string|max:20|unique:players,dni',
            'college_id' => 'nullable|string|max:50',
            'age' => 'required|integer|min:1'
        ]);

        $team = Team::with('category')
            ->findOrFail($validated['team_id']);

        $category = $team->category;

        if (!$category || !$category->age_range) {
            return response()->json([
                'message' => 'La categoría no tiene rango de edad definido.'
            ], 422);
        }

        [$minAge, $maxAge] = explode('-', $category->age_range);

        $minAge = (int) $minAge;
        $maxAge = (int) $maxAge;

        $isEligible =
            $validated['age'] >= $minAge &&
            $validated['age'] <= $maxAge;

        if (!$isEligible) {
            return response()->json([
                'message' => 'La edad del jugador no corresponde a la categoría.'
            ], 422);
        }

        $player = Player::create([
            ...$validated,
            'is_eligible' => true
        ]);

        return response()->json($player, 201);
    }

    public function show($id)
    {
        return response()->json(
            Player::with([
                'team.organization',
                'team.category',
                'team.discipline'
            ])->findOrFail($id)
        );
    }

    public function update(Request $request, $id)
    {
        $player = Player::findOrFail($id);

        $validated = $request->validate([
            'team_id' => 'sometimes|exists:teams,id',
            'full_name' => 'sometimes|string|max:255',
            'dni' => 'nullable|string|max:20|unique:players,dni,' . $player->id,
            'college_id' => 'nullable|string|max:50',
            'age' => 'sometimes|integer|min:1'
        ]);

        $player->update($validated);

        return response()->json($player);
    }

    public function destroy($id)
    {
        $player = Player::findOrFail($id);

        $player->delete();

        return response()->json([
            'message' => 'Jugador eliminado correctamente'
        ]);
    }
}