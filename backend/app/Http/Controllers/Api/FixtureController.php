<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\FixtureService;
use App\Services\SchedulingService;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class FixtureController extends Controller
{
    use ApiResponse;

    protected $fixtureService;
    protected $schedulingService;

    public function __construct(FixtureService $fixtureService, SchedulingService $schedulingService)
    {
        $this->fixtureService = $fixtureService;
        $this->schedulingService = $schedulingService;
    }

    #[OA\Post(
        path: '/api/fixture/generate',
        operationId: 'generateFixture',
        summary: 'Generar fixture',
        description: 'Genera el fixture completo usando el algoritmo Round Robin (todos contra todos).',
        tags: ['Fixture']
    )]
    #[OA\Security(name: 'sanctum')]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            required: ['discipline_id', 'category_id', 'start_date', 'venue_ids'],
            properties: [
                new OA\Property(property: 'discipline_id', type: 'integer', example: 1),
                new OA\Property(property: 'category_id', type: 'integer', example: 1),
                new OA\Property(property: 'start_date', type: 'string', format: 'date', example: '2026-06-15'),
                new OA\Property(property: 'venue_ids', type: 'array', items: new OA\Items(type: 'integer'), example: [1, 2])
            ]
        )
    )]
    #[OA\Response(response: 201, description: 'Fixture generado exitosamente')]
    #[OA\Response(response: 400, description: 'Error en la generación')]
    #[OA\Response(response: 422, description: 'Error de validación')]
    public function generate(Request $request)
    {
        $request->validate([
            'discipline_id' => 'required|exists:disciplines,id',
            'category_id' => 'required|exists:categories,id',
            'start_date' => 'required|date',
            'venue_ids' => 'required|array',
            'venue_ids.*' => 'exists:venues,id',
        ]);

        try {
            $matches = $this->fixtureService->generateRoundRobin(
                $request->discipline_id,
                $request->category_id,
                $request->start_date,
                $request->venue_ids
            );

            return $this->successResponse($matches, 'Fixture generado exitosamente', 201);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 400);
        }
    }

    #[OA\Get(
        path: '/api/fixture',
        operationId: 'getFixture',
        summary: 'Obtener fixture',
        description: 'Obtiene el fixture generado para una disciplina y categoría específicas.',
        tags: ['Fixture']
    )]
    #[OA\Security(name: 'sanctum')]
    #[OA\Parameter(
        name: 'discipline_id',
        description: 'ID de la disciplina',
        in: 'query',
        required: true,
        schema: new OA\Schema(type: 'integer')
    )]
    #[OA\Parameter(
        name: 'category_id',
        description: 'ID de la categoría',
        in: 'query',
        required: true,
        schema: new OA\Schema(type: 'integer')
    )]
    #[OA\Response(response: 200, description: 'Fixture obtenido exitosamente')]
    #[OA\Response(response: 422, description: 'Error de validación')]
    public function getFixture(Request $request)
    {
        $request->validate([
            'discipline_id' => 'required|exists:disciplines,id',
            'category_id' => 'required|exists:categories,id',
        ]);

        $fixture = $this->fixtureService->getFixture(
            $request->discipline_id,
            $request->category_id
        );

        return $this->successResponse($fixture, 'Fixture obtenido exitosamente');
    }

    #[OA\Post(
        path: '/api/fixture/schedule-round',
        operationId: 'scheduleRound',
        summary: 'Programar horarios',
        description: 'Asigna horarios y escenarios a los partidos de una fecha según su relevancia (suma de puntos).',
        tags: ['Fixture']
    )]
    #[OA\Security(name: 'sanctum')]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            required: ['discipline_id', 'category_id', 'round', 'available_hours', 'venue_ids'],
            properties: [
                new OA\Property(property: 'discipline_id', type: 'integer', example: 1),
                new OA\Property(property: 'category_id', type: 'integer', example: 1),
                new OA\Property(property: 'round', type: 'integer', example: 1),
                new OA\Property(property: 'available_hours', type: 'array', items: new OA\Items(type: 'string'), example: ['08:00', '10:00', '12:00']),
                new OA\Property(property: 'venue_ids', type: 'array', items: new OA\Items(type: 'integer'), example: [1, 2])
            ]
        )
    )]
    #[OA\Response(response: 200, description: 'Horarios asignados exitosamente')]
    #[OA\Response(response: 400, description: 'Error en la programación')]
    #[OA\Response(response: 422, description: 'Error de validación')]
    public function scheduleRound(Request $request)
    {
        $request->validate([
            'discipline_id' => 'required|exists:disciplines,id',
            'category_id' => 'required|exists:categories,id',
            'round' => 'required|integer|min:1',
            'available_hours' => 'required|array',
            'available_hours.*' => 'string',
            'venue_ids' => 'required|array',
            'venue_ids.*' => 'exists:venues,id',
        ]);

        try {
            $scheduled = $this->schedulingService->scheduleMatchesForRound(
                $request->discipline_id,
                $request->category_id,
                $request->round,
                $request->available_hours,
                $request->venue_ids
            );

            return $this->successResponse($scheduled, 'Horarios asignados exitosamente');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 400);
        }
    }
}