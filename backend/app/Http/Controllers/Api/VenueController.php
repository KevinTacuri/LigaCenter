<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Venue;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class VenueController extends Controller
{
    use ApiResponse;

    public function index()
    {
        $venues = Venue::all();
        return $this->successResponse($venues, 'Escenarios obtenidos exitosamente');
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'venue_type' => 'required|string',
            'location' => 'required|string',
            'capacity' => 'nullable|integer',
            'is_available' => 'boolean',
        ]);

        $venue = Venue::create($request->all());
        return $this->successResponse($venue, 'Escenario creado exitosamente', 201);
    }

    public function show($id)
    {
        $venue = Venue::find($id);
        if (!$venue) {
            return $this->errorResponse('Escenario no encontrado', 404);
        }
        return $this->successResponse($venue, 'Escenario obtenido exitosamente');
    }

    public function update(Request $request, $id)
    {
        $venue = Venue::find($id);
        if (!$venue) {
            return $this->errorResponse('Escenario no encontrado', 404);
        }

        $request->validate([
            'name' => 'string|max:255',
            'venue_type' => 'string',
            'location' => 'string',
            'capacity' => 'nullable|integer',
            'is_available' => 'boolean',
        ]);

        $venue->update($request->all());
        return $this->successResponse($venue, 'Escenario actualizado exitosamente');
    }

    public function destroy($id)
    {
        $venue = Venue::find($id);
        if (!$venue) {
            return $this->errorResponse('Escenario no encontrado', 404);
        }

        $venue->delete();
        return $this->successResponse(null, 'Escenario eliminado exitosamente');
    }

    public function getAvailableVenues()
    {
        $venues = Venue::where('is_available', true)->get();
        return $this->successResponse($venues, 'Escenarios disponibles obtenidos');
    }
}