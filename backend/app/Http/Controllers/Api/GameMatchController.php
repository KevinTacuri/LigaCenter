<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GameMatch;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class GameMatchController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $query = GameMatch::with(['localTeam', 'visitorTeam', 'venue', 'discipline', 'category']);

        if ($request->has('discipline_id')) {
            $query->where('discipline_id', $request->discipline_id);
        }
        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }
        if ($request->has('round')) {
            $query->where('round', $request->round);
        }
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $matches = $query->orderBy('match_date')->orderBy('match_time')->get();
        return $this->successResponse($matches, 'Partidos obtenidos exitosamente');
    }

    public function show($id)
    {
        $match = GameMatch::with(['localTeam', 'visitorTeam', 'venue', 'discipline', 'category'])->find($id);
        if (!$match) {
            return $this->errorResponse('Partido no encontrado', 404);
        }
        return $this->successResponse($match, 'Partido obtenido exitosamente');
    }

    public function update(Request $request, $id)
    {
        $match = GameMatch::find($id);
        if (!$match) {
            return $this->errorResponse('Partido no encontrado', 404);
        }

        $request->validate([
            'match_date' => 'date',
            'match_time' => 'string',
            'venue_id' => 'exists:venues,id',
            'status' => 'in:programado,en_curso,finalizado,cancelado',
        ]);

        $match->update($request->all());
        return $this->successResponse($match, 'Partido actualizado exitosamente');
    }

    public function reschedule(Request $request, $id)
    {
        $match = GameMatch::find($id);
        if (!$match) {
            return $this->errorResponse('Partido no encontrado', 404);
        }

        $request->validate([
            'match_date' => 'required|date',
            'match_time' => 'required|string',
            'venue_id' => 'required|exists:venues,id',
        ]);

        $match->update([
            'match_date' => $request->match_date,
            'match_time' => $request->match_time,
            'venue_id' => $request->venue_id,
            'status' => 'reprogramado',
        ]);

        return $this->successResponse($match, 'Partido reprogramado exitosamente');
    }
}