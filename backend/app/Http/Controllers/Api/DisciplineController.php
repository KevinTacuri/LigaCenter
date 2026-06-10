<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Discipline;
use Illuminate\Http\Request;

class DisciplineController extends Controller
{
    public function index()
    {
        return response()->json(
            Discipline::with('teams')->get()
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'specific_rules' => 'nullable|string'
        ]);

        $discipline = Discipline::create($validated);

        return response()->json($discipline, 201);
    }

    public function show($id)
    {
        return response()->json(
            Discipline::with('teams')->findOrFail($id)
        );
    }

    public function update(Request $request, $id)
    {
        $discipline = Discipline::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'specific_rules' => 'nullable|string'
        ]);

        $discipline->update($validated);

        return response()->json($discipline);
    }

    public function destroy($id)
    {
        $discipline = Discipline::findOrFail($id);

        $discipline->delete();

        return response()->json([
            'message' => 'Disciplina eliminada correctamente'
        ]);
    }
}