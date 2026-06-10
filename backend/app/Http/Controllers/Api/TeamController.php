<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Team;
use Illuminate\Http\Request;

class TeamController extends Controller
{
    public function index()
    {
        return response()->json(
            Team::with([
                'organization',
                'discipline',
                'category',
                'players'
            ])->get()
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'organization_id' => 'required|exists:organizations,id',
            'discipline_id' => 'required|exists:disciplines,id',
            'category_id' => 'required|exists:categories,id',
            'name' => 'required|string|max:255',
        ]);

        $team = Team::create([
            ...$validated,
            'registration_status' => 'pendiente'
        ]);

        return response()->json($team, 201);
    }

    public function show($id)
    {
        return response()->json(
            Team::with([
                'organization',
                'discipline',
                'category',
                'players'
            ])->findOrFail($id)
        );
    }

    public function update(Request $request, $id)
    {
        $team = Team::findOrFail($id);

        $validated = $request->validate([
            'organization_id' => 'sometimes|exists:organizations,id',
            'discipline_id' => 'sometimes|exists:disciplines,id',
            'category_id' => 'sometimes|exists:categories,id',
            'name' => 'sometimes|string|max:255',
            'registration_status' => 'sometimes|string|max:50'
        ]);

        $team->update($validated);

        return response()->json($team);
    }

    public function destroy($id)
    {
        $team = Team::findOrFail($id);

        $team->delete();

        return response()->json([
            'message' => 'Equipo eliminado correctamente'
        ]);
    }
}