<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Venue;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class VenueController extends Controller
{
    use ApiResponse;

    #[OA\Get(
        path: '/api/venues',
        operationId: 'getVenues',
        summary: 'Listar escenarios',
        description: 'Obtiene una lista de todos los escenarios deportivos.',
        tags: ['Escenarios']
    )]
    #[OA\Parameter(
        name: 'championship_id',
        description: 'ID del campeonato (opcional)',
        in: 'query',
        required: false,
        schema: new OA\Schema(type: 'integer')
    )]
    #[OA\Security(name: 'sanctum')]
    #[OA\Response(
        response: 200,
        description: 'Escenarios obtenidos exitosamente'
    )]
    public function index(Request $request)
    {
        $query = Venue::query();

        if ($request->has('championship_id')) {
            $query->where('championship_id', $request->championship_id);
        }

        $venues = $query->get();

        return $this->successResponse($venues, 'Escenarios obtenidos exitosamente');
    }

    #[OA\Post(
        path: '/api/venues',
        operationId: 'createVenue',
        summary: 'Crear escenario',
        description: 'Registra un nuevo escenario deportivo en el sistema.',
        tags: ['Escenarios']
    )]
    #[OA\Security(name: 'sanctum')]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            required: ['name', 'venue_type', 'location', 'championship_id'],
            properties: [
                new OA\Property(property: 'championship_id', type: 'integer', example: 1),
                new OA\Property(property: 'name', type: 'string', example: 'Estadio Nacional'),
                new OA\Property(property: 'venue_type', type: 'string', example: 'estadio'),
                new OA\Property(property: 'location', type: 'string', example: 'Lima'),
                new OA\Property(property: 'capacity', type: 'integer', example: 50000),
                new OA\Property(property: 'is_available', type: 'boolean', example: true)
            ]
        )
    )]
    #[OA\Response(response: 201, description: 'Escenario creado exitosamente')]
    #[OA\Response(response: 422, description: 'Error de validación')]
    public function store(Request $request)
    {
        $request->validate([
            'championship_id' => 'required|exists:championships,id',
            'name' => 'required|string|max:255',
            'venue_type' => 'required|string',
            'location' => 'required|string',
            'capacity' => 'nullable|integer',
            'is_available' => 'boolean',
        ]);

        $venue = Venue::create($request->all());
        return $this->successResponse($venue, 'Escenario creado exitosamente', 201);
    }

    #[OA\Get(
        path: '/api/venues/{id}',
        operationId: 'getVenueById',
        summary: 'Obtener escenario',
        description: 'Obtiene la información detallada de un escenario deportivo.',
        tags: ['Escenarios']
    )]
    #[OA\Security(name: 'sanctum')]
    #[OA\Parameter(
        name: 'id',
        description: 'ID del escenario',
        in: 'path',
        required: true,
        schema: new OA\Schema(type: 'integer')
    )]
    #[OA\Response(response: 200, description: 'Escenario obtenido exitosamente')]
    #[OA\Response(response: 404, description: 'Escenario no encontrado')]
    public function show($id)
    {
        $venue = Venue::find($id);
        if (!$venue) {
            return $this->errorResponse('Escenario no encontrado', 404);
        }
        return $this->successResponse($venue, 'Escenario obtenido exitosamente');
    }

    #[OA\Put(
        path: '/api/venues/{id}',
        operationId: 'updateVenue',
        summary: 'Actualizar escenario',
        description: 'Actualiza la información de un escenario deportivo.',
        tags: ['Escenarios']
    )]
    #[OA\Security(name: 'sanctum')]
    #[OA\Parameter(
        name: 'id',
        in: 'path',
        required: true,
        schema: new OA\Schema(type: 'integer')
    )]
    #[OA\RequestBody(
        required: false,
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: 'name', type: 'string', example: 'Estadio Monumental'),
                new OA\Property(property: 'venue_type', type: 'string', example: 'estadio'),
                new OA\Property(property: 'location', type: 'string', example: 'Arequipa'),
                new OA\Property(property: 'capacity', type: 'integer', example: 60000),
                new OA\Property(property: 'is_available', type: 'boolean', example: false)
            ]
        )
    )]
    #[OA\Response(response: 200, description: 'Escenario actualizado exitosamente')]
    #[OA\Response(response: 404, description: 'Escenario no encontrado')]
    #[OA\Response(response: 422, description: 'Error de validación')]
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

    #[OA\Delete(
        path: '/api/venues/{id}',
        operationId: 'deleteVenue',
        summary: 'Eliminar escenario',
        description: 'Elimina un escenario deportivo del sistema.',
        tags: ['Escenarios']
    )]
    #[OA\Security(name: 'sanctum')]
    #[OA\Parameter(
        name: 'id',
        in: 'path',
        required: true,
        schema: new OA\Schema(type: 'integer')
    )]
    #[OA\Response(response: 200, description: 'Escenario eliminado exitosamente')]
    #[OA\Response(response: 404, description: 'Escenario no encontrado')]
    public function destroy($id)
    {
        $venue = Venue::find($id);
        if (!$venue) {
            return $this->errorResponse('Escenario no encontrado', 404);
        }

        $venue->delete();
        return $this->successResponse(null, 'Escenario eliminado exitosamente');
    }

    #[OA\Get(
        path: '/api/venues-available',
        operationId: 'getAvailableVenues',
        summary: 'Escenarios disponibles',
        description: 'Obtiene una lista de escenarios deportivos disponibles.',
        tags: ['Escenarios']
    )]
    #[OA\Parameter(
        name: 'championship_id',
        description: 'ID del campeonato (opcional)',
        in: 'query',
        required: false,
        schema: new OA\Schema(type: 'integer')
    )]
    #[OA\Security(name: 'sanctum')]
    #[OA\Response(
        response: 200,
        description: 'Escenarios disponibles obtenidos exitosamente'
    )]
    public function getAvailableVenues(Request $request)
    {
        $query = Venue::where('is_available', true);

        if ($request->has('championship_id')) {
            $query->where('championship_id', $request->championship_id);
        }

        $venues = $query->get();

        return $this->successResponse($venues, 'Escenarios disponibles obtenidos');
    }
}